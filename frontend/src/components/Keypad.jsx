// Key layout based on the SL-200TE (silver): 7 columns x 4 rows.
// Memory/currency keys (M/EX, +/−, M−, M+) were removed and C/AC moved up to rows 1–2;
// the freed grid cells stay empty. The original %, TAX−, TAX+ and MRC keys are now
// the green %, ^, √ and R (remainder) keys.
// `col`/`row` are 1-based CSS grid positions.
export const KEYS = [
  { id: 'clear', label: 'C', variant: 'red', col: 1, row: 1 },
  { id: '7', label: '7', variant: 'digit', col: 2, row: 1 },
  { id: '8', label: '8', variant: 'digit', col: 3, row: 1 },
  { id: '9', label: '9', variant: 'digit', col: 4, row: 1 },
  { id: 'percent', label: '%', variant: 'green', col: 5, row: 1 },
  { id: 'power', label: '^', variant: 'green', col: 6, row: 1 },
  { id: 'sqrt', label: '√', variant: 'green', col: 7, row: 1 },

  { id: 'all-clear', label: 'AC', variant: 'red', col: 1, row: 2, small: true },
  { id: '4', label: '4', variant: 'digit', col: 2, row: 2 },
  { id: '5', label: '5', variant: 'digit', col: 3, row: 2 },
  { id: '6', label: '6', variant: 'digit', col: 4, row: 2 },
  { id: 'multiply', label: '×', variant: 'dark', col: 5, row: 2 },
  { id: 'divide', label: '÷', variant: 'dark', col: 6, row: 2 },
  { id: 'remainder', label: 'R', variant: 'green', col: 7, row: 2 },

  { id: '1', label: '1', variant: 'digit', col: 2, row: 3 },
  { id: '2', label: '2', variant: 'digit', col: 3, row: 3 },
  { id: '3', label: '3', variant: 'digit', col: 4, row: 3 },
  { id: 'plus', label: '+', variant: 'dark', col: 5, row: 3, rowSpan: 2 },
  { id: 'minus', label: '−', variant: 'dark', col: 6, row: 3 },

  { id: '0', label: '0', variant: 'digit', col: 2, row: 4, colSpan: 2 },
  { id: 'decimal', label: '•', variant: 'digit', col: 4, row: 4, small: true },
  { id: 'equals', label: '=', variant: 'dark', col: 6, row: 4 },
];

export default function Keypad({ onKey }) {
  return (
    <div className="keypad">
      {KEYS.map((key) => (
        <div
          key={key.id}
          className={key.rowSpan ? 'key-cell key-cell-tall' : 'key-cell'}
          style={{
            gridColumn: `${key.col} / span ${key.colSpan ?? 1}`,
            gridRow: `${key.row} / span ${key.rowSpan ?? 1}`,
          }}
        >
          <button
            type="button"
            className={`key key-${key.variant}${key.small ? ' key-small' : ''}`}
            onClick={() => onKey?.(key.id)}
            aria-label={key.id}
          >
            {key.label}
          </button>
        </div>
      ))}
    </div>
  );
}
