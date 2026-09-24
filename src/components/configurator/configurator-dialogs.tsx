"use client";

import type { useFrozenDesign } from "@/hooks/configurator/use-frozen-design";
import type { useQuotationViewEdit } from "@/hooks/configurator/use-quotation-view-edit";
import OverrideCustomizationDialog from "@/components/pages/quotation/override-customization-dialog";
import ResetToDefaultDialog from "./reset-to-default-dialog";
import FrozenDesignDialog from "./frozen-design-dialog";
import KeepStreamWaitingDialog from "./keep-stream-waiting-dialog";
import KeepCustomizationFailedDialog from "./keep-customization-failed-dialog";
import LeaveConfiguratorDialog from "./leave-configurator-dialog";

type Props = {
  viewOnly: boolean;
  resetOpen: boolean;
  onResetCancel: () => void;
  onResetConfirm: () => void;
  frozen: ReturnType<typeof useFrozenDesign>;
  onGoToProjects: () => void;
  leaveOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  viewEdit: ReturnType<typeof useQuotationViewEdit>;
};

/** Modal layer of the configurator shell (order preserved for stacking). */
const ConfiguratorDialogs = ({
  viewOnly,
  resetOpen,
  onResetCancel,
  onResetConfirm,
  frozen,
  onGoToProjects,
  leaveOpen,
  onStay,
  onLeave,
  viewEdit,
}: Props) => (
  <>
    <ResetToDefaultDialog
      open={resetOpen}
      onCancel={onResetCancel}
      onConfirm={onResetConfirm}
    />

    <FrozenDesignDialog
      open={frozen.open && !viewOnly && !frozen.keepFailedOpen}
      pending={frozen.pending}
      showContinueRendering={frozen.fromRenders}
      onContinueRendering={frozen.handleContinueRendering}
      onKeep={() => {
        void frozen.handleKeep();
      }}
      onStartNew={() => {
        void frozen.handleStartNew();
      }}
      onGoToProjects={onGoToProjects}
    />

    <KeepStreamWaitingDialog open={frozen.keepStreamWaitingOpen && !viewOnly} />

    <KeepCustomizationFailedDialog
      open={frozen.keepFailedOpen && !viewOnly}
      pending={frozen.pending === "new"}
      onStartNew={() => {
        void frozen.handleStartNew();
      }}
    />

    <LeaveConfiguratorDialog open={leaveOpen} onStay={onStay} onLeave={onLeave} />

    <OverrideCustomizationDialog
      open={viewEdit.overrideOpen}
      pending={viewEdit.overridePending}
      onCancel={viewEdit.cancelOverride}
      onContinue={viewEdit.continueOverride}
    />
    {viewEdit.error ? (
      <div className="absolute bottom-24 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-lg bg-red-950/90 px-4 py-2 text-center text-xs text-[#ff8585]">
        {viewEdit.error}
      </div>
    ) : null}
  </>
);

export default ConfiguratorDialogs;
