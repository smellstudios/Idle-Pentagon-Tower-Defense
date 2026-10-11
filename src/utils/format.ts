/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Decimal from 'break_infinity.js';

export type NumericValue = number | Decimal | string;

const STANDARD_SUFFIXES = [
  '', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 
  'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc',
  'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg'
];

/**
 * Converts any numeric representation into a break_infinity Decimal.
 */
export function toDecimal(val: NumericValue): Decimal {
  if (val instanceof Decimal) return val;
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return new Decimal(0);
    return new Decimal(val);
  }
  if (typeof val === 'string') {
    try {
      return new Decimal(val);
    } catch {
      return new Decimal(0);
    }
  }
  return new Decimal(0);
}

/**
 * High-performance 2026 Idle Game number formatter.
 * - Formats numbers and break_infinity.js Decimals up to 1e(9e15).
 * - Below 1,000: exact integer (e.g. 1, 999).
 * - 1,000 to 1e15: suffix notation with clean decimals (e.g. 1.5k, 10M, 3.25B).
 * - >= 1e15 or standard idle limits: scientific / exponential notation (e.g. 1.25e24).
 * - Fast path for native numbers avoids object creation in common UI calls.
 */
export function formatCurrency(
  value: NumericValue, 
  useLegacyExact: boolean = false
): string {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return '0';
    if (useLegacyExact) {
      return Math.floor(value).toLocaleString();
    }
    const absVal = Math.abs(value);
    if (absVal < 1000) {
      return Math.floor(value).toString();
    }

    if (absVal < 1e15) {
      const tier = Math.floor(Math.log10(absVal) / 3);
      if (tier < STANDARD_SUFFIXES.length) {
        const suffix = STANDARD_SUFFIXES[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = value / scale;
        const formatted = scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2);
        const trimmed = formatted.replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
        return `${trimmed}${suffix}`;
      }
    }
  }

  const dec = toDecimal(value);
  if (Number.isNaN(dec.mantissa) || !Number.isFinite(dec.mantissa)) return '0';

  const absDec = dec.abs();
  if (absDec.lt(1000)) {
    return Math.floor(dec.toNumber()).toString();
  }

  if (absDec.lt(1e15)) {
    const num = dec.toNumber();
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    if (tier < STANDARD_SUFFIXES.length) {
      const suffix = STANDARD_SUFFIXES[tier];
      const scale = Math.pow(10, tier * 3);
      const scaled = num / scale;
      const formatted = scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2);
      const trimmed = formatted.replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
      return `${trimmed}${suffix}`;
    }
  }

  // Scientific notation for high idle scales (e.g. 1.25e18, 3.40e308)
  const exponent = dec.exponent;
  const mantissa = dec.mantissa;
  return `${mantissa.toFixed(2)}e${exponent}`;
}

/**
 * Shortened percentage formatter
 */
export function formatPercent(value: number, decimals: number = 1): string {
  const percent = value * 100;
  return `${percent.toFixed(decimals)}%`;
}
