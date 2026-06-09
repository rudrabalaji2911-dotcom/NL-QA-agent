import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbService } from '../../src/db/dbService';
import fs from 'fs';

// Mock the fs module to prevent writing unit tests data to disk
vi.mock('fs', () => {
  let mockDbData = JSON.stringify({
    users: [
      {
        id: 'test-user-id',
        full_name: 'Test QA Engineer',
        email: 'test@example.com',
        password_hash: 'some_hash',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    test_cases: [
      {
        id: 'test-case-1',
        user_id: 'test-user-id',
        title: 'Initial Test Case',
        test_prompt: 'Open localhost and click submit',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    test_runs: [
      {
        id: 'test-run-1',
        test_case_id: 'test-case-1',
        user_id: 'test-user-id',
        status: 'Passed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        execution_time: 12,
        final_result: 'Passed'
      },
      {
        id: 'test-run-2',
        test_case_id: 'test-case-1',
        user_id: 'test-user-id',
        status: 'Failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        execution_time: 18,
        final_result: 'Failed'
      }
    ],
    execution_steps: [],
    verifications: [],
    screenshots: [],
    ai_suggestions: [],
    reports: []
  });

  return {
    default: {
      existsSync: vi.fn().mockReturnValue(true),
      readFileSync: vi.fn().mockImplementation(() => mockDbData),
      writeFileSync: vi.fn().mockImplementation((path, data) => {
        mockDbData = data;
        return true;
      }),
      mkdirSync: vi.fn()
    }
  };
});

describe('DbService (Vitest)', () => {
  beforeEach(() => {
    // Reset or reload the instance state before each run
    vi.clearAllMocks();
  });

  describe('User Operations', () => {
    it('should retrieve standard and pre-seeded users by email', () => {
      const user = dbService.getUserByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user?.full_name).toBe('Test QA Engineer');
      expect(user?.id).toBe('test-user-id');
    });

    it('should throw an error when creating a user that already exists', () => {
      expect(() => {
        dbService.createUser('test@example.com', 'New Name', 'new_hash');
      }).toThrowError('User already exists with this email');
    });

    it('should register a new user successfully', () => {
      const newUser = dbService.createUser('fresh@example.com', 'Fresh User', 'pass_hash_123');
      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('fresh@example.com');
      expect(dbService.getUserByEmail('fresh@example.com')).toBeDefined();
    });

    it('should update pre-seeded user passwords', () => {
      const updated = dbService.updatePreSeededUser('test@example.com', 'Test Updated', 'custom_hash_999');
      expect(updated.full_name).toBe('Test Updated');
      expect(updated.password_hash).toBe('custom_hash_999');
    });
  });

  describe('Test Case & Statistics Operations', () => {
    it('should create a test case successfully', () => {
      const newTc = dbService.createTestCase('test-user-id', 'Login Verification', 'Verify redirect to dashboard');
      expect(newTc).toBeDefined();
      expect(newTc.title).toBe('Login Verification');
      
      const userCases = dbService.getTestCases('test-user-id');
      expect(userCases.some(tc => tc.title === 'Login Verification')).toBe(true);
    });

    it('should calculate accurate user stats for the dashboard', () => {
      const stats = dbService.getUserStats('test-user-id');
      expect(stats.totalRuns).toBe(2);
      expect(stats.passedRuns).toBe(1);
      expect(stats.failedRuns).toBe(1);
      expect(stats.passRate).toBe(50);
      expect(stats.averageExecutionTime).toBe(15); // (12 + 18) / 2 = 15
    });
  });
});
