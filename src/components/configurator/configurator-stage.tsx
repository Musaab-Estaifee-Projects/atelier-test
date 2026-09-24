"use client";

import { useMemo } from "react";
import type { useCatalogNavigation } from "@/hooks/configurator/use-catalog-navigation";
import { useConfiguratorTour } from "@/hooks/configurator/use-configurator-tour";
import type { useSelectionActions } from "@/hooks/configurator/use-selection-actions";
import type { useSelectionMap } from "@/hooks/configurator/use-selection-map";
import { cameraKey, camerasForZone } from "@/lib/configurator/zone-catalog";
import type { ResolutionOption } from "@/lib/stream-pixel/types";
import type { ConfiguratorSession } from "@/types/configurator";
import ConfiguratorTour from "./configurator-tour";
import ZoneTopBar from "./zone-top-bar";
import ZoneSidePanel from "./zone-side-panel";
import ConfiguratorDock from "./configurator-dock";
import SelectionsSheet from "./selections-sheet";

type Props = {
  session: ConfiguratorSession;
  nav: ReturnType<typeof useCatalogNavigation>;
  actions: ReturnType<typeof useSelectionActions>;
  selections: ReturnType<typeof useSelectionMap>;
  viewOnly: boolean;
  inert: boolean;
  selectionsOpen: boolean;
  onToggleSelections: () => void;
  onCloseSelections: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  currentResolution: string;
  onChangeResolution: (option: ResolutionOption) => void;
  resolutionEnabled: boolean;
  onFullscreen: () => void;
  onReset: () => void;
  onQuote: () => void;
  onLoadLevel: (levelName: string) => void;
  onViewEdit: () => void;
  onViewCancel: () => void;
  viewEditPending: boolean;
};

/** Live-scene chrome shown once the 3D scene is ready. */
const ConfiguratorStage = ({
  session,
  nav,
  actions,
  selections,
  viewOnly,
  inert,
  selectionsOpen,
  onToggleSelections,
  onCloseSelections,
  settingsOpen,
  onToggleSettings,
  currentResolution,
  onChangeResolution,
  resolutionEnabled,
  onFullscreen,
  onReset,
  onQuote,
  onLoadLevel,
  onViewEdit,
  onViewCancel,
  viewEditPending,
}: Props) => {
  const tour = useConfiguratorTour({
    enabled: !viewOnly && !inert,
  });

  const panelCameras = useMemo(() => {
    if (nav.zoneCameras.length > 0) return nav.zoneCameras;
    const zoneId = nav.activeZoneId ?? session.zones[0]?.id;
    if (!zoneId) return [];
    return camerasForZone(zoneId, {
      cameras: session.cameras,
      meshes: session.meshes,
    });
  }, [
    nav.activeZoneId,
    nav.zoneCameras,
    session.cameras,
    session.meshes,
    session.zones,
  ]);

  const showMaterialsPanel =
    !viewOnly &&
    (tour.forceMaterialsPanel ||
      (nav.sidePanelOpen &&
        Boolean(nav.activeZoneId) &&
        !nav.freeCameraActive));

  const chromeInert = inert || tour.active;
  const tourActiveCameraKey =
    nav.activeCameraKey ??
    (panelCameras[0] ? cameraKey(panelCameras[0]) : null);

  return (
    <>
      <div
        inert={chromeInert ? true : undefined}
        className={tour.active ? "pointer-events-none" : undefined}
      >
        <ZoneTopBar
          zones={session.zones}
          activeZoneId={nav.activeZoneId}
          freeCameraActive={nav.freeCameraActive}
          onSelectZone={nav.handleSelectZone}
          onFreeCamera={nav.handleFreeCamera}
          cameras={nav.zoneCameras}
          activeCameraKey={nav.activeCameraKey}
          onSelectCamera={nav.handleSelectCamera}
          disabled={tour.active}
          tourHighlight={tour.active && tour.step?.id === "zones"}
        />

        {showMaterialsPanel ? (
          <ZoneSidePanel
            cameras={panelCameras}
            activeCameraKey={tourActiveCameraKey}
            onSelectCamera={nav.handleSelectCamera}
            meshes={nav.panelMeshes}
            selectionMap={actions.appliedPanelMap}
            onSelectMesh={actions.handleSelectMesh}
            getMaterials={actions.getMaterials}
            onSelectMaterial={actions.handleSelectMaterial}
            onRemoveSelection={actions.handleRemoveSelection}
            defaults={session.defaults}
            viewOnly={viewOnly}
            interactionLocked={tour.forceMaterialsPanel}
            tourHighlight={tour.active && tour.step?.id === "materials"}
            onClose={() => nav.setSidePanelOpen(false)}
          />
        ) : null}

        <ConfiguratorDock
          saveStatus={
            viewOnly
              ? "saved"
              : selections.saveStatus === "idle"
                ? "saved"
                : selections.saveStatus
          }
          selectionsOpen={selectionsOpen}
          onToggleSelections={onToggleSelections}
          onReset={onReset}
          onFullscreen={onFullscreen}
          onReplayTour={viewOnly || tour.active ? undefined : tour.replay}
          settingsOpen={settingsOpen}
          onToggleSettings={onToggleSettings}
          currentResolution={currentResolution}
          onChangeResolution={onChangeResolution}
          resolutionEnabled={resolutionEnabled}
          viewOnly={viewOnly}
          onViewEdit={onViewEdit}
          onViewCancel={onViewCancel}
          viewEditPending={viewEditPending}
          materialsOpen={
            (nav.sidePanelOpen && !nav.freeCameraActive) ||
            tour.forceMaterialsPanel
          }
          onShowMaterials={nav.handleShowMaterials}
          onQuote={onQuote}
          selectedItems={actions.dockSelections}
          levels={[]}
          activeLevel={session.layoutCode}
          onLoadLevel={onLoadLevel}
          tourHighlight={tour.active && tour.step?.id === "dock"}
        />

        <SelectionsSheet
          open={selectionsOpen && !tour.active}
          selections={selections.selections}
          session={session}
          slotLabels={session.slotLabels}
          onClose={onCloseSelections}
          onRemove={actions.handleRemoveSelection}
          onEdit={nav.handleEditReviewSlot}
          viewOnly={viewOnly}
        />
      </div>

      {tour.active && tour.step ? (
        <ConfiguratorTour
          step={tour.step}
          stepIndex={tour.stepIndex}
          stepCount={tour.stepCount}
          onNext={tour.next}
          onSkip={tour.skip}
        />
      ) : null}
    </>
  );
};

export default ConfiguratorStage;
