import type { PlottingStartPoint } from '../types/supabase';

export interface SmartTripSplit {
  tripPergi: number;
  tripPulang: number;
}

/**
 * Menghitung pecahan Trip Pergi & Trip Pulang dari target ritase dan titik start:
 * - Ritase bulat (misal 7.0 rit) -> Pergi: 7, Pulang: 7 (sama persis).
 * - Ritase setengah (misal 7.5 rit):
 *   - Start di A (Priok) -> Pergi: 8, Pulang: 7 (Pergi lebih banyak 1 trip).
 *   - Start di B (IGI)   -> Pergi: 7, Pulang: 8 (Pulang lebih banyak 1 trip).
 */
export function calculateSmartTripSplit(
  targetRitase: number,
  startPoint: PlottingStartPoint = 'A',
): SmartTripSplit {
  const isHalfRitase = targetRitase % 1 !== 0;

  if (!isHalfRitase) {
    return {
      tripPergi: Math.round(targetRitase),
      tripPulang: Math.round(targetRitase),
    };
  }

  const lower = Math.floor(targetRitase);
  const upper = Math.ceil(targetRitase);

  if (startPoint === 'A') {
    return {
      tripPergi: upper,
      tripPulang: lower,
    };
  } else {
    return {
      tripPergi: lower,
      tripPulang: upper,
    };
  }
}

export interface SmartTripValidationParams {
  tripPergi: number;
  tripPulang: number;
  startPoint?: PlottingStartPoint;
  endpointAName?: string;
  endpointBName?: string;
}

export interface SmartTripValidationResult {
  isValid: boolean;
  warning?: string;
  finalEndpoint?: string;
  isBackToBase?: boolean;
}

/**
 * Memvalidasi hukum fisika rute 2 titik pengendapan:
 * 1. |TripPergi - TripPulang| <= 1. Selisih > 1 adalah anomali fisik.
 * 2. Unit Start A tidak boleh memiliki Pulang > Pergi.
 * 3. Unit Start B tidak boleh memiliki Pergi > Pulang.
 * 4. Menentukan titik akhir pengendapan operasional (finish point).
 */
export function validateSmartTripPhysicalInvariants({
  tripPergi,
  tripPulang,
  startPoint = 'A',
  endpointAName = 'Titik A',
  endpointBName = 'Titik B',
}: SmartTripValidationParams): SmartTripValidationResult {
  const diff = tripPergi - tripPulang;
  const absDiff = Math.abs(diff);

  // Invarian 1: Selisih trip tidak boleh lebih dari 1
  if (absDiff > 1) {
    return {
      isValid: false,
      warning: 'Selisih trip tidak boleh lebih dari 1 trip (mobil tidak bisa lompat rute).',
    };
  }

  // Invarian 2: Start di A tidak bisa memiliki Pulang > Pergi
  if (startPoint === 'A' && tripPulang > tripPergi) {
    return {
      isValid: false,
      warning: `Unit start dari ${endpointAName}, trip pulang tidak boleh melebihi trip pergi.`,
    };
  }

  // Invarian 3: Start di B tidak bisa memiliki Pergi > Pulang
  if (startPoint === 'B' && tripPergi > tripPulang) {
    return {
      isValid: false,
      warning: `Unit start dari ${endpointBName}, trip pergi tidak boleh melebihi trip pulang.`,
    };
  }

  // Hitung Titik Akhir Operasional
  const totalTrips = tripPergi + tripPulang;
  if (totalTrips === 0) {
    return { isValid: true };
  }

  const isBackToBase = diff === 0;
  let finalEndpoint = endpointAName;

  if (startPoint === 'A') {
    finalEndpoint = isBackToBase ? endpointAName : endpointBName;
  } else {
    finalEndpoint = isBackToBase ? endpointBName : endpointAName;
  }

  return {
    isValid: true,
    finalEndpoint,
    isBackToBase,
  };
}
