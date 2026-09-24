/**
 * Configurator API façade.
 */
import { mapLayoutCatalogToSession } from "@/lib/configurator/map-layout-catalog";
import { getLayoutCatalog } from "@/services/get-layout-catalog.service";
import { isBackendProjectId } from "@/lib/projects/project-id";
import type { ConfiguratorSession } from "@/types/configurator";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getConfiguratorSession(args: {
  streamProjectId: string;
  backendProjectId?: string | null;
  layoutCode?: string | null;
  unitId?: string | null;
}): Promise<ConfiguratorSession> {
  const backendProjectId = args.backendProjectId?.trim() || "";
  if (!isBackendProjectId(backendProjectId)) {
    throw new ApiError(
      "A valid project id is required to load the layout catalog.",
      400,
    );
  }
  const layoutCode = args.layoutCode?.trim();
  if (!layoutCode) {
    throw new ApiError("A layout is required to load the apartment catalog.", 400);
  }
  try {
    const catalog = await getLayoutCatalog(layoutCode, backendProjectId);
    return mapLayoutCatalogToSession({
      catalog,
      streamProjectId: args.streamProjectId,
      backendProjectId,
      unitId: args.unitId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load layout catalog";
    throw new ApiError(message, 502);
  }
}
