import { calculateAnalytics } from './analytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'KMJ 1986',
    toaShift1: '83',
    toaShift2: '127',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '210',
    kmAwal1: '100',
    kmAkhir1: '200',
    kmAwal2: '200',
    kmAkhir2: '300',
    keterangan: '',
    originalRow: []
  },
  {
    rowIndex: 3,
    unit: 'KMJ 1987 (Mogok)',
    toaShift1: '0',
    toaShift2: '0',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '0',
    kmAwal1: '',
    kmAkhir1: '',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: 'NP 1',
    originalRow: []
  }
];

export function runAnalyticsTest() {
  // Test local calculation with AVERAGEIF(KM > 0)
  const localSummary = calculateAnalytics(mockBusData);
  console.assert(localSummary.totalKm === 200, 'totalKm should be 200');
  console.assert(localSummary.kmPerBus === 200, 'kmPerBus should be 200 (200 KM / 1 active bus)');
  console.assert(localSummary.passengersPerKm === 1.05, 'passengersPerKm should be 1.05 (210 / 200)');

  // Test SSOT priority from sheetSummary
  const ssotSummary = calculateAnalytics(mockBusData, {
    totalKm: 5589.06,
    totalPassengers: 4670,
    kmPerBus: 192.7262,
    passengersPerKm: 0.8355
  });

  console.assert(ssotSummary.totalKm === 5589.1, 'SSOT totalKm formatted to 1 decimal');
  console.assert(ssotSummary.kmPerBus === 192.7, 'SSOT kmPerBus formatted to 1 decimal');
  console.assert(ssotSummary.passengersPerKm === 0.84, 'SSOT passengersPerKm formatted to 2 decimals');

  console.log('✅ SSOT Executive Analytics unit test passed');
}

runAnalyticsTest();
