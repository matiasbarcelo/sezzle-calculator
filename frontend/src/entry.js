export const MAX_DIGITS = 8;

export const INITIAL_ENTRY = '0';

// Appends a key press (0-9 or '.') to the number being typed, the way a
// pocket calculator does: new digits enter on the right, a lone leading 0 is
// replaced, and input stops once all 8 digit cells are full. A leading "-"
// (only typed after √) is kept and takes up one cell.
export function appendToEntry(entry, key) {
  const sign = entry.startsWith('-') ? '-' : '';
  const body = entry.slice(sign.length);
  const cellsUsed = sign.length + body.replace('.', '').length;

  if (key === '.') {
    return body.includes('.') ? entry : entry + '.';
  }
  if (body === '0') {
    return sign + key;
  }
  if (cellsUsed >= MAX_DIGITS) {
    return entry;
  }
  return entry + key;
}

// Flips the sign of the number being typed: "0" <-> "-0", "12" <-> "-12".
export function toggleEntrySign(entry) {
  return entry.startsWith('-') ? entry.slice(1) : '-' + entry;
}

// The LCD always shows a decimal point, e.g. "0." or "123.".
export function entryToDisplayText(entry) {
  return entry.includes('.') ? entry : entry + '.';
}
