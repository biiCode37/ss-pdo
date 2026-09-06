import { isAuthError } from '../../utils/errorClassifier';
import { getKeteranganColor, getRowEndCol } from '../../utils/sheetColorUtils';
import { normalizeKeterangan } from '../../utils/keteranganUtils';
import { logActivity } from '../routeService';
import { resolveRouteContext } from '../../utils/auditLogContext';
import type { BusData, HeaderMap } from './types';
import { getTabGid, numberToColumnName } from './core';
import { updateSheetValuesBatch, batchUpdateSpreadsheet } from './transport';

export const updateBusData = async (
  sheetId: string, 
  tabName: string, 
  rowIndex: number, 
  updates: Partial<BusData>, 
  headerMap: HeaderMap,
  previousValues?: Partial<BusData>,
): Promise<void> => {
    // Construct individual updates for each cell to avoid overwriting formulas
    const data: any[] = [];
    const formatCells: Array<{ colIndex: number; rowIndex: number }> = [];
    
    const addUpdate = (key: keyof HeaderMap, value: any) => {
      const colIndex = headerMap[key];
      if (colIndex !== undefined && colIndex !== -1 && value !== undefined) {
        const colName = numberToColumnName(colIndex);
        data.push({
          range: `${tabName}!${colName}${rowIndex}`,
          values: [[value]]
        });
        formatCells.push({ colIndex, rowIndex });
      }
    };

    if (updates.tripPergi !== undefined) addUpdate('tripPergi', updates.tripPergi);
    if (updates.tripPulang !== undefined) addUpdate('tripPulang', updates.tripPulang);
    if (updates.toaShift1 !== undefined) addUpdate('toaShift1', updates.toaShift1);
    if (updates.manualShift1 !== undefined) addUpdate('manualShift1', updates.manualShift1);
    if (updates.manualShift2 !== undefined) addUpdate('manualShift2', updates.manualShift2);
    if (updates.totalToa !== undefined) addUpdate('totalToa', updates.totalToa);
    if (updates.kmAwal1 !== undefined) addUpdate('kmAwal1', updates.kmAwal1);
    if (updates.kmAkhir1 !== undefined) addUpdate('kmAkhir1', updates.kmAkhir1);
    if (updates.kmAwal2 !== undefined) addUpdate('kmAwal2', updates.kmAwal2);
    if (updates.kmAkhir2 !== undefined) addUpdate('kmAkhir2', updates.kmAkhir2);
    if (updates.keterangan !== undefined) addUpdate('keterangan', normalizeKeterangan(updates.keterangan));

    if (data.length === 0) return; // Nothing to update

    try {
      await updateSheetValuesBatch(sheetId, {
        valueInputOption: 'USER_ENTERED', // So numbers/formulas are parsed properly
        data: data
      });

      // Format sel: Normal text (Bold untuk Keterangan), Horizontal Center, Vertical Middle, Wrap Text & Row Color
      try {
        const tabGid = await getTabGid(sheetId, tabName);
        if (tabGid !== null) {
          const requests: any[] = [];

          if (formatCells.length > 0) {
            for (const cell of formatCells) {
              const isKet =
                headerMap.keterangan !== undefined &&
                cell.colIndex === headerMap.keterangan;
              requests.push({
                repeatCell: {
                  range: {
                    sheetId: tabGid,
                    startRowIndex: cell.rowIndex - 1,
                    endRowIndex: cell.rowIndex,
                    startColumnIndex: cell.colIndex,
                    endColumnIndex: cell.colIndex + 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: { bold: isKet },
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE",
                      wrapStrategy: "WRAP",
                    },
                  },
                  fields: "userEnteredFormat(textFormat.bold,horizontalAlignment,verticalAlignment,wrapStrategy)",
                },
              });
            }
          }

          // Pewarnaan baris (dari No Body sampai kolom Total KM Shift 2) jika kolom Keterangan diperbarui
          if (updates.keterangan !== undefined) {
            const startCol =
              headerMap.unit !== undefined && headerMap.unit !== -1
                ? headerMap.unit
                : 0;
            const endCol = getRowEndCol(headerMap);

            const rowColor = getKeteranganColor(updates.keterangan);

            requests.push({
              repeatCell: {
                range: {
                  sheetId: tabGid,
                  startRowIndex: rowIndex - 1,
                  endRowIndex: rowIndex,
                  startColumnIndex: startCol,
                  endColumnIndex: endCol,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: rowColor || { red: 1, green: 1, blue: 1 },
                  },
                },
                fields: "userEnteredFormat.backgroundColor",
              },
            });
          }

          if (requests.length > 0) {
            await batchUpdateSpreadsheet(sheetId, requests);
          }
        }
      } catch (formatErr) {
        console.warn("[GoogleSheets] Cell formatting notice (values saved):", formatErr);
      }

      // Telemetry: Log UPDATE_BUS_DATA
      const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'field_operator';
      const updatedFields = Object.keys(updates).filter(k => (updates as any)[k] !== undefined);
      const before: Record<string, string> = {};
      const after: Record<string, string> = {};
      for (const field of updatedFields) {
        before[field] = String((previousValues as any)?.[field] ?? '');
        after[field] = String((updates as any)[field] ?? '');
      }
      const routeContext = resolveRouteContext(sheetId, tabName);
      logActivity({
        user_email: userEmail,
        action: 'UPDATE_BUS_DATA',
        route_code: routeContext.routeCode,
        details: {
          sheetId,
          tabName,
          rowIndex,
          year: routeContext.year,
          month: routeContext.month,
          day: routeContext.day,
          updatedFields,
          changedValues: { before, after },
        },
      }).catch(() => {});
    } catch (error: any) {
      console.error('Error updating data', error);
      if (isAuthError(error)) {
        throw error;
      }
      throw new Error(error?.result?.error?.message || error?.message || 'Gagal menyimpan data.');
    }
};

export const updateBulkBusData = async (
  sheetId: string,
  tabName: string,
  updatesList: Array<{ rowIndex: number; updates: Partial<BusData> }>,
  headerMap: HeaderMap
): Promise<void> => {
    const data: any[] = [];
    const formatCells: Array<{ colIndex: number; rowIndex: number }> = [];

    for (const item of updatesList) {
      const { rowIndex, updates } = item;
      const addUpdate = (key: keyof HeaderMap, value: any) => {
        const colIndex = headerMap[key];
        if (colIndex !== undefined && colIndex !== -1 && value !== undefined) {
          const colName = numberToColumnName(colIndex);
          data.push({
            range: `${tabName}!${colName}${rowIndex}`,
            values: [[value]]
          });
          formatCells.push({ colIndex, rowIndex });
        }
      };

      if (updates.tripPergi !== undefined) addUpdate('tripPergi', updates.tripPergi);
      if (updates.tripPulang !== undefined) addUpdate('tripPulang', updates.tripPulang);
      if (updates.toaShift1 !== undefined) addUpdate('toaShift1', updates.toaShift1);
      if (updates.manualShift1 !== undefined) addUpdate('manualShift1', updates.manualShift1);
      if (updates.manualShift2 !== undefined) addUpdate('manualShift2', updates.manualShift2);
      if (updates.totalToa !== undefined) addUpdate('totalToa', updates.totalToa);
      if (updates.kmAwal1 !== undefined) addUpdate('kmAwal1', updates.kmAwal1);
      if (updates.kmAkhir1 !== undefined) addUpdate('kmAkhir1', updates.kmAkhir1);
      if (updates.kmAwal2 !== undefined) addUpdate('kmAwal2', updates.kmAwal2);
      if (updates.kmAkhir2 !== undefined) addUpdate('kmAkhir2', updates.kmAkhir2);
      if (updates.keterangan !== undefined) addUpdate('keterangan', normalizeKeterangan(updates.keterangan));
    }

    if (data.length === 0) return;

    try {
      await updateSheetValuesBatch(sheetId, {
        valueInputOption: 'USER_ENTERED',
        data: data
      });

      // Format sel bulk: Normal text (Bold untuk Keterangan), Horizontal Center, Vertical Middle, Wrap Text & Row Color
      try {
        const tabGid = await getTabGid(sheetId, tabName);
        if (tabGid !== null) {
          const requests: any[] = [];

          if (formatCells.length > 0) {
            for (const cell of formatCells) {
              const isKet =
                headerMap.keterangan !== undefined &&
                cell.colIndex === headerMap.keterangan;
              requests.push({
                repeatCell: {
                  range: {
                    sheetId: tabGid,
                    startRowIndex: cell.rowIndex - 1,
                    endRowIndex: cell.rowIndex,
                    startColumnIndex: cell.colIndex,
                    endColumnIndex: cell.colIndex + 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: { bold: isKet },
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE",
                      wrapStrategy: "WRAP",
                    },
                  },
                  fields: "userEnteredFormat(textFormat.bold,horizontalAlignment,verticalAlignment,wrapStrategy)",
                },
              });
            }
          }

          const startCol =
            headerMap.unit !== undefined && headerMap.unit !== -1
              ? headerMap.unit
              : 0;
          const endCol = getRowEndCol(headerMap);

          for (const item of updatesList) {
            if (item.updates.keterangan !== undefined) {
              const rowColor = getKeteranganColor(item.updates.keterangan);
              requests.push({
                repeatCell: {
                  range: {
                    sheetId: tabGid,
                    startRowIndex: item.rowIndex - 1,
                    endRowIndex: item.rowIndex,
                    startColumnIndex: startCol,
                    endColumnIndex: endCol,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor:
                        rowColor || { red: 1, green: 1, blue: 1 },
                    },
                  },
                  fields: "userEnteredFormat.backgroundColor",
                },
              });
            }
          }

          if (requests.length > 0) {
            await batchUpdateSpreadsheet(sheetId, requests);
          }
        }
      } catch (formatErr) {
        console.warn("[GoogleSheets] Bulk cell formatting notice (values saved):", formatErr);
      }

      const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'field_operator';
      const bulkCtx = resolveRouteContext(sheetId, tabName);
      logActivity({
        user_email: userEmail,
        action: 'UPDATE_BULK_BUS_DATA',
        route_code: bulkCtx.routeCode,
        details: {
          sheetId,
          tabName,
          unitCount: updatesList.length,
          year: bulkCtx.year,
          month: bulkCtx.month,
          day: bulkCtx.day,
        },
      }).catch(() => {});
    } catch (error: any) {
      console.error('Error batch updating bulk bus data', error);
      if (isAuthError(error)) {
        throw error;
      }
      throw new Error(error?.result?.error?.message || error?.message || 'Gagal menyimpan bulk data ke spreadsheet.');
    }
};

export const formatWholeSheet = async (
  sheetId: string,
  tabName: string,
  buses: BusData[],
  headerMap: HeaderMap,
): Promise<void> => {
  if (!buses || buses.length === 0) return;

  const tabGid = await getTabGid(sheetId, tabName);
  if (tabGid === null) {
    throw new Error("Tidak dapat menemukan ID tab spreadsheet.");
  }

  const startCol =
    headerMap.unit !== undefined && headerMap.unit !== -1
      ? headerMap.unit
      : 0;
  const endCol = getRowEndCol(headerMap);

  const minRowIndex = Math.min(...buses.map((b) => b.rowIndex));
  const maxRowIndex = Math.max(...buses.map((b) => b.rowIndex));

  // 0. Auto-standardisasi nilai teks Keterangan di spreadsheet asli (misal: "ba01" -> "BA.01", "np 1" -> "NP1")
  if (headerMap.keterangan !== undefined && headerMap.keterangan !== -1) {
    const ketColName = numberToColumnName(headerMap.keterangan);
    const valueUpdates: any[] = [];
    for (const bus of buses) {
      if (bus.keterangan) {
        const normalizedKet = normalizeKeterangan(bus.keterangan);
        if (normalizedKet !== bus.keterangan) {
          valueUpdates.push({
            range: `${tabName}!${ketColName}${bus.rowIndex}`,
            values: [[normalizedKet]],
          });
          bus.keterangan = normalizedKet;
        }
      }
    }
    if (valueUpdates.length > 0) {
      try {
        await updateSheetValuesBatch(sheetId, {
          valueInputOption: "USER_ENTERED",
          data: valueUpdates,
        });
      } catch (valErr) {
        console.warn("[GoogleSheets] Gagal memperbarui standardisasi nilai keterangan di spreadsheet:", valErr);
      }
    }
  }

    const requests: any[] = [];

    // 1. Format dasar seluruh grid data: Normal text, Center horizontal, Middle vertical, Wrap text
    requests.push({
      repeatCell: {
        range: {
          sheetId: tabGid,
          startRowIndex: minRowIndex - 1,
          endRowIndex: maxRowIndex,
          startColumnIndex: startCol,
          endColumnIndex: endCol,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: false },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
          },
        },
        fields:
          "userEnteredFormat(textFormat.bold,horizontalAlignment,verticalAlignment,wrapStrategy)",
      },
    });

    // 1b. Format khusus kolom Keterangan: BOLD
    if (headerMap.keterangan !== undefined && headerMap.keterangan !== -1) {
      requests.push({
        repeatCell: {
          range: {
            sheetId: tabGid,
            startRowIndex: minRowIndex - 1,
            endRowIndex: maxRowIndex,
            startColumnIndex: headerMap.keterangan,
            endColumnIndex: headerMap.keterangan + 1,
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
              wrapStrategy: "WRAP",
            },
          },
          fields:
            "userEnteredFormat(textFormat.bold,horizontalAlignment,verticalAlignment,wrapStrategy)",
        },
      });
    }

    // 2. Format warna latar belakang baris berdasarkan status Keterangan setiap unit bus (No Body s/d Total KM Shift 2)
    for (const bus of buses) {
      const rowColor = getKeteranganColor(bus.keterangan);
      requests.push({
        repeatCell: {
          range: {
            sheetId: tabGid,
            startRowIndex: bus.rowIndex - 1,
            endRowIndex: bus.rowIndex,
            startColumnIndex: startCol,
            endColumnIndex: endCol,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: rowColor || { red: 1, green: 1, blue: 1 },
            },
          },
          fields: "userEnteredFormat.backgroundColor",
        },
      });
    }

    try {
      await batchUpdateSpreadsheet(sheetId, requests);

      // Telemetry: Log FORMAT_WHOLE_SHEET
      const userEmail =
        localStorage.getItem("PDO_USER_EMAIL") || "field_operator";
      const fmtCtx = resolveRouteContext(sheetId, tabName);
      logActivity({
        user_email: userEmail,
        action: "FORMAT_WHOLE_SHEET",
        route_code: fmtCtx.routeCode,
        details: {
          sheetId,
          tabName,
          busCount: buses.length,
          year: fmtCtx.year,
          month: fmtCtx.month,
          day: fmtCtx.day,
        },
      }).catch(() => {});
    } catch (error: any) {
      console.error("Error formatting whole sheet", error);
      if (isAuthError(error)) {
        throw error;
      }
      throw new Error(
        error?.result?.error?.message || error?.message || "Gagal menerapkan format spreadsheet.",
      );
    }
};
