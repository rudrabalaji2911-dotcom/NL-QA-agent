import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserSimulator } from '../../src/utils/browserSimulator';

// Mock playwright so tests don't fetch or open browser processes
vi.mock('playwright', () => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(null),
    locator: vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(0),
      first: vi.fn().mockReturnValue({
        isVisible: vi.fn().mockResolvedValue(false),
        fill: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined)
      })
    }),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('mock_png_bin')),
    url: vi.fn().mockReturnValue('http://localhost:3000/demo')
  };

  const mockContext = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined)
  };

  const mockBrowser = {
    newContext: vi.fn().mockResolvedValue(mockContext),
    close: vi.fn().mockResolvedValue(undefined)
  };

  return {
    chromium: {
      launch: vi.fn().mockResolvedValue(mockBrowser)
    }
  };
});

describe('BrowserSimulator (Vitest)', () => {
  let simulator: BrowserSimulator;

  beforeEach(() => {
    vi.clearAllMocks();
    simulator = new BrowserSimulator('test-run-id', 'test-user-id');
  });

  it('should initialize and hold logs', () => {
    const logs = simulator.getLogs();
    expect(logs).toBeDefined();
    expect(logs.length).toBe(0);
  });

  describe('open_url Action', () => {
    it('should map standard demo or example domain requests to localhost:3000/demo', async () => {
      const step = {
        step_number: 1,
        action: 'open_url' as const,
        target: 'https://demo.example.com',
        value: null,
        timeout_seconds: 15,
        retry: 0,
        screenshot_on: 'never' as const
      };

      const result = await simulator.open_url('https://demo.example.com', step);
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Successfully loaded page');
      
      const logs = simulator.getLogs();
      const hasMappingLog = logs.some(log => log.message.includes('Mapping standard demo sandbox URL to dynamic local server'));
      expect(hasMappingLog).toBe(true);
    });

    it('should prepend https:// protocol automatically if missing from raw target URLs', async () => {
      const step = {
        step_number: 1,
        action: 'open_url' as const,
        target: 'my-retail-site.com',
        value: null,
        timeout_seconds: 15,
        retry: 0,
        screenshot_on: 'never' as const
      };

      const result = await simulator.open_url('my-retail-site.com', step);
      expect(result.status).toBe('ok');
      
      const logs = simulator.getLogs();
      const hasPrependLog = logs.some(log => log.message.includes('Auto-prepended protocol'));
      expect(hasPrependLog).toBe(true);
    });

    it('should fail immediately when explicit "fail" or "offline" keywords are provided in url', async () => {
      const step = {
        step_number: 1,
        action: 'open_url' as const,
        target: 'https://invalid-host-will-fail.com',
        value: null,
        timeout_seconds: 15,
        retry: 0,
        screenshot_on: 'never' as const
      };

      await expect(simulator.open_url('https://invalid-host-will-fail.com', step)).rejects.toThrow();
      
      const logs = simulator.getLogs();
      const errorLog = logs.find(log => log.level === 'error');
      expect(errorLog).toBeDefined();
      expect(errorLog?.message).toContain('Target host or domain reachable state offline');
    });
  });
});
