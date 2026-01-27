/**
 * Mock Database Helper for Kysely
 * 
 * Creates chainable mocks for Kysely database operations.
 * Supports: selectFrom, insertInto, updateTable, deleteFrom chains
 */

import { vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChainableMock = Record<string, any>;

/**
 * Creates a chainable mock for Kysely database operations
 * that returns the specified value(s) on execute calls.
 */
export function mockKyselyChain<T>(returnValue: T | T[] | null = null): ChainableMock {
  const chain: ChainableMock = {};
  
  const chainMethods = [
    // Select chain
    'selectFrom', 'select', 'selectAll', 'where', 'whereRef',
    'orderBy', 'limit', 'offset', 'groupBy', 'having',
    'innerJoin', 'leftJoin', 'rightJoin', 'fullJoin', 'on',
    // Insert chain
    'insertInto', 'values', 'returning', 'onConflict', 'doNothing', 'doUpdateSet',
    // Update chain
    'updateTable', 'set',
    // Delete chain
    'deleteFrom',
    // Transaction
    'transaction',
  ];
  
  // Create chainable methods that return self
  for (const method of chainMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  
  // Execution methods return actual values
  const arrayResult = Array.isArray(returnValue) ? returnValue : returnValue ? [returnValue] : [];
  const singleResult = Array.isArray(returnValue) ? returnValue[0] : returnValue;
  
  chain.execute = vi.fn().mockResolvedValue(arrayResult);
  chain.executeTakeFirst = vi.fn().mockResolvedValue(singleResult);
  chain.executeTakeFirstOrThrow = vi.fn().mockImplementation(async () => {
    if (!singleResult) {
      throw new Error('No result found');
    }
    return singleResult;
  });
  
  return chain;
}

/**
 * Creates a full db mock object with all common Kysely methods
 */
export function createMockDb() {
  const defaultChain = mockKyselyChain(null);
  
  return {
    selectFrom: vi.fn().mockReturnValue(defaultChain),
    insertInto: vi.fn().mockReturnValue(defaultChain),
    updateTable: vi.fn().mockReturnValue(defaultChain),
    deleteFrom: vi.fn().mockReturnValue(defaultChain),
    transaction: vi.fn().mockReturnValue({
      execute: vi.fn().mockImplementation(async (callback: (trx: ReturnType<typeof createMockDb>) => Promise<unknown>) => {
        const trx = createMockDb();
        return callback(trx);
      }),
    }),
    fn: {
      count: vi.fn().mockReturnValue({ as: vi.fn() }),
      countAll: vi.fn().mockReturnValue({ as: vi.fn() }),
      sum: vi.fn().mockReturnValue({ as: vi.fn() }),
      avg: vi.fn().mockReturnValue({ as: vi.fn() }),
      max: vi.fn().mockReturnValue({ as: vi.fn() }),
      min: vi.fn().mockReturnValue({ as: vi.fn() }),
      now: vi.fn().mockReturnValue(new Date()),
    },
    dynamic: {
      ref: vi.fn().mockReturnValue('column'),
    },
  };
}

/**
 * Helper to setup db mock with specific return values per table
 */
export function setupDbMock(
  dbMock: ReturnType<typeof createMockDb>,
  tableData: Record<string, unknown | unknown[] | null>
) {
  dbMock.selectFrom.mockImplementation((table: string) => {
    const data = tableData[table];
    return mockKyselyChain(data ?? null);
  });
  
  dbMock.insertInto.mockImplementation((table: string) => {
    const data = tableData[table];
    return mockKyselyChain(data ?? null);
  });
  
  dbMock.updateTable.mockImplementation((table: string) => {
    const data = tableData[table];
    return mockKyselyChain(data ?? null);
  });
  
  dbMock.deleteFrom.mockImplementation(() => {
    return mockKyselyChain({ numDeletedRows: 1n });
  });
}
