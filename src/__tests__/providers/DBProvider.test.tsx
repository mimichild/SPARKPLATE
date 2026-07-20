jest.mock('expo-sqlite');

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { openDatabaseAsync } from 'expo-sqlite';
import { DBProvider, useDBContext, useDBReload } from '@/providers/DBProvider';

const mockOpenDb = openDatabaseAsync as jest.Mock;

function makeMockDb() {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: 5 }),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
}

let capturedDb: unknown;
let capturedReload: (() => Promise<void>) | undefined;

function Probe() {
  capturedDb = useDBContext();
  capturedReload = useDBReload();
  return <Text>ready</Text>;
}

describe('DBProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDb = undefined;
    capturedReload = undefined;
  });

  it('opens a connection on mount and exposes it via useDBContext', async () => {
    const db1 = makeMockDb();
    mockOpenDb.mockResolvedValueOnce(db1);

    render(<DBProvider><Probe /></DBProvider>);

    await waitFor(() => expect(capturedDb).toBe(db1));
  });

  it('reloadDB opens a fresh connection and updates context without unmounting children', async () => {
    const db1 = makeMockDb();
    const db2 = makeMockDb();
    mockOpenDb.mockResolvedValueOnce(db1).mockResolvedValueOnce(db2);

    const { queryByText } = render(<DBProvider><Probe /></DBProvider>);
    await waitFor(() => expect(capturedDb).toBe(db1));

    await act(async () => {
      await capturedReload!();
    });

    expect(capturedDb).toBe(db2);
    // 重新連線期間 children 不應該被整個卸載重掛（避免畫面閃爍/導航狀態遺失）。
    expect(queryByText('ready')).not.toBeNull();
  });

  it('a closed connection replaced via reloadDB is no longer referenced by consumers', async () => {
    const db1 = makeMockDb();
    const db2 = makeMockDb();
    mockOpenDb.mockResolvedValueOnce(db1).mockResolvedValueOnce(db2);

    render(<DBProvider><Probe /></DBProvider>);
    await waitFor(() => expect(capturedDb).toBe(db1));

    await act(async () => {
      await db1.closeAsync();
      await capturedReload!();
    });

    expect(capturedDb).toBe(db2);
    expect(capturedDb).not.toBe(db1);
  });
});
