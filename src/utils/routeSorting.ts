/**
 * Utilitas pengurutan kode rute secara natural alphanumeric (urutan angka alami).
 *
 * Menggantikan sorting ASCII standar (yang menyebabkan "JAK.115" muncul sebelum "JAK.15")
 * dengan Intl numeric comparison sehingga urutan rute selalu rapi dan alami:
 * [JAK.01, JAK.05, JAK.15, JAK.29, JAK.90, JAK.112, JAK.115, ...]
 */

/**
 * Normalisasi format kode rute untuk perbandingan (menyeragamkan spasi dan underscore menjadi titik).
 */
export function normalizeRouteCodeForSort(code: string): string {
  return code.trim().toUpperCase().replace(/[\s_]+/g, '.');
}

/**
 * Membandingkan dua string kode rute dengan natural numeric comparison.
 * Menyeragamkan format spasi dan titik (misal 'JAK 05' dan 'JAK.05') agar urutannya konsisten.
 * Safe terhadap null, undefined, dan whitespace.
 */
export function compareRouteCodes(a?: string | null, b?: string | null): number {
  const codeA = (a || '').trim();
  const codeB = (b || '').trim();

  if (!codeA && !codeB) return 0;
  if (!codeA) return 1;
  if (!codeB) return -1;

  const normA = normalizeRouteCodeForSort(codeA);
  const normB = normalizeRouteCodeForSort(codeB);

  const cmp = normA.localeCompare(normB, 'id', { numeric: true, sensitivity: 'base' });
  if (cmp !== 0) return cmp;

  return codeA.localeCompare(codeB, 'id', { numeric: true, sensitivity: 'base' });
}

/**
 * Mengurutkan array rute secara natural alphanumeric (non-mutating).
 * Otomatis mendeteksi properti `routeCode` (frontend) atau `route_code` (database),
 * atau menerima custom accessor function.
 */
export function sortRoutesByCode<T>(
  routes: readonly T[] | T[] | undefined | null,
  getCode?: (item: T) => string | undefined | null
): T[] {
  if (!routes || routes.length <= 1) {
    return routes ? [...routes] : [];
  }

  return [...routes].sort((itemA, itemB) => {
    const codeA = getCode
      ? getCode(itemA)
      : (itemA as any)?.routeCode || (itemA as any)?.route_code;
    const codeB = getCode
      ? getCode(itemB)
      : (itemB as any)?.routeCode || (itemB as any)?.route_code;

    return compareRouteCodes(codeA, codeB);
  });
}
