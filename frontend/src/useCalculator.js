import { useCallback, useRef, useState } from 'react';
import { calculate } from './api.js';
import { initialState, pressKey } from './calculatorLogic.js';

// Holds the calculator state and runs key presses one at a time.
// Presses made while an API request is in flight are ignored.
export function useCalculator() {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(initialState);
  const busyRef = useRef(false);

  const handleKey = useCallback(async (key) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const next = await pressKey(stateRef.current, key, calculate);
      stateRef.current = next;
      setState(next);
    } finally {
      busyRef.current = false;
    }
  }, []);

  return { state, handleKey };
}
