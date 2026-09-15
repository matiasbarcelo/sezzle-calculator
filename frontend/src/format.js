import { MAX_DIGITS } from './entry.js';

/**
 * Formats a number for the 8-cell LCD, e.g. 2.5 -> "2.5", -42 -> "-42.",
 * 1/3 -> "0.3333333". A minus sign takes one cell. Decimals are rounded to
 * whatever cells are left. Returns null if the integer part can't fit.
 */
export function formatForDisplay(value) {
  if (!Number.isFinite(value)) return null;

  const negative = value < 0;
  const abs = Math.abs(value);
  const cells = MAX_DIGITS - (negative ? 1 : 0);

  const intDigits = Math.trunc(abs) === 0 ? 1 : String(Math.trunc(abs)).length;
  if (intDigits > cells) return null;

  let text = abs.toFixed(cells - intDigits);
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');

  // Rounding can carry into a new digit (99999999.6 -> "100000000").
  if (text.replace('.', '').length > cells) return null;

  const isZero = Number(text) === 0;
  const sign = negative && !isZero ? '-' : '';
  return `${sign}${text}${text.includes('.') ? '' : '.'}`;
}
