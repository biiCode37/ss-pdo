import { describe, it, expect } from 'vitest';
import { parseBulkSheetUrls } from './bulkRouteParser';

describe('parseBulkSheetUrls', () => {
  it('harus mem-parsing format array Google Drive [...] dengan tanda koma', () => {
    const input = `[https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs/edit?usp=sharing, https://docs.google.com/spreadsheets/d/1B2CG7aGIwTwhV6KKqszspsDiE5HZB0xbURujLuNnOe8/edit?usp=sharing]`;
    const result = parseBulkSheetUrls(input);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs');
    expect(result[0].cleanUrl).toBe(
      'https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs'
    );
    expect(result[1].id).toBe('1B2CG7aGIwTwhV6KKqszspsDiE5HZB0xbURujLuNnOe8');
  });

  it('harus mem-parsing format multi-baris dan mengabaikan duplikasi ID', () => {
    const input = `
      https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs/edit#gid=0
      https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs/view
      https://docs.google.com/spreadsheets/d/1H6NFbBS_cZYXOSUGYpbI6UcyqMd5PXIBrbH4lyKXvD8/edit
    `;
    const result = parseBulkSheetUrls(input);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual([
      '13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs',
      '1H6NFbBS_cZYXOSUGYpbI6UcyqMd5PXIBrbH4lyKXvD8',
    ]);
  });

  it('harus mengembalikan array kosong jika input teks tidak memiliki spreadsheet ID valid', () => {
    expect(parseBulkSheetUrls('')).toEqual([]);
    expect(parseBulkSheetUrls('hanya teks biasa tanpa link')).toEqual([]);
  });
});
