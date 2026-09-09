/**
 * Kamus teks antarmuka: Modal Detail Armada, riwayat mutasi, metrik shift 1 & 2, dan akumulasi total.
 */
export const TEXT_UNIT_DETAIL = {
  TITLE: 'Ringkasan Rekapitulasi Armada',
  SHIFT_1_TITLE: 'Shift 1',
  SHIFT_2_TITLE: 'Shift 2',
  TOTAL_TITLE: 'Akumulasi Total',
  KM_UNIT: 'KM',
  KM_TOTAL_UNIT: 'KM Total',
  PASSENGER_UNIT: 'Pnp',
  PASSENGER_TOTAL_UNIT: 'Pnp Total',
  RITASE_UNIT: 'Ritase',
  TARGET_ACHIEVED: 'Target Tercapai',
  TARGET_DEFICIT: (pergi: number, pulang: number) => `Kurang Ritase (Target: ${pergi}/${pulang})`,
  TOA_LABEL: 'TOA:',
  MANUAL_LABEL: 'Man:',
  TOTAL_TOA_LABEL: 'Total TOA:',
  TOTAL_MANUAL_LABEL: 'Manual:',
  NOTES_SECTION_TITLE: 'Catatan & Keterangan Operasional',
  NO_NOTES: 'Tidak ada catatan khusus yang dilaporkan untuk unit ini.',
} as const;
