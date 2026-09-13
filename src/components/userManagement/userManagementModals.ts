import { pdoSwal, escapeHtml, showErrorAlert } from "@/utils/alertUtils";
import { TEXT_USER_MANAGEMENT } from "@/constants/texts";
import type { UserProfile, UserRole } from "@/types/supabase";

export interface AddUserFormValues {
  email: string;
  full_name?: string;
  role: UserRole;
  notes?: string;
}

/**
 * Dialog SweetAlert2 untuk menambahkan user baru
 */
export async function promptAddUserModal(
  currentUserRole: UserRole | "petugas",
): Promise<AddUserFormValues | null> {
  if (currentUserRole !== "superadmin" && currentUserRole !== "admin") {
    showErrorAlert(
      TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED,
      TEXT_USER_MANAGEMENT.ALERTS.ADD_USER_FORBIDDEN,
    );
    return null;
  }

  const isSuper = currentUserRole === "superadmin";
  const roleOptionsHtml = isSuper
    ? `
      <option value="pdo">${TEXT_USER_MANAGEMENT.ROLES.PDO_OPTION}</option>
      <option value="korlap">${TEXT_USER_MANAGEMENT.ROLES.KORLAP_OPTION}</option>
      <option value="korwil">${TEXT_USER_MANAGEMENT.ROLES.KORWIL_OPTION}</option>
      <option value="admin">${TEXT_USER_MANAGEMENT.ROLES.ADMIN_OPTION}</option>
      <option value="superadmin">${TEXT_USER_MANAGEMENT.ROLES.SUPERADMIN_OPTION}</option>
    `
    : `
      <option value="pdo">${TEXT_USER_MANAGEMENT.ROLES.PDO_OPTION}</option>
      <option value="korlap">${TEXT_USER_MANAGEMENT.ROLES.KORLAP_OPTION}</option>
      <option value="korwil">${TEXT_USER_MANAGEMENT.ROLES.KORWIL_OPTION}</option>
    `;

  const { value: formValues } = await pdoSwal.fire({
    title: TEXT_USER_MANAGEMENT.MODAL_ADD.TITLE,
    html: `
      <div style="text-align:left;font-size:13px;display:flex;flex-direction:column;gap:14px;margin-top:6px;">
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">${TEXT_USER_MANAGEMENT.MODAL_ADD.EMAIL_LABEL} <span style="color:#ef4444">*</span></label>
          <input id="swal-email" type="email" placeholder="${TEXT_USER_MANAGEMENT.MODAL_ADD.EMAIL_PLACEHOLDER}" class="pdo-swal-input" />
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">${TEXT_USER_MANAGEMENT.MODAL_ADD.NAME_LABEL}</label>
          <input id="swal-name" type="text" placeholder="${TEXT_USER_MANAGEMENT.MODAL_ADD.NAME_PLACEHOLDER}" class="pdo-swal-input" />
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">${TEXT_USER_MANAGEMENT.MODAL_ADD.ROLE_LABEL}</label>
          <select id="swal-role" class="pdo-swal-select">
            ${roleOptionsHtml}
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">${TEXT_USER_MANAGEMENT.MODAL_ADD.NOTES_LABEL}</label>
          <input id="swal-notes" type="text" placeholder="${TEXT_USER_MANAGEMENT.MODAL_ADD.NOTES_PLACEHOLDER}" class="pdo-swal-input" />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: TEXT_USER_MANAGEMENT.MODAL_ADD.CONFIRM_BTN,
    cancelButtonText: TEXT_USER_MANAGEMENT.MODAL_ADD.CANCEL_BTN,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
    buttonsStyling: false,
    focusConfirm: false,
    preConfirm: () => {
      const email = (
        document.getElementById("swal-email") as HTMLInputElement
      )?.value?.trim();
      const full_name = (
        document.getElementById("swal-name") as HTMLInputElement
      )?.value?.trim();
      const role = (
        document.getElementById("swal-role") as HTMLSelectElement
      )?.value as UserRole;
      const notes = (
        document.getElementById("swal-notes") as HTMLInputElement
      )?.value?.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        pdoSwal.showValidationMessage("Masukkan format email yang valid!");
        return false;
      }

      return { email, full_name, role, notes };
    },
  });

  return formValues || null;
}

/**
 * Dialog SweetAlert2 untuk mengubah peran user (Superadmin only)
 */
export async function promptEditRoleModal(
  user: UserProfile,
  currentUserRole: UserRole | "petugas",
): Promise<UserRole | null> {
  if (currentUserRole !== "superadmin") {
    showErrorAlert(
      TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED,
      TEXT_USER_MANAGEMENT.ALERTS.EDIT_ROLE_FORBIDDEN,
    );
    return null;
  }

  const { value: newRole } = await pdoSwal.fire({
    title: TEXT_USER_MANAGEMENT.MODAL_EDIT_ROLE.TITLE,
    html: `
      <div style="text-align:left;font-size:13px;margin-top:6px;">
        <p style="margin:0 0 10px;color:var(--text-secondary);font-size:12.5px;">${TEXT_USER_MANAGEMENT.MODAL_EDIT_ROLE.PROMPT(escapeHtml(user.email))}</p>
        <select id="swal-new-role" class="pdo-swal-select">
          <option value="pdo" ${user.role === "pdo" ? "selected" : ""}>${TEXT_USER_MANAGEMENT.ROLES.PDO_OPTION}</option>
          <option value="korlap" ${user.role === "korlap" ? "selected" : ""}>${TEXT_USER_MANAGEMENT.ROLES.KORLAP_OPTION}</option>
          <option value="korwil" ${user.role === "korwil" ? "selected" : ""}>${TEXT_USER_MANAGEMENT.ROLES.KORWIL_OPTION}</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>${TEXT_USER_MANAGEMENT.ROLES.ADMIN_OPTION}</option>
          <option value="superadmin" ${user.role === "superadmin" ? "selected" : ""}>${TEXT_USER_MANAGEMENT.ROLES.SUPERADMIN_OPTION}</option>
        </select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: TEXT_USER_MANAGEMENT.MODAL_EDIT_ROLE.CONFIRM_BTN,
    cancelButtonText: TEXT_USER_MANAGEMENT.MODAL_EDIT_ROLE.CANCEL_BTN,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
    buttonsStyling: false,
    preConfirm: () => {
      return (document.getElementById("swal-new-role") as HTMLSelectElement)
        ?.value as UserRole;
    },
  });

  return newRole || null;
}

/**
 * Dialog SweetAlert2 konfirmasi aktivasi / deaktivasi status akun
 */
export async function promptToggleStatusModal(
  user: UserProfile,
  currentUserRole: UserRole | "petugas",
  currentUserEmail: string,
): Promise<{ confirmed: boolean; nextStatus: boolean; actionText: string } | null> {
  if (currentUserRole !== "superadmin" && currentUserRole !== "admin") {
    showErrorAlert(
      TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED,
      TEXT_USER_MANAGEMENT.ALERTS.TOGGLE_STATUS_FORBIDDEN,
    );
    return null;
  }

  const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
  if (isSelf) {
    showErrorAlert(
      TEXT_USER_MANAGEMENT.ALERTS.ACTION_DENIED,
      TEXT_USER_MANAGEMENT.ALERTS.CANNOT_DEACTIVATE_SELF,
    );
    return null;
  }

  if (
    currentUserRole === "admin" &&
    (user.role === "admin" || user.role === "superadmin")
  ) {
    showErrorAlert(
      TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED,
      TEXT_USER_MANAGEMENT.ALERTS.ADMIN_EDIT_ADMIN_FORBIDDEN,
    );
    return null;
  }

  const nextStatus = user.is_active === false ? true : false;
  const actionText = nextStatus
    ? TEXT_USER_MANAGEMENT.MODAL_STATUS.ACTION_ACTIVATE
    : TEXT_USER_MANAGEMENT.MODAL_STATUS.ACTION_DEACTIVATE;

  const { isConfirmed } = await pdoSwal.fire({
    title: TEXT_USER_MANAGEMENT.MODAL_STATUS.TITLE,
    html: TEXT_USER_MANAGEMENT.MODAL_STATUS.PROMPT(
      actionText,
      escapeHtml(user.email),
    ),
    icon: nextStatus ? "question" : "warning",
    showCancelButton: true,
    confirmButtonText: nextStatus
      ? TEXT_USER_MANAGEMENT.MODAL_STATUS.CONFIRM_ACTIVATE
      : TEXT_USER_MANAGEMENT.MODAL_STATUS.CONFIRM_DEACTIVATE,
    cancelButtonText: TEXT_USER_MANAGEMENT.MODAL_STATUS.CANCEL_BTN,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: nextStatus
        ? "pdo-swal-confirm-btn"
        : "pdo-swal-confirm-btn pdo-swal-confirm-danger-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
    buttonsStyling: false,
  });

  return { confirmed: isConfirmed, nextStatus, actionText };
}
