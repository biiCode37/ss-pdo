export function parseIndonesianNumber(val: any): number {
  if (val === undefined || val === null || val === '') return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;
  
  let str = String(val).trim();
  if (str === '' || str.startsWith('#')) return NaN;

  // Handle Indonesian currency/number formats like "5.589,06" or "4.670" or "192,73"
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }

  const num = Number(str);
  return isNaN(num) ? NaN : num;
}
