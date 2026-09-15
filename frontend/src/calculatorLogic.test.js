import { describe, expect, it, vi } from 'vitest';
import { initialState, pressKey, toDisplayProps } from './calculatorLogic.js';
import { formatForDisplay } from './format.js';

// Stands in for the Go API: same operation names, same response shape.
function fakeApi() {
  const math = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => {
      if (b === 0) throw new Error('division by zero');
      return a / b;
    },
    power: (a, b) => a ** b,
    sqrt: (a) => {
      if (a < 0) throw new Error('square root of a negative number');
      return Math.sqrt(a);
    },
    percentage: (a, b) => (a * b) / 100,
    remainder: (a, b) => {
      if (b === 0) throw new Error('division by zero');
      return a % b;
    },
  };
  return vi.fn(async (operation, a, b) => ({
    operation,
    a,
    ...(b === undefined ? {} : { b }),
    result: math[operation](a, b),
  }));
}

async function run(keys, api = fakeApi()) {
  let state = initialState;
  for (const key of keys) state = await pressKey(state, key, api);
  return { state, display: toDisplayProps(state), api };
}

const keys = (s) => s.split(' ');

describe('digit entry', () => {
  it('appends digits and ignores leading zeros', async () => {
    const { display, api } = await run(keys('0 0 1 2'));
    expect(display.text).toBe('12.');
    expect(api).not.toHaveBeenCalled();
  });
});

describe('binary operations', () => {
  it.each([
    ['1 2 plus 3 0 equals', 'add', 12, 30, '42.'],
    ['5 minus 8 equals', 'subtract', 5, 8, '-3.'],
    ['6 multiply 7 equals', 'multiply', 6, 7, '42.'],
    ['1 divide 4 equals', 'divide', 1, 4, '0.25'],
    ['2 power 1 0 equals', 'power', 2, 10, '1024.'],
    ['1 7 remainder 5 equals', 'remainder', 17, 5, '2.'],
  ])('%s', async (sequence, operation, a, b, text) => {
    const { display, api, state } = await run(keys(sequence));
    expect(api).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith(operation, a, b);
    expect(display.text).toBe(text);
    expect(state.lastResponse).toEqual({ operation, a, b, result: expect.any(Number) });
  });

  it('keeps the first number on screen and lights the operator box', async () => {
    const { display, api } = await run(keys('1 2 plus'));
    expect(display).toMatchObject({ text: '12.', operator: '+' });
    expect(api).not.toHaveBeenCalled();
  });

  it('lights ^ while a power is pending', async () => {
    const { display } = await run(keys('2 power'));
    expect(display.power).toBe(true);
  });

  it('chains: 2 + 3 × 4 = evaluates left to right', async () => {
    const { display, api } = await run(keys('2 plus 3 multiply 4 equals'));
    expect(api).toHaveBeenNthCalledWith(1, 'add', 2, 3);
    expect(api).toHaveBeenNthCalledWith(2, 'multiply', 5, 4);
    expect(display.text).toBe('20.');
  });

  it('swaps the operation when two operation keys are pressed in a row', async () => {
    const { display, api } = await run(keys('9 plus minus 4 equals'));
    expect(api).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith('subtract', 9, 4);
    expect(display.text).toBe('5.');
  });

  it('starts a new number after a result', async () => {
    const { display } = await run(keys('2 plus 2 equals 7'));
    expect(display.text).toBe('7.');
  });

  it('uses the result as the next first operand', async () => {
    const { display } = await run(keys('2 plus 2 equals multiply 3 equals'));
    expect(display.text).toBe('12.');
  });
});

describe('square root (pressed before the number)', () => {
  it('√ lights the indicator and starts a fresh number without calling the API', async () => {
    const { display, api } = await run(keys('5 sqrt 8 1'));
    expect(api).not.toHaveBeenCalled();
    expect(display).toMatchObject({ text: '81.', sqrt: true });
  });

  it('√ 81 = calls sqrt with one operand', async () => {
    const { display, api, state } = await run(keys('sqrt 8 1 equals'));
    expect(api).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith('sqrt', 81, undefined);
    expect(display).toMatchObject({ text: '9.', sqrt: false });
    expect(state.lastResponse).toEqual({ operation: 'sqrt', a: 81, result: 9 });
  });

  it('√ applies to the second number: 9 + √16 = 13', async () => {
    const { display, api } = await run(keys('9 plus sqrt 1 6 equals'));
    expect(api).toHaveBeenNthCalledWith(1, 'sqrt', 16, undefined);
    expect(api).toHaveBeenNthCalledWith(2, 'add', 9, 4);
    expect(display.text).toBe('13.');
  });

  it('an operation key finishes the √ first: √9 × 2 = 6', async () => {
    const { display } = await run(keys('sqrt 9 multiply 2 equals'));
    expect(display.text).toBe('6.');
  });

  it('pressing √ again while pending does nothing', async () => {
    const { display } = await run(keys('sqrt 4 sqrt equals'));
    expect(display.text).toBe('2.');
  });

  it('pressing √ after a number no longer takes the root of it', async () => {
    const { display, api } = await run(keys('8 1 sqrt'));
    expect(api).not.toHaveBeenCalled();
    expect(display.text).toBe('0.');
  });

  it('− right after √ makes the number negative', async () => {
    const { display, api } = await run(keys('sqrt minus 9'));
    expect(api).not.toHaveBeenCalled();
    expect(display).toMatchObject({ text: '-9.', sqrt: true });
  });

  it('shows E for the square root of a negative number', async () => {
    const { display, state, api } = await run(keys('sqrt minus 9 equals'));
    expect(api).toHaveBeenCalledWith('sqrt', -9, undefined);
    expect(display).toEqual({ error: true });
    expect(state.error).toBe('square root of a negative number');
  });

  it('− after digits is still subtraction: √16 − 1 = 3', async () => {
    const { display } = await run(keys('sqrt 1 6 minus 1 equals'));
    expect(display.text).toBe('3.');
  });
});

describe('percent (first number, %, percent, =)', () => {
  it('100 % 5 = is 5% of 100', async () => {
    const { display, api } = await run(keys('1 0 0 percent 5 equals'));
    expect(api).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith('percentage', 100, 5);
    expect(display).toMatchObject({ text: '5.', percent: false });
  });

  it('keeps the first number on screen and lights % while waiting', async () => {
    const { display, api } = await run(keys('1 0 0 percent'));
    expect(api).not.toHaveBeenCalled();
    expect(display).toMatchObject({ text: '100.', percent: true });
  });

  it('works with decimals: 80 % 12.5 = 10', async () => {
    const { display } = await run(keys('8 0 percent 1 2 decimal 5 equals'));
    expect(display.text).toBe('10.');
  });

  it('chains with other operations: 100 % 5 + 1 = 6', async () => {
    const { display, api } = await run(keys('1 0 0 percent 5 plus 1 equals'));
    expect(api).toHaveBeenNthCalledWith(1, 'percentage', 100, 5);
    expect(api).toHaveBeenNthCalledWith(2, 'add', 5, 1);
    expect(display.text).toBe('6.');
  });
});

describe('errors', () => {
  it('shows E on an API error and ignores keys until cleared', async () => {
    const { state, display } = await run(keys('1 divide 0 equals 5 plus'));
    expect(display).toEqual({ error: true });
    expect(state.error).toBe('division by zero');
  });

  it('C clears an error', async () => {
    const { display } = await run(keys('1 divide 0 equals clear 4'));
    expect(display.text).toBe('4.');
  });

  it('shows E when the result does not fit in 8 digits', async () => {
    const { display } = await run(keys('9 9 9 9 9 9 9 9 multiply 9 equals'));
    expect(display).toEqual({ error: true });
  });

  it('shows E when the API is unreachable', async () => {
    const api = vi.fn(async () => {
      throw new Error('cannot reach the calculator API');
    });
    const { state } = await run(keys('1 plus 1 equals'), api);
    expect(state.error).toBe('cannot reach the calculator API');
  });
});

describe('clear keys', () => {
  it('C clears only the number being typed', async () => {
    const { display } = await run(keys('8 plus 5 clear 2 equals'));
    expect(display.text).toBe('10.');
  });

  it('AC resets everything', async () => {
    const { state } = await run(keys('8 plus 5 all-clear'));
    expect(state).toEqual(initialState);
  });
});

describe('negative entry', () => {
  it('a minus sign uses one of the 8 cells', async () => {
    const { display } = await run(keys('sqrt minus 1 2 3 4 5 6 7 8 9'));
    expect(display.text).toBe('-1234567.');
  });
});

describe('formatForDisplay', () => {
  it.each([
    [0, '0.'],
    [42, '42.'],
    [-42, '-42.'],
    [2.5, '2.5'],
    [1 / 3, '0.3333333'],
    [-1 / 3, '-0.333333'],
    [99999999, '99999999.'],
    [0.1 + 0.2, '0.3'],
    [-0.00000001, '0.'],
  ])('%s -> %s', (value, text) => {
    expect(formatForDisplay(value)).toBe(text);
  });

  it.each([100000000, -10000000, 99999999.6, Infinity, NaN])('%s does not fit', (value) => {
    expect(formatForDisplay(value)).toBeNull();
  });
});
