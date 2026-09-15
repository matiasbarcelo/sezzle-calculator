// One LCD digit cell: seven segments, a decimal point at the bottom right,
// and an optional comma mark at the top right (as on the SL-200TE display).

const SEGMENTS = {
  a: horizontal(6),
  g: horizontal(50),
  d: horizontal(94),
  f: vertical(8, 8, 48),
  b: vertical(52, 8, 48),
  e: vertical(8, 52, 92),
  c: vertical(52, 52, 92),
};

const CHAR_SEGMENTS = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  E: 'adefg',
  ' ': '',
};

function horizontal(cy, x1 = 12, x2 = 48) {
  return `${x1},${cy} ${x1 + 4},${cy - 4} ${x2 - 4},${cy - 4} ${x2},${cy} ${x2 - 4},${cy + 4} ${x1 + 4},${cy + 4}`;
}

function vertical(cx, y1, y2) {
  return `${cx},${y1} ${cx + 4},${y1 + 4} ${cx + 4},${y2 - 4} ${cx},${y2} ${cx - 4},${y2 - 4} ${cx - 4},${y1 + 4}`;
}

export default function SevenSegmentDigit({ char = ' ', dp = false, comma = false }) {
  const lit = CHAR_SEGMENTS[char] ?? '';

  return (
    <svg className="lcd-digit" viewBox="-4 -18 76 122" aria-hidden="true">
      <g transform="skewX(-7) translate(10 0)">
        {Object.entries(SEGMENTS).map(([name, points]) => (
          <polygon
            key={name}
            points={points}
            className={lit.includes(name) ? 'seg seg-on' : 'seg seg-off'}
          />
        ))}
      </g>
      <circle cx="66" cy="96" r="4.5" className={dp ? 'seg seg-on' : 'seg seg-off'} />
      {comma && <path d="M63 -15 h6 v6 l-4 8 h-3 l2.5 -8 h-1.5 z" className="seg seg-on" />}
    </svg>
  );
}
