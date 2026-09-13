import Swal from "sweetalert2";
import type { SweetAlertPosition } from "sweetalert2";

/**
 * Mendapatkan tema aktif aplikasi (light atau dark) dari atribut HTML
 */
export function getCurrentTheme(): "light" | "dark" {
  if (typeof document !== "undefined") {
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "dark"
    );
  }
  return "dark";
}

/**
 * Base SweetAlert instance dengan custom class styling SS_PDO
 */
export const pdoSwal = Swal.mixin({
  customClass: {
    container: "pdo-swal-container",
    popup: "pdo-swal-popup",
    confirmButton: "pdo-swal-confirm-btn",
    cancelButton: "pdo-swal-cancel-btn",
  },
  buttonsStyling: false,
  showClass: {
    popup: "swal2-show",
    backdrop: "swal2-backdrop-show",
  },
  hideClass: {
    popup: "swal2-hide",
    backdrop: "swal2-backdrop-hide",
  },
});

/**
 * Base Toast instance SweetAlert2
 */
export const pdoToast = Swal.mixin({
  toast: true,
  position: "top" as SweetAlertPosition,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: "pdo-swal-toast",
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});
