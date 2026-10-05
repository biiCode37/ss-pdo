export interface ParsedBulkUrlItem {
  id: string;
  originalUrl: string;
  cleanUrl: string;
}

const SPREADSHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9-_]{15,})/g;

/**
 * Mem-parsing string teks mentah yang berisi satu atau banyak link Google Sheets
 * dan mengekstrak daftar spreadsheet ID unik beserta URL bersihnya.
 */
export function parseBulkSheetUrls(rawText: string): ParsedBulkUrlItem[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const seenIds = new Set<string>();
  const items: ParsedBulkUrlItem[] = [];

  // Reset regex state agar tidak terpengaruh eksekusi sebelumnya
  SPREADSHEET_ID_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SPREADSHEET_ID_REGEX.exec(rawText)) !== null) {
    const id = match[1];
    if (!seenIds.has(id)) {
      seenIds.add(id);
      items.push({
        id,
        originalUrl: match[0],
        cleanUrl: `https://docs.google.com/spreadsheets/d/${id}`,
      });
    }
  }

  return items;
}
