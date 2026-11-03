/**
 * Modul Utilitas Status Operasional Unit Armada (Single Source of Truth)
 * Menentukan status operasional unit berdasarkan nilai ritase (Golden Rule Ritase),
 * pengecualian status penugasan (TO), dan keselarasan dengan data plotting harian.
 */

import { parseIndonesianNumber } from './numberUtils';

export type NonOperationalBannerType = 'NONE' | 'EMPTY_RITASE' | 'OFF_LIBUR';

export interface BusOperationalInput {
  tripPergi?: string;
  tripPulang?: string;
  keterangan?: string;
}

export interface PlottingOperationalInput {
  target_ritase?: number;
  status?: string;
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
 * 3. Jika ritase 0 atau kosong dan data plotting tersedia:
 *    - Jika target_ritase === 0 atau status === 'OFF', unit non-operasional (true).
 *    - Jika target_ritase > 0 (dan status !== 'OFF'), unit direncanakan beroperasi (false).
 * 4. Jika ritase 0/kosong dan tidak ada data plotting dengan target > 0, unit non-operasional (true).
 */
export function isBusNonOperational(
  bus?: BusOperationalInput | null,
  plottingItem?: PlottingOperationalInput | null
): boolean {
  const trip1 = parseIndonesianNumber(bus?.tripPergi);
  const trip2 = parseIndonesianNumber(bus?.tripPulang);
  const totalRitase = (trip1 + trip2) / 2;

  // Jika unit memiliki ritase riil > 0, unit dinyatakan beroperasi
  if (totalRitase > 0) {
    return false;
  }

  // Jika belum ada ritase riil (> 0), periksa rencana plotting jika ada
  if (plottingItem) {
    if (plottingItem.status === 'OFF' || plottingItem.target_ritase === 0) {
      return true;
    }
    if (typeof plottingItem.target_ritase === 'number' && plottingItem.target_ritase > 0) {
      return false;
    }
  }

  // Jika ritase 0 atau kosong dan tidak ada target ritase plotting > 0
  return true;
}

/**
 * Menentukan tipe banner peringatan unit non-operasional pada modal input bus.
 */
export function getNonOperationalBannerType(
  bus?: BusOperationalInput | null,
  plottingItem?: PlottingOperationalInput | null
): NonOperationalBannerType {
  if (!isBusNonOperational(bus, plottingItem)) {
    return 'NONE';
  }

  if (shouldClearKeteranganOnActivation(bus?.keterangan)) {
    return 'OFF_LIBUR';
  }

  return 'EMPTY_RITASE';
}
