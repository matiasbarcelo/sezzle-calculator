// Key layout traced from the SL-200TE (silver): 7 columns x 4 rows.
// `col`/`row` are 1-based CSS grid positions.
export const KEYS = [
  { id: 'mex', label: 'M/EX', variant: 'dark', col: 1, row: 1, small: true },
  { id: '7', label: '7', variant: 'digit', col: 2, row: 1 },
  { id: '8', label: '8', variant: 'digit', col: 3, row: 1 },
  { id: '9', label: '9', variant: 'digit', col: 4, row: 1 },
  { id: 'percent', label: '%', variant: 'dark', col: 5, row: 1, note: 'SET' },
  { id: 'tax-minus', label: 'TAX−', variant: 'tax', col: 6, row: 1, small: true },
  { id: 'tax-plus', label: 'TAX+', variant: 'tax', col: 7, row: 1, small: true, note: 'TAX RATE' },

  { id: 'sign', label: '+/−', variant: 'dark', col: 1, row: 2, small: true },
  { id: '4', label: '4', variant: 'digit', col: 2, row: 2 },
  { id: '5', label: '5', variant: 'digit', col: 3, row: 2 },
  { id: '6', label: '6', variant: 'digit', col: 4, row: 2 },
  { id: 'multiply', label: '×', variant: 'dark', col: 5, row: 2 },
  { id: 'divide', label: '÷', variant: 'dark', col: 6, row: 2 },
  { id: 'mrc', label: 'MRC', variant: 'dark', col: 7, row: 2, small: true, note: 'EX RATE', tag: 'C3' },

  { id: 'clear', label: 'C', variant: 'red', col: 1, row: 3 },
  { id: '1', label: '1', variant: 'digit', col: 2, row: 3 },
  { id: '2', label: '2', variant: 'digit', col: 3, row: 3 },
  { id: '3', label: '3', variant: 'digit', col: 4, row: 3 },
  { id: 'plus', label: '+', variant: 'dark', col: 5, row: 3, rowSpan: 2 },
  { id: 'minus', label: '−', variant: 'dark', col: 6, row: 3 },
  { id: 'm-minus', label: 'M−', variant: 'dark', col: 7, row: 3, small: true, note: 'EX RATE', tag: 'C2' },

  { id: 'all-clear', label: 'AC', variant: 'red', col: 1, row: 4, small: true, under: 'ON' },
  { id: '0', label: '0', variant: 'digit', col: 2, row: 4, colSpan: 2 },
  { id: 'decimal', label: '•', variant: 'digit', col: 4, row: 4, small: true },
  { id: 'equals', label: '=', variant: 'dark', col: 6, row: 4 },
  { id: 'm-plus', label: 'M+', variant: 'dark', col: 7, row: 4, small: true, tag: 'C1' },
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
          {key.note && <span className="key-note">{key.note}</span>}
          <button
            type="button"
            className={`key key-${key.variant}${key.small ? ' key-small' : ''}`}
            onClick={() => onKey?.(key.id)}
            aria-label={key.id}
          >
            {key.label}
          </button>
          {key.tag && <span className="key-tag">{key.tag}</span>}
          {key.under && <span className="key-under">{key.under}</span>}
        </div>
      ))}
    </div>
  );
}
