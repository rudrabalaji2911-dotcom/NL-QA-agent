import React, { useState, useEffect } from 'react';
import { 
  Play, 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  Trash2,
  RefreshCw 
} from 'lucide-react';

interface RunRecord {
  id: string;
  title: string;
  status: 'Pending' | 'Running' | 'Passed' | 'Failed';
  started_at: string;
  execution_time?: number;
  final_result?: 'Passed' | 'Failed';
}

interface TestHistoryProps {
  userToken: string;
  onSelectRun: (runId: string) => void;
}

export default function TestHistory({ userToken, onSelectRun }: TestHistoryProps) {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple';
    targetId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'single',
    title: '',
    message: ''
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/execution/history', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      setRuns(data);
    } catch (e) {
      console.error('Failed to load test runs history profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userToken]);

  const handleClearHistory = (runId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      type: 'single',
      targetId: runId,
      title: 'Delete Test Execution Record',
      message: 'Are you sure you want to permanently delete this test execution record? This action cannot be undone and will delete all associated audit logs, reports, and screenshots/artifacts.'
    });
  };

  const handleClearSelected = () => {
    if (selectedRuns.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'multiple',
      title: 'Delete Selected Test Records',
      message: `Are you sure you want to permanently delete the ${selectedRuns.length} selected test execution records? This action cannot be undone.`
    });
  };

  const executeClearHistory = async (runId: string) => {
    try {
      const res = await fetch(`/api/execution/${runId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        setRuns(prev => prev.filter(r => r.id !== runId));
        setSelectedRuns(prev => prev.filter(id => id !== runId));
      }
    } catch (err) {
      console.error('Failed to clear run object', err);
    }
  };

  const executeClearSelected = async () => {
    try {
      const res = await fetch('/api/execution/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ ids: selectedRuns })
      });
      if (res.ok) {
        setRuns(prev => prev.filter(r => !selectedRuns.includes(r.id)));
        setSelectedRuns([]);
      }
    } catch (err) {
      console.error('Failed to delete multiple runs', err);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'single' && confirmModal.targetId) {
      await executeClearHistory(confirmModal.targetId);
    } else if (confirmModal.type === 'multiple') {
      await executeClearSelected();
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleToggleSelect = (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRuns(prev => 
      prev.includes(runId) ? prev.filter(id => id !== runId) : [...prev, runId]
    );
  };

  const filteredRuns = runs.filter(run => 
    run.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredRuns.map(r => r.id);
    const elementsSelected = allFilteredIds.filter(id => selectedRuns.includes(id));
    
    if (elementsSelected.length === allFilteredIds.length) {
      // De-select all filtered items
      setSelectedRuns(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered items (merge with existing selected items if any)
      setSelectedRuns(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  return (
    <div id="test-history-view" className="p-8 pb-16 space-y-8 text-[#F8FAFC]">
      
      {/* Header bar section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Run Ledger History</h1>
          <p className="text-sm text-slate-400 mt-1">Audit, inspect, and compare details of all executed test runs and automation suites.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Reload history table"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <Search className="w-4.5 h-4.5 text-slate-500 ml-1 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter logs by test title, execution ID, or outcome details..."
          className="w-full bg-[#0F172A] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
        />
      </div>

      {/* SELECTION ACTIONS BAR */}
      {selectedRuns.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-slate-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold">
              Selected <span className="text-red-400 font-mono font-bold text-sm">{selectedRuns.length}</span> test history run{selectedRuns.length === 1 ? '' : 's'} for permanent deletion
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedRuns([])}
              className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleClearSelected}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs border border-red-500/30 shadow-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* LEDGER DATA TABLE */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-sm overflow-hidden select-none">
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            <span className="animate-pulse">Retrieving test audit record ledger...</span>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-20 text-center">
            <History className="w-10 h-10 text-indigo-400/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No test executions found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Either search query mismatch or no automation sessions initialized for this account yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold tracking-wider uppercase select-none">
                  <th className="py-4 px-6 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-4 h-4 accent-indigo-500"
                      checked={filteredRuns.length > 0 && filteredRuns.every(r => selectedRuns.includes(r.id))}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="py-4 px-6">Test Run Identification</th>
                  <th className="py-4 px-6">Outcome Status</th>
                  <th className="py-4 px-6 hidden sm:table-cell">Trigger Date</th>
                  <th className="py-4 px-6 hidden md:table-cell">Duration</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {filteredRuns.map((record) => (
                  <tr 
                    key={record.id}
                    className={`hover:bg-[#0F172A]/30 transition-colors cursor-pointer group ${selectedRuns.includes(record.id) ? 'bg-indigo-600/5' : ''}`}
                  >
                    {/* Checkbox cell */}
                    <td className="py-4.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-4 h-4 accent-indigo-500"
                        checked={selectedRuns.includes(record.id)}
                        onChange={(e) => handleToggleSelect(record.id, e as any)}
                      />
                    </td>

                    {/* ID & Title */}
                    <td onClick={() => onSelectRun(record.id)} className="py-4.5 px-6 max-w-sm">
                      <p className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{record.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">id: {record.id}</p>
                    </td>

                    {/* Status badge */}
                    <td onClick={() => onSelectRun(record.id)} className="py-4.5 px-6">
                      {record.status === 'Passed' || record.final_result === 'Passed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Passed</span>
                        </span>
                      ) : record.status === 'Failed' || record.final_result === 'Failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      ) : record.status === 'Running' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse">
                          <span>Running</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Trigger Date timestamp */}
                    <td onClick={() => onSelectRun(record.id)} className="py-4.5 px-6 text-slate-400 hidden sm:table-cell font-mono">
                      {new Date(record.started_at).toLocaleString()}
                    </td>

                    {/* Duration seconds */}
                    <td onClick={() => onSelectRun(record.id)} className="py-4.5 px-6 text-slate-400 hidden md:table-cell font-mono">
                      {record.execution_time ? `${record.execution_time} seconds` : '---'}
                    </td>

                    {/* Actions column */}
                    <td className="py-4.5 px-6 text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectRun(record.id)}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          title="Open report page"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleClearHistory(record.id, e)}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/80 hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete test history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sleek Custom confirmation dialogue overlay */}
      {confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172AC5] backdrop-blur-xs animate-fadeIn"
          onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="bg-[#1E293B] border border-slate-700/85 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl relative animate-scaleIn text-left"
            onClick={(e) => e.stopPropagation()}
            id="delete-confirmation-dialog"
          >
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded-lg cursor-pointer transition-colors"
                id="cancel-delete-history-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 text-[10px] font-bold text-white bg-red-650 hover:bg-red-500 rounded-lg cursor-pointer transition-colors border border-red-500/20 shadow-md"
                id="confirm-delete-history-btn"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
