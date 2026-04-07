/**
 * Decimal-safe math helpers
 * Using BigInt scaling to avoid binary float artifacts
 */

const norm = (s: string) => (s ?? '').trim().replace(/[$]/g, '').replace(',', '.');

const parseDec = (s: string) => {
    const t = norm(s);
    if (!t) return { i: 0n, scale: 0 };
    const neg = t.startsWith('-');
    const u = neg ? t.slice(1) : t;
    const [a, b = ''] = u.split('.');
    const scale = b.length;
    const digits = (a + b).replace(/^0+(?=\d)/, '');
    const i = BigInt(digits || '0');
    return { i: neg ? -i : i, scale };
};

const pow10 = (n: number) => {
    let r = 1n;
    for (let k = 0; k < n; k++) r *= 10n;
    return r;
};

const fmtBig = (i: bigint, scale: number) => {
    const neg = i < 0n;
    const abs = (neg ? -i : i).toString();
    if (scale <= 0) return (neg ? '-' : '') + abs + (scale < 0 ? '0'.repeat(-scale) : '');
    const pad = scale > abs.length ? '0'.repeat(scale - abs.length + 1) : '';
    const s = pad + abs;
    const idx = s.length - scale;
    const out = s.slice(0, idx) + '.' + s.slice(idx);
    return (neg ? '-' : '') + out;
};

/**
 * Remove trailing zeros from a decimal string (e.g., "1.500" -> "1.5", "1.00" -> "1")
 */
export const trimZeros = (s: string): string => {
    if (!s.includes('.')) return s;
    // Remove trailing zeros after decimal point
    let result = s.replace(/0+$/, '');
    // Remove trailing decimal point if nothing after it
    result = result.replace(/\.$/, '');
    return result;
};

/**
 * Multiply two decimal strings without floating-point precision loss
 */
export const mulStr = (aStr: string, bStr: string): string => {
    const a = parseDec(aStr);
    const b = parseDec(bStr);
    return trimZeros(fmtBig(a.i * b.i, a.scale + b.scale));
};

/**
 * Divide two decimal strings without floating-point precision loss
 * @param outScale - Number of decimal places in result (default 10)
 */
export const divStr = (aStr: string, bStr: string, outScale = 10): string => {
    const a = parseDec(aStr);
    const b = parseDec(bStr);
    if (b.i === 0n) return 'NaN';
    const neg = (a.i < 0n) !== (b.i < 0n);
    const ai = a.i < 0n ? -a.i : a.i;
    const bi = b.i < 0n ? -b.i : b.i;
    const num = ai * pow10(outScale + b.scale);
    const den = bi * pow10(a.scale);
    let q = num / den;
    const r = num % den;
    if (r * 2n >= den) q += 1n; // round half up
    let out = trimZeros(fmtBig(q, outScale));
    if (neg && out !== '0') out = '-' + out;
    return out;
};

/**
 * Parse a string to a number, handling comma as decimal separator and stripping currency symbols
 */
export const toNum = (s: string): number => {
    const cleaned = (s ?? '').replace(/[$]/g, '').replace(',', '.');
    return parseFloat(cleaned);
};
