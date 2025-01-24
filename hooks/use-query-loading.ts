'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

interface QueryLoadingState {
  isLoading: boolean;
  taskNames: string[];
}

const initialState: QueryLoadingState = {
  isLoading: false,
  taskNames: []
};

// Add type for selector function
type Selector<T> = (state: QueryLoadingState) => T;

export function useQueryLoadingSelector<Selected>(selector: Selector<Selected>) {
  const { data: loadingState } = useSWR<QueryLoadingState>('query-loading', null, {
    fallbackData: initialState,
  });

  const selectedValue = useMemo(() => {
    if (!loadingState) return selector(initialState);
    return selector(loadingState);
  }, [loadingState, selector]);

  return selectedValue;
}

export function useQueryLoading() {
  const { data: loadingState, mutate: setLoadingState } = useSWR<QueryLoadingState>(
    'query-loading',
    null,
    {
      fallbackData: initialState,
    },
  );

  const state = useMemo(() => {
    if (!loadingState) return initialState;
    return loadingState;
  }, [loadingState]);

  const setQueryLoading = (isLoading: boolean, taskNames: string[] = []) => {
    setLoadingState({
      isLoading,
      taskNames
    });
  };

  return { state, setQueryLoading };
} 