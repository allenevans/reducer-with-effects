import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReducerWithEffects } from './use-reducer-with-effects';

type TestState = {
  value: string;
};

type Action = {
  type: 'set-value' | 'unhandled';
  payload: string;
};

const testReducer = (state: TestState, action: Action) => {
  if (action.type === 'set-value') {
    return {
      ...state,
      value: action.payload,
    };
  }

  return state;
};

type TestHarnessProps = {
  before?: Parameters<typeof useReducerWithEffects<TestState, Action>>[2];
  after?: Parameters<typeof useReducerWithEffects<TestState, Action>>[3];
};

const TestHarness: React.FC<TestHarnessProps> = (props) => {
  const [state, dispatch] = useReducerWithEffects<TestState, Action>(
    testReducer,
    { value: 'initial' } as TestState,
    props.before ?? ([] as []),
    props.after ?? [],
  );

  return (
    <div>
      <div>{state.value}</div>
      <button type="button" onClick={() => dispatch({ type: 'set-value', payload: 'next-value' })}>
        Set value
      </button>
      <button type="button" onClick={() => dispatch({ type: 'unhandled', payload: '' })}>
        No action
      </button>
    </div>
  );
};

const runTimers = () =>
  act(() => {
    vi.runAllTimers();
  });

describe('use-reducer-with-effects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('no effects', () => {
    it('works as a typical useReducer hook', () => {
      render(
        <StrictMode>
          <TestHarness />
        </StrictMode>,
      );

      expect(screen.getByText('initial')).toBeInTheDocument();
      expect(screen.queryByText('next-value')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Set value'));
      runTimers();

      expect(screen.queryByText('initial')).not.toBeInTheDocument();
      expect(screen.getByText('next-value')).toBeInTheDocument();
    });
  });

  describe('before effects', () => {
    it('calls sequential before effects', () => {
      render(
        <StrictMode>
          <TestHarness
            before={[
              (_state, action) => {
                expect(action).toEqual({ payload: '', type: 'unhandled' });
                return {
                  value: 'before-1',
                };
              },
              (state, action) => {
                expect(state).toEqual({ value: 'before-1' });
                expect(action).toEqual({ payload: '', type: 'unhandled' });
                return {
                  value: 'before-2',
                };
              },
            ]}
          />
        </StrictMode>,
      );

      expect(screen.getByText('initial')).toBeInTheDocument();
      fireEvent.click(screen.getByText('No action'));
      runTimers();
      expect(screen.getByText('before-2')).toBeInTheDocument();
    });
  });

  describe('after effects', () => {
    it('calls sequential after effects', () => {
      let processCount = 0;

      render(
        <StrictMode>
          <TestHarness
            after={[
              (_state, action) => {
                processCount += 1;
                expect(action).toEqual({ payload: '', type: 'unhandled' });
                return {
                  value: 'after-1',
                };
              },
              (state, action) => {
                processCount += 1;
                expect(state).toEqual({ value: 'after-1' });
                expect(action).toEqual({ payload: '', type: 'unhandled' });
                return {
                  value: 'after-2',
                };
              },
            ]}
          />
        </StrictMode>,
      );

      expect(screen.getByText('initial')).toBeInTheDocument();
      fireEvent.click(screen.getByText('No action'));
      runTimers();
      expect(processCount).toBe(2);
      expect(screen.getByText('after-2')).toBeInTheDocument();
    });
  });
});
