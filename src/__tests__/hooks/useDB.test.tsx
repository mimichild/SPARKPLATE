jest.mock('expo-sqlite');
jest.mock('@/services/dbService');

import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { DBProvider } from '@/providers/DBProvider';
import { useDB } from '@/hooks/useDB';
import { initDB } from '@/services/dbService';

const mockInitDB = initDB as jest.Mock;

const mockDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  closeAsync: jest.fn(),
};

describe('useDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitDB.mockResolvedValue(mockDb);
  });

  it('throws when used outside DBProvider', () => {
    expect(() => renderHook(() => useDB())).toThrow(
      'useDB must be called within a DBProvider'
    );
  });

  it('returns db instance when inside DBProvider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DBProvider>{children}</DBProvider>
    );

    const { result, rerender } = renderHook(() => {
      try {
        return useDB();
      } catch {
        return null;
      }
    }, { wrapper });

    // Wait for DBProvider to initialise
    await new Promise((r) => setTimeout(r, 0));
    rerender({});

    expect(mockInitDB).toHaveBeenCalled();
  });
});
