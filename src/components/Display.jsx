import SevenSegmentDigit from './SevenSegmentDigit.jsx';

export const DIGIT_COUNT = 8;

// Indexes (0 = left-most digit) that carry a comma mark on top, after the digit.
// A comma only lights when its digit is in use, so a lone "0" shows none.
const COMMA_AFTER = new Set([0, 1, 2, 3, 4]);

// Turns a display string like "1234.5" into 8 right-aligned digit cells.
function toCells(text) {
  const cells = [];
  for (const ch of text) {
    if (ch === '.') {
      if (cells.length === 0) cells.push({ char: '0', dp: true });
      else cells[cells.length - 1].dp = true;
    } else {
      cells.push({ char: ch, dp: false });
    }
  }
  const visible = cells.slice(-DIGIT_COUNT);
  const blanks = Array.from({ length: DIGIT_COUNT - visible.length }, () => ({ char: ' ', dp: false }));
  return [...blanks, ...visible];
}

// One inverted box per pending operation, left to right over the last two digits.
const OPERATORS = ['÷', '×', '+', '−'];

const ALL_ON = {
  text: '8.8.8.8.8.8.8.8.',
  error: true,
  operator: '+',
  taxPlus: true,
  taxMinus: true,
  exchange: true,
  percent: true,
  set: true,
};

/**
 * The LCD. On error the real unit shows only a small "E" at the far left
 * and a single "0" in the right-most digit (index 7), so `error` overrides `text`.
 * The pending operation lights one of four inverted boxes (dark box, light symbol)
 * spanning the last two digits: ÷ × + −.
 */
export default function Display(props) {
  // `allOn` is a segment test: every indicator, comma and segment lit at once.
  const {
    text = '0.',
    error = false,
    operator = null, // '÷' | '×' | '+' | '−' | null
    taxPlus = false,
    taxMinus = false,
    currency = null, // 'C1' | 'C2' | 'C3'
    exchange = false,
    tax = false, // lights only the "TAX" part of TAX− (with %) when showing the stored tax rate
    percent = false,
    set = false, // shown after holding % (SET) to enter rate-setting mode
  } = props.allOn ? ALL_ON : props;
  const annunciators = [
    ['TAX+', taxPlus],
    [
      'TAX−',
      <>
        <span className={taxMinus || tax ? 'on' : ''}>TAX</span>
        <span className={taxMinus ? 'on' : ''}>−</span>
      </>,
    ],
    ['C1', props.allOn || currency === 'C1'],
    ['C2', props.allOn || currency === 'C2'],
    ['C3', props.allOn || currency === 'C3'],
    ['SET', set],
    ['EXCH', exchange],
    ['%', percent],
  ];

  const cells = props.allOn ? toCells('8.8.8.8.8.8.8.8.') : toCells(error ? '0' : text);

  return (
    <div className="lcd" role="status" aria-label={error ? 'Error' : text}>
      {/* Spans the E column too: TAX+ starts directly above E. */}
      <div className="lcd-annunciators">
        <div className="ann-group">
          {annunciators.map(([label, state]) =>
            typeof state === 'boolean' ? (
              <span key={label} className={state ? 'ann on' : 'ann'}>
                {label}
              </span>
            ) : (
              <span key={label} className="ann ann-split">
                {state}
              </span>
            )
          )}
        </div>
        <div className="ann-operators">
          {OPERATORS.map((op) => {
            const on = props.allOn || operator === op;
            return (
              <span key={op} className={on ? 'ann-operator on' : 'ann-operator'} aria-label={on ? `operator ${op}` : undefined}>
                {op}
              </span>
            );
          })}
        </div>
      </div>

      <div className="lcd-flags">
        <span className={error ? 'flag on' : 'flag'}>E</span>
      </div>

      <div className="lcd-digits">
        {cells.map((cell, i) => (
          <SevenSegmentDigit
            key={i}
            char={cell.char}
            dp={cell.dp}
            comma={COMMA_AFTER.has(i) && cell.char !== ' '}
          />
        ))}
      </div>
    </div>
  );
}
