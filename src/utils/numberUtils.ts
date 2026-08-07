export function parseIndonesianNumber(val: any, fallback: number = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  
  let str = String(val).trim();
  if (str === '' || str === '-' || str.startsWith('#')) return fallback;

  // Handle Indonesian currency/number formats like "5.589,06" or "4.670" or "192,73"
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }

  const num = Number(str);
  return isNaN(num) ? fallback : num;
}

export function safeFormatNumber(val: any, fallback: number = 0, options?: Intl.NumberFormatOptions): string {
  const num = typeof val === 'number' ? (isNaN(val) ? fallback : val) : parseIndonesianNumber(val, fallback);
  const safeNum = isNaN(num) ? fallback : num;
  return safeNum.toLocaleString('id-ID', options);
}
