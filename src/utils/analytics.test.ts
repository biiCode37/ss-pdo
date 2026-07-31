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
    unit: 'KMJ 1987',
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
  const summary = calculateAnalytics(mockBusData);
  console.assert(summary.totalKm === 200, 'totalKm should be 200');
  console.assert(summary.totalPassengers === 210, 'totalPassengers should be 210');
  console.assert(summary.totalToaShift1 === 83, 'totalToaShift1 should be 83');
  console.assert(summary.totalToaShift2 === 127, 'totalToaShift2 should be 127');
  console.assert(summary.totalShift1 === 83, 'totalShift1 should be 83');
  console.assert(summary.totalShift2 === 127, 'totalShift2 should be 127');
  console.assert(summary.totalBuses === 2, 'totalBuses should be 2');
  console.assert(summary.filledBuses === 1, 'filledBuses should be 1');
  console.assert(summary.unfilledBuses === 1, 'unfilledBuses should be 1');
  console.assert(summary.kmPerBus === 200, 'kmPerBus should be 200');
  console.assert(summary.passengersPerKm === 1.05, 'passengersPerKm should be 1.05');
  console.log('✅ calculateAnalytics unit test passed');
}

runAnalyticsTest();
