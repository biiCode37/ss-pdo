/**
 * Barrel & Facade untuk Handler Interaksi Modal Input Bus
 * Mendukung pembagian modular submodul keterangan, event listeners, dan validasi preConfirm.
 */

export {
  setupSmartKeteranganLogic,
  extractKeteranganFromForm,
} from "./busModalKeterangan";

export { setupModalEventListeners } from "./busModalEventListeners";

export { handleModalPreConfirm } from "./busModalPreConfirm";
