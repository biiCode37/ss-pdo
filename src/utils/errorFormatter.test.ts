import { formatUserError } from './errorFormatter';

export function runErrorFormatterTest() {
  // Test 1: returns null for null or user closed popup
  console.assert(formatUserError(null) === null, 'null input should return null');
  console.assert(formatUserError({ type: 'popup_closed_by_user' }) === null, 'popup_closed_by_user should return null');
  console.assert(formatUserError(new Error('Login dibatalkan')) === null, 'Login dibatalkan should return null');

  // Test 2: sanitizes technical credentials and .env error messages
  const envErr = new Error('API Credentials missing in .env file');
  const envResult = formatUserError(envErr);
  console.assert(envResult !== null && !envResult.includes('.env'), 'Result should not leak .env');
  console.assert(envResult !== null && envResult.includes('Layanan belum siap dikonfigurasi'), 'Result should return friendly message');

  // Test 3: sanitizes network errors
  const netErr = new TypeError('Failed to fetch');
  const netResult = formatUserError(netErr);
  console.assert(netResult !== null && netResult.includes('Koneksi internet Anda terputus'), 'Result should handle network error');

  // Test 4: sanitizes sheet header errors
  const headerErr = new Error('Tidak bisa menemukan kolom "No Body / Unit".');
  const headerResult = formatUserError(headerErr);
  console.assert(headerResult !== null && !headerResult.includes('No Body'), 'Result should not leak technical header names');
  console.assert(headerResult !== null && headerResult.includes('Format kolom pada tabel Google Sheets tidak sesuai'), 'Result should sanitize header error');

  // Test 5: fallback message
  const unknownErr = new Error('Random unexpected error');
  const fallbackResult = formatUserError(unknownErr, 'Pesan fallback khusus');
  console.assert(fallbackResult === 'Pesan fallback khusus', 'Result should use custom fallback message');

  console.log('✅ ErrorFormatter unit test passed');
}

runErrorFormatterTest();
