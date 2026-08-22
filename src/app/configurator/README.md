# Atelier Configurator (mock backend)

Client-only 3D apartment configurator. Selections persist in **localStorage** until **Submit** creates a Design Code. No draft autosave API.

## Edit mode

Open (replace host as needed):

```
/configurator/6a427d215af97179992c7c66?unit=LO-APT-2BHK-T02&level=2BHK_Type_2_Updated&camera=4&zone=Kitchen
```

- `unit` is required for edit.
- Pick mesh/material → FE map + `localStorage` key `atelier:config:{projectId}:{unitId}` (**not** in the URL).
- `camera` / `zone` stay in the URL only (not localStorage).
- On reload / reconnect / stream error: `LoadCustomization` (UE snapshot) then `MoveToZone` per room (`LivingArea`, `Kitchen`, `bedroom-1`, `bedroom-2`) + `SetMeshByName` / `ApplyMaterialToMesh` for every localStorage selection, then restore the URL camera.
- **Submit design** → mock POST → Design Code → URL gains `designCode` (view-only).

## View-only mode

```
/configurator/6a427d215af97179992c7c66?unit=LO-APT-2BHK-T02&level=2BHK_Type_2_Updated&designCode=AT-XXXXXX
```

- Loads design from mock registry (memory + `atelier:designs:registry`).
- Editors/submit hidden. **Start my own design** drops `designCode`.

## Mock UE (no StreamPixel)

```
NEXT_PUBLIC_MOCK_UE=true
```

UE commands are logged to the console; UI/localStorage/submit still work.

## Swap to real APIs

Replace bodies in [`src/lib/configurator/api.ts`](src/lib/configurator/api.ts) only:

- `getConfiguratorSession`
- `submitDesign`
- `getDesign`

Keep types in [`src/types/configurator.ts`](src/types/configurator.ts).

## Final Design stills

Dock **Final design** → confirm → **CaptureCamerasHighRes** (off-screen, no live camera tour).
UE events `started` → `capturing` × 14 → `completed` fill four room cards by **camera name**.
Filenames (`Cam_0.png`) are resolved via `image`/`url`/`base64` or `UploadScreenshots`.
**Retry** re-captures that room with `CaptureCameraHighRes`.

1. Mid-edit: FE + localStorage only — no draft API.
2. Design Code only on Submit.
3. URL with `designCode` = VIEW_ONLY.
4. Share after submit; mid-edit is not cross-device.
5. StreamPixel is live preview; durability is localStorage until submit.
