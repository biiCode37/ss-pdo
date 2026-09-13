import type { BusData, HeaderMap } from "@/services/googleSheets";
import { splitShiftKeterangan } from "@/utils/keteranganUtils";
import {
  showWarningToast,
  showBusInputModal,
  escapeHtml,
  pdoSwal,
} from "@/utils/alertUtils";
import { TEXT_DASHBOARD, TEXT_FLEET_STATUS } from "@/constants/texts";

interface UseBusCardModalOptions {
  bus: BusData;
  formData: Partial<BusData>;
  tabName: string;
  headerMap: HeaderMap;
  activeCategory: string;
  activeShift?: 1 | 2;
  isShiftConfirmed?: boolean;
  onOpenFleetStatus?: () => void;
  handleSaveUpdates: (updates: Partial<BusData>, forceOverwrite?: boolean) => Promise<void>;
}

export function useBusCardModal({
  bus,
  formData,
  tabName,
  headerMap,
  activeCategory,
  activeShift = 1,
  isShiftConfirmed,
  onOpenFleetStatus,
  handleSaveUpdates,
}: UseBusCardModalOptions) {
  const { s1: shift1Status, s2: shift2Status } = splitShiftKeterangan(
    formData.keterangan || bus.keterangan || "",
  );

  const relevantShift: 1 | 2 =
    activeCategory.includes("2") ? 2 :
    activeCategory.includes("1") ? 1 :
    (activeShift || 1);

  const activeShiftStatus = relevantShift === 1 ? shift1Status : shift2Status;
  const isNonSgo = Boolean(activeShiftStatus && activeShiftStatus.trim() !== "");

  const handleOpenModal = async (
    initialTab?: "shift1" | "shift2" | "trip" | "notes",
  ) => {
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }

    // 1. Jika shift belum dikonfirmasi status armadanya, blokir input dan minta konfirmasi status armada
    if (isShiftConfirmed === false) {
      showWarningToast(TEXT_FLEET_STATUS.MODAL.LOCK_CARD_TOOLTIP);
      if (onOpenFleetStatus) {
        onOpenFleetStatus();
      }
      return;
    }

    // 2. Jika unit berstatus non-SGO (OFF, TO EVDAL, BA), blokir pengisian data operasional
    if (isNonSgo) {
      const confirmResult = await pdoSwal.fire({
        icon: "warning",
        title: TEXT_FLEET_STATUS.MODAL.NON_SGO_ALERT_TITLE(escapeHtml(bus.unit)),
        html: TEXT_FLEET_STATUS.MODAL.NON_SGO_ALERT_HTML(
          escapeHtml(bus.unit),
          escapeHtml(activeShiftStatus),
        ),
        showCancelButton: true,
        confirmButtonText: TEXT_FLEET_STATUS.MODAL.NON_SGO_BTN_OPEN_FLEET,
        cancelButtonText: TEXT_FLEET_STATUS.MODAL.NON_SGO_BTN_CANCEL,
        confirmButtonColor: "#38bdf8",
        cancelButtonColor: "#71717a",
      });

      if (confirmResult.isConfirmed && onOpenFleetStatus) {
        onOpenFleetStatus();
      }
      return;
    }

    const updates = await showBusInputModal({
      bus: { ...bus, ...formData },
      activeCategory,
      tabName,
      headerMap,
      initialTab,
    });

    if (updates) {
      await handleSaveUpdates(updates);
    }
  };

  return {
    isNonSgo,
    activeShiftStatus,
    handleOpenModal,
  };
}
