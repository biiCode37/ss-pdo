/**
 * Modul Utilitas Status Operasional Unit Armada (Single Source of Truth)
 * Menentukan status operasional unit berdasarkan nilai ritase (Golden Rule Ritase),
 * dan pengecualian status penugasan (TO).
 */

import { parseIndonesianNumber } from './numberUtils';

export type NonOperationalBannerType = 'NONE' | 'EMPTY_RITASE' | 'OFF_LIBUR';

export interface BusOperationalInput {
  tripPergi?: string;
  tripPulang?: string;
  keterangan?: string;
}

/**
 * Memeriksa apakah suatu teks keterangan hanya memuat status murni "OFF" atau "LIBUR"
 * yang aman untuk dibersihkan secara otomatis saat unit diaktifkan kembali.
 */
export function shouldClearKeteranganOnActivation(keterangan?: string | null): boolean {
  if (!keterangan) return false;
  const trimmed = keterangan.trim().toUpperCase();
  return trimmed === 'OFF' || trimmed === 'LIBUR';
}

/**
 * Mengevaluasi apakah suatu unit armada berstatus tidak beroperasi (non-operasional).
 * 
 * Aturan Emas:
 * 1. Nilai/kolom ritase adalah penentu mutlak unit tidak beroperasi. Jika ritase > 0, unit beroperasi.
 * 2. Status "TO" / "T.O" / "TO EVDAL" BUKAN unit tidak beroperasi jika ritasenya > 0.
 *    Namun jika ritasenya 0 atau kosong, unit tetap non-operasional karena ritasenya 0.
 * 3. Ritase diisi lewat "Set Jumlah Trip" atau kartu unit; selama ritase 0/kosong, unit non-operasional.
 */
export function isBusNonOperational(bus?: BusOperationalInput | null): boolean {
  const trip1 = parseIndonesianNumber(bus?.tripPergi);
  const trip2 = parseIndonesianNumber(bus?.tripPulang);
  const totalRitase = (trip1 + trip2) / 2;

  return totalRitase <= 0;
}

/**
 * Menentukan tipe banner peringatan unit non-operasional pada modal input bus.
 */
export function getNonOperationalBannerType(
  bus?: BusOperationalInput | null
): NonOperationalBannerType {
  if (!isBusNonOperational(bus)) {
    return 'NONE';
  }

  if (shouldClearKeteranganOnActivation(bus?.keterangan)) {
    return 'OFF_LIBUR';
  }

  return 'EMPTY_RITASE';
}
