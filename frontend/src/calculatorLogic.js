import { appendToEntry, entryToDisplayText, toggleEntrySign } from './entry.js';
import { formatForDisplay } from './format.js';

// Keys that wait for a second number, mapped to API operation names.
// percent: "100 % 5 =" is 5 percent of 100 (API percentage: a × b ÷ 100).
export const BINARY_OPERATIONS = {
  plus: 'add',
  minus: 'subtract',
  multiply: 'multiply',
  divide: 'divide',
  power: 'power',
  remainder: 'remainder',
  percent: 'percentage',
};

const DIGIT_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'decimal']);

/**
 * entry           digits being typed, or null while showing a result
 * value           the number on screen when entry is null (full precision from the API)
 * accumulator     first operand, saved when an operation key is pressed
 * operation       pending API operation ('add', 'percentage', ...)
 * awaitingOperand true right after an operation key, until the next number starts
 * sqrtPending     √ was pressed first; the number typed next is square-rooted
 *                 when = or an operation key is pressed
 * lastResponse    the most recent API response, as returned by the API
 * error           error message from the API or display overflow; shows E
 */
export const initialState = {
  entry: '0',
  value: 0,
  accumulator: null,
  operation: null,
  awaitingOperand: false,
  sqrtPending: false,
  lastResponse: null,
  error: null,
};

const currentNumber = (state) => (state.entry !== null ? Number(state.entry) : state.value);

/**
 * Applies one key press and returns the next state. All arithmetic goes
 * through `calculate(operation, a, b)`, which returns the API response.
 * An API failure (or a result too long for the display) becomes an error state.
 */
export async function pressKey(state, key, calculate) {
  if (key === 'all-clear') return initialState;
  if (key === 'clear') {
    // C clears an error completely, otherwise just the number being typed.
    return state.error ? initialState : { ...state, entry: '0' };
  }
  if (state.error) return state; // locked until C or AC, like the real unit

  try {
    if (DIGIT_KEYS.has(key)) return typeDigit(state, key === 'decimal' ? '.' : key);
    if (key === 'sqrt') return startSqrt(state);
    // After √, − before any digits makes the number negative (√ − 9 → E).
    if (key === 'minus' && state.sqrtPending && isBlankEntry(state.entry)) {
      return { ...state, entry: toggleEntrySign(state.entry) };
    }

    // Everything below needs a finished number, so resolve a pending √ first.
    const resolved = await resolveSqrt(state, calculate);
    if (key in BINARY_OPERATIONS) return await chooseOperation(resolved, BINARY_OPERATIONS[key], calculate);
    if (key === 'equals') return await evaluate(resolved, calculate);
  } catch (err) {
    return { ...initialState, error: err.message || 'calculation failed' };
  }
  return state;
}

const isBlankEntry = (entry) => entry === '0' || entry === '-0';

// √ is a prefix: it lights the √ indicator and starts a fresh number.
// With an operation pending, it applies to the second number (9 + √16 = 13).
function startSqrt(state) {
  if (state.sqrtPending) return state;
  return { ...state, entry: '0', awaitingOperand: false, sqrtPending: true };
}

async function resolveSqrt(state, calculate) {
  if (!state.sqrtPending) return state;
  const response = await request(calculate, 'sqrt', Number(state.entry));
  return {
    ...state,
    entry: null,
    value: response.result,
    sqrtPending: false,
    lastResponse: response,
  };
}

function typeDigit(state, key) {
  const startingNew = state.entry === null;
  return {
    ...state,
    entry: appendToEntry(startingNew ? '0' : state.entry, key),
    awaitingOperand: false,
  };
}

async function chooseOperation(state, operation, calculate) {
  // Changing your mind: "5 + ×" just swaps the operation.
  if (state.operation && state.awaitingOperand) {
    return { ...state, operation };
  }

  let first = currentNumber(state);
  let lastResponse = state.lastResponse;

  // Chaining: "2 + 3 ×" evaluates 2 + 3 first, then waits for the next number.
  if (state.operation) {
    lastResponse = await request(calculate, state.operation, state.accumulator, first);
    first = lastResponse.result;
  }

  return {
    ...state,
    entry: null,
    value: first,
    accumulator: first,
    operation,
    awaitingOperand: true,
    lastResponse,
  };
}

async function evaluate(state, calculate) {
  if (!state.operation) {
    return { ...state, entry: null, value: currentNumber(state) };
  }

  const response = await request(calculate, state.operation, state.accumulator, currentNumber(state));
  return {
    ...state,
    entry: null,
    value: response.result,
    accumulator: null,
    operation: null,
    awaitingOperand: false,
    lastResponse: response,
  };
}

async function request(calculate, operation, a, b) {
  const response = await calculate(operation, a, b);
  if (formatForDisplay(response.result) === null) {
    throw new Error('result does not fit on the display');
  }
  return response;
}

const OPERATOR_SYMBOLS = { add: '+', subtract: '−', multiply: '×', divide: '÷' };

// Maps calculator state to the props the Display component understands.
export function toDisplayProps(state) {
  if (state.error) return { error: true };

  return {
    text: state.entry !== null ? entryToDisplayText(state.entry) : formatForDisplay(state.value),
    operator: OPERATOR_SYMBOLS[state.operation] ?? null,
    power: state.operation === 'power',
    sqrt: state.sqrtPending,
    percent: state.operation === 'percentage',
  };
}
