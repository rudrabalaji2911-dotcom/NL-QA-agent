import React, { useState } from 'react';
import { 
  Terminal, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Settings2, 
  Play, 
  Laptop, 
  CheckCircle2, 
  Globe, 
  KeyRound,
  AlertTriangle 
} from 'lucide-react';
import { ActionPlan } from '../types';

interface CreateTestProps {
  userToken: string;
  onExecutionStarted: (runId: string, plan: ActionPlan) => void;
}

export default function CreateTest({ userToken, onExecutionStarted }: CreateTestProps) {
  const [testName, setTestName] = useState('Verify items purchase flow');
  const [sampleUrl, setSampleUrl] = useState('https://demo.example.com');
  const [prompt, setPrompt] = useState('Login as user, add 2 items to cart, checkout, expect order confirmation');
  const [credentials, setCredentials] = useState('demo_secure_token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<ActionPlan | null>(null);

  // AI Configuration Settings
  const [llmProvider, setLlmProvider] = useState(() => localStorage.getItem('qa_llm_provider') || 'gemini');
  const [ollamaUrl, setOllamaUrl] = useState(() => localStorage.getItem('qa_ollama_url') || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('qa_ollama_model') || 'mistral');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleLlmProviderChange = (provider: string) => {
    setLlmProvider(provider);
    localStorage.setItem('qa_llm_provider', provider);
  };

  const handleOllamaUrlChange = (url: string) => {
    setOllamaUrl(url);
    localStorage.setItem('qa_ollama_url', url);
  };

  const handleOllamaModelChange = (model: string) => {
    setOllamaModel(model);
    localStorage.setItem('qa_ollama_model', model);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName || !prompt) {
      setError('Please provide a name and the natural language instructions.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedPlan(null);

    try {
      const res = await fetch('/api/tests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: testName,
          test_prompt: prompt,
          sample_app: sampleUrl,
          llm_config: {
            provider: llmProvider,
            ollamaUrl,
            ollamaModel
          }
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to interpret prompt');
      }

      setGeneratedPlan(data.action_plan);
    } catch (err: any) {
      setError(err.message || 'Connecting to backend engine failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!generatedPlan) return;
    setLoading(true);

    try {
      const res = await fetch('/api/execution/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          prompt: prompt,
          title: testName,
          sample_app_url: sampleUrl,
          credentials: credentials,
          action_plan: generatedPlan,
          llm_config: {
            provider: llmProvider,
            ollamaUrl,
            ollamaModel
          }
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start execution');
      }

      // Transition to active Execution screen
      onExecutionStarted(data.test_run_id, data.action_plan);
    } catch (err: any) {
      setError(err.message || 'Failed to spark browser execution.');
      setLoading(false);
    }
  };

  return (
    <div id="create-test-view" className="p-8 pb-16 space-y-8 text-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interactive NL Execution Wizard</h1>
        <p className="text-sm text-slate-400 mt-1">Design, inspect, and dry-run user journeys on sandbox web clients dynamically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Input Configuration */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight uppercase text-slate-400">Configure Sandbox Journey</h3>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Test Case Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">TEST SCENARIO TITLE</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Purchase gadget checkout test"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Target URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">TARGET DOMAIN URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={sampleUrl}
                    onChange={(e) => setSampleUrl(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">CREDENTIALS TOKEN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
                    placeholder="Masked (encrypted reference)"
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* NL prompt input instructions */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                <span>ENGLISH INSTRUCTIONS (NATURAL LANGUAGE)</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                  {llmProvider === 'gemini' ? 'GEMINI GENERATOR' : `OLLAMA: ${ollamaModel.toUpperCase()}`}
                </span>
              </label>
              <textarea
                required
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Write plain English sequence (e.g. load example.com, click on login button, fill inputs, confirm shopping dashboard)"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none resize-none font-sans leading-relaxed"
              ></textarea>
            </div>

            {/* Collapsible Advanced AI Settings */}
            <div className="border border-slate-850 rounded-lg p-3.5 bg-slate-900/40">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full flex items-center justify-between text-xs font-bold tracking-tight uppercase text-slate-400 focus:outline-none"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-400" />
                  <span>AI Engine Settings</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {llmProvider === 'gemini' ? 'Google Gemini' : `Ollama (${ollamaModel})`} {showAdvancedSettings ? '▲' : '▼'}
                </span>
              </button>

              {showAdvancedSettings && (
                <div id="ai-advanced-settings-panel" className="mt-4 pt-3 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1.5 uppercase">Select LLM Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleLlmProviderChange('gemini')}
                        className={`py-2 px-3 rounded-md text-xs font-semibold text-center border transition-all cursor-pointer ${
                          llmProvider === 'gemini'
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Gemini (Cloud)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLlmProviderChange('ollama')}
                        className={`py-2 px-3 rounded-md text-xs font-semibold text-center border transition-all cursor-pointer ${
                          llmProvider === 'ollama'
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400'
                            : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Ollama (Local)
                      </button>
                    </div>
                  </div>

                  {llmProvider === 'ollama' && (
                    <div className="space-y-3 pt-2 border-t border-slate-850">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                          <span>OLLAMA HOST URL</span>
                          <span className="text-[9px] text-indigo-400 font-mono lower">NEEDS PUBLIC URL</span>
                        </label>
                        <input
                          type="text"
                          required={llmProvider === 'ollama'}
                          value={ollamaUrl}
                          onChange={(e) => handleOllamaUrlChange(e.target.value)}
                          placeholder="e.g. http://localhost:11434"
                          className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Config Tip: Local endpoints like <span className="font-mono">localhost</span> cannot be contacted by the cloud backend. Map local Ollama port 11434 via a tunnel (e.g., ngrok) and enter the public URL here.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1.5">MODEL TAG NAME</label>
                        <input
                          type="text"
                          required={llmProvider === 'ollama'}
                          value={ollamaModel}
                          onChange={(e) => handleOllamaModelChange(e.target.value)}
                          placeholder="e.g. mistral, llama3, phi3"
                          className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-slate-500 leading-normal">
                          Download using <span className="font-mono bg-slate-900 border border-slate-800 p-0.5 px-1 rounded text-indigo-400">ollama run {ollamaModel}</span> first.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
              <span>{loading ? 'Synthesizing instructions...' : `Translate to Action Plan (${llmProvider === 'gemini' ? 'Gemini' : 'Ollama'})`}</span>
            </button>
          </form>

          {/* Quick Sandbox Help Info */}
          <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800/80 text-xs text-slate-400 leading-relaxed font-sans mt-6">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>Built-in E-Commerce Sandbox</span>
            </p>
            When utilizing <span className="text-emerald-400 font-mono">https://demo.example.com</span>, candidates add headphones and keyboards directly in the live browser view, validating logins and checkouts immediately.
          </div>

        </div>

        {/* Right Output AI Generation Representation */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850 mb-5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold tracking-tight uppercase text-slate-400">AI Plan Interpretation</h3>
            </div>

            {!generatedPlan ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-[#0F172A]/40 border border-dashed border-slate-800 rounded-lg">
                <Sparkles className="w-10 h-10 text-indigo-400/30 animate-pulse mb-3" />
                <p className="text-sm font-semibold text-slate-300">Awaiting Action Plan Synthesis</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">Provide test constraints on the left panel, and click Translate. Gemini will instantly compile the formal action plan.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-3 bg-[#0F172A] border border-slate-850 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">TEST NAME</p>
                    <p className="text-sm font-bold text-white mt-0.5">{generatedPlan.test_name}</p>
                  </div>
                  <div className="p-1 px-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                    VALIDATED
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Steps Stepper</p>
                  
                  {/* Stepper Steps List */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 select-none">
                    {generatedPlan.steps.map((st) => (
                      <div key={st.step_number} className="p-2.5 rounded bg-[#0F172A] border border-slate-850 flex items-start gap-3">
                        <span className="w-5 h-5 rounded bg-slate-800 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">{st.step_number}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-200">
                            <span className="text-indigo-400 font-mono text-[10px] uppercase border border-indigo-500/10 bg-indigo-500/5 px-1 py-0.5 rounded mr-1.5">{st.action}</span>
                            <span className="font-mono text-slate-300 text-xs shrink-0 select-all">{st.target}</span>
                          </p>
                          {st.value && (
                            <p className="text-[10px] text-slate-500 font-mono mt-1 break-all">value: "{st.value || 'null'}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected validations */}
                <div className="space-y-2 pt-3 border-t border-slate-850">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Post-Run Assertions</p>
                  <div className="space-y-1.5">
                    {generatedPlan.verifications.map((ver, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Assertion Step {ver.step_number}: {ver.type.toUpperCase()} check for text "<span className="font-mono italic text-slate-200">{ver.expected}</span>"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {generatedPlan && (
            <div className="pt-6 border-t border-slate-850 mt-6 shrink-0">
              <button
                onClick={handleExecute}
                className="w-full bg-[#6366F1] hover:bg-indigo-600 font-bold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all text-white cursor-pointer"
              >
                <Play className="w-4.5 h-4.5" />
                <span>Launch Live Automation Session</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
