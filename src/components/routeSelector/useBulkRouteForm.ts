import { useState } from 'react';
import { parseBulkSheetUrls } from '@/utils/bulkRouteParser';
import {
  inspectBulkRoutesWithConcurrency,
  type BulkRouteItem,
} from '@/utils/bulkRouteInspector';
import { createBulkRoutesWithSheets } from '@/services/routeService';
import { TEXT_DASHBOARD } from '@/constants/texts';
import type { FlatRouteSheet } from './types';

interface UseBulkRouteFormOptions {
  flatSheets: FlatRouteSheet[];
  loadRoutes: () => Promise<any>;
  onCloseModal: () => void;
}

export function useBulkRouteForm({
  flatSheets,
  loadRoutes,
  onCloseModal,
}: UseBulkRouteFormOptions) {
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkItems, setBulkItems] = useState<BulkRouteItem[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectProgress, setInspectProgress] = useState({ current: 0, total: 0 });
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkFormError, setBulkFormError] = useState<string | null>(null);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  const texts = TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD;

  // Memeriksa dan mengekstrak rute dari teks mentah
  const handleInspectBulk = async (fallbackMonth: number, fallbackYear: number) => {
    setBulkFormError(null);
    setBulkSuccessMessage(null);

    const parsedUrls = parseBulkSheetUrls(bulkRawText);
    if (parsedUrls.length === 0) {
      setBulkFormError(texts.EMPTY_INPUT_WARNING);
      return;
    }

    setIsInspecting(true);
    setInspectProgress({ current: 0, total: parsedUrls.length });

    try {
      const existingSheets = flatSheets.map((f) => ({
        routeCode: f.routeCode,
        sheet: { month: f.sheet.month, year: f.sheet.year },
      }));

      const results = await inspectBulkRoutesWithConcurrency(
        parsedUrls,
        fallbackMonth,
        fallbackYear,
        existingSheets,
        (_updatedItem, index) => {
          setInspectProgress((prev) => ({
            ...prev,
            current: Math.min(index + 1, parsedUrls.length),
          }));
        }
      );

      setBulkItems(results);
    } catch (err: any) {
      setBulkFormError(err?.message || 'Gagal memeriksa daftar spreadsheet.');
    } finally {
      setIsInspecting(false);
    }
  };

  // Toggle pilihan simpan per baris
  const handleToggleSelect = (index: number) => {
    setBulkItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Toggle pilih semua rute yang siap
  const handleToggleSelectAll = (selectAll: boolean) => {
    setBulkItems((prev) =>
      prev.map((item) =>
        item.status === 'ready' ? { ...item, selected: selectAll } : item
      )
    );
  };

  // Simpan rute-rute yang terpilih ke database Supabase
  const handleSaveBulk = async () => {
    const selectedItems = bulkItems.filter((it) => it.selected && it.status === 'ready');
    if (selectedItems.length === 0) {
      setBulkFormError(texts.NO_VALID_ROUTES);
      return;
    }

    setIsSavingBulk(true);
    setBulkFormError(null);

    try {
      const payload = selectedItems.map((it) => ({
        routeCode: it.routeCode!,
        routeName: it.routeName || it.routeCode!,
        year: it.year,
        month: it.month,
        sheetUrl: it.sheetUrl,
        spreadsheetId: it.id,
      }));

      const result = await createBulkRoutesWithSheets(payload);

      if (result.success) {
        await loadRoutes();
        setBulkSuccessMessage(texts.SAVE_SUCCESS(result.savedCount));
        setTimeout(() => {
          resetBulkForm();
          onCloseModal();
        }, 1200);
      } else {
        setBulkFormError(result.message || 'Gagal menyimpan bulk rute.');
      }
    } catch (err: any) {
      setBulkFormError(err?.message || 'Terjadi kesalahan saat menyimpan rute.');
    } finally {
      setIsSavingBulk(false);
    }
  };

  const resetBulkForm = () => {
    setBulkRawText('');
    setBulkItems([]);
    setIsInspecting(false);
    setIsSavingBulk(false);
    setBulkFormError(null);
    setBulkSuccessMessage(null);
  };

  return {
    bulkRawText,
    setBulkRawText,
    bulkItems,
    isInspecting,
    inspectProgress,
    isSavingBulk,
    bulkFormError,
    bulkSuccessMessage,
    handleInspectBulk,
    handleToggleSelect,
    handleToggleSelectAll,
    handleSaveBulk,
    resetBulkForm,
  };
}
