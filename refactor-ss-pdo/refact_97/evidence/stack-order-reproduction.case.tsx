// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueueModal } from "../../../src/components/dashboard/QueueModal";
import { ReportModalLayout } from "../../../src/components/pdoReport/ReportModalLayout";
import {
  _resetModalStackForTest,
  isTopmostModal,
} from "../../../src/utils/modalStackCoordinator";
import { _resetScrollLockCoordinatorForTest } from "../../../src/utils/scrollLockCoordinator";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  _resetModalStackForTest();
  _resetScrollLockCoordinatorForTest();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  _resetModalStackForTest();
  _resetScrollLockCoordinatorForTest();
  document.body.style.overflow = "";
});

function Harness({ reportOpen }: { reportOpen: boolean }) {
  return (
    <>
      <ReportModalLayout
        isOpen={reportOpen}
        onClose={() => {}}
        routeCode="1A"
        status="draft"
      >
        <div>Laporan</div>
      </ReportModalLayout>
      <QueueModal
        isOpen={true}
        onClose={() => {}}
        queue={[]}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        onResolveConflict={vi.fn()}
        onForceConflict={vi.fn()}
        onProcessQueue={vi.fn()}
      />
    </>
  );
}

it("reproduces: opening Report after Queue leaves Queue as keyboard topmost behind higher visual layer", async () => {
  await act(async () => root.render(<Harness reportOpen={false} />));
  await act(async () => root.render(<Harness reportOpen={true} />));

  const report = document.getElementById("route-operational-report-modal")!;
  const queue = document.getElementById("queue-modal")!;
  expect(Number(report.style.zIndex)).toBeGreaterThan(Number(queue.style.zIndex));
  expect(isTopmostModal("queue-modal")).toBe(true);
  expect(isTopmostModal("route-operational-report-modal")).toBe(false);
});
