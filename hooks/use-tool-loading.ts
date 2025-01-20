'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

type ToolName = 'searchStocksByFilters' | 'getCurrentStockPrice' | 'getStockPrices' | 'getIncomeStatements' | 'getBalanceSheets' | 'getCashFlowStatements' | 'getFinancialMetrics';

interface ToolLoadingState {
  [key: string]: {
    loading: boolean;
    message?: string;
  };
}

const initialState: ToolLoadingState = {
  searchStocksByFilters: { loading: false },
  getCurrentStockPrice: { loading: false },
  getStockPrices: { loading: false },
  getIncomeStatements: { loading: false },
  getBalanceSheets: { loading: false },
  getCashFlowStatements: { loading: false },
  getFinancialMetrics: { loading: false },
};

// Add type for selector function
type Selector<T> = (state: ToolLoadingState) => T;

export function useToolLoadingSelector<Selected>(selector: Selector<Selected>) {
  const { data: loadingState } = useSWR<ToolLoadingState>('tool-loading', null, {
    fallbackData: initialState,
  });

  const selectedValue = useMemo(() => {
    if (!loadingState) return selector(initialState);
    return selector(loadingState);
  }, [loadingState, selector]);

  return selectedValue;
}

export function useToolLoading() {
  const { data: loadingState, mutate: setLoadingState } = useSWR<ToolLoadingState>(
    'tool-loading',
    null,
    {
      fallbackData: initialState,
    },
  );

  const state = useMemo(() => {
    if (!loadingState) return initialState;
    return loadingState;
  }, [loadingState]);

  const setToolLoading = (tool: ToolName, isLoading: boolean, message?: string) => {
    setLoadingState((currentState) => ({
      ...currentState,
      [tool]: { loading: isLoading, message },
    }));
  };

  return { state, setToolLoading };
} 