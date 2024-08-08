import { useReducer } from 'react';

export type BeforeEffects<T, A> = ((state: T, action: A) => T)[];
export type AfterEffects<T, A> = ((state: T, action: A, previousState: T) => T)[];

const cache = new Map();
const MAX_CACHE_SIZE = 2;

export const useReducerWithEffects = <T, A extends { type: unknown }>(
  reducer: (state: T, action: A) => T,
  initialState: T,
  before: BeforeEffects<T, A> | undefined = undefined,
  after: AfterEffects<T, A> | undefined = undefined,
): [T, (action: A) => void] => {
  const reducerWithEffects = (state: T, action: A): T => {
    if (cache.has(action)) {
      // prevent duplicate re-renders in strict mode
      return cache.get(action) as T;
    }

    const beforeState = (before ?? []).reduce((acc, func) => func(acc, action), state);
    const nextState = reducer(beforeState, action);
    const finalState = (after ?? []).reduce(
      (acc: T, func: AfterEffects<T, A>[0]) => func(acc, action, beforeState) ?? acc,
      nextState,
    );

    if (cache.size === MAX_CACHE_SIZE) {
      cache.clear();
    }
    cache.set(action, finalState);

    return finalState;
  };

  return useReducer(reducerWithEffects, initialState);
};
