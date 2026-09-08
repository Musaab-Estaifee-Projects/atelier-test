/**
 * Configurator API façade.
 */
import { computeAuthoritativePrice } from "@/lib/configurator/pricing";
import { mapLayoutCatalogToSession } from "@/lib/configurator/map-layout-catalog";
import {
  mockGenerateDesignCode,
  mockGetDesign,
  mockSaveDesign,
} from "@/mocks/configurator/designs-store";
import { getLayoutCatalog } from "@/services/get-layout-catalog.service";
import { DEMO_BACKEND_PROJECT_ID } from "@/lib/projects/catalog";
import type {
  ConfiguratorSession,
  DesignConfiguration,
  DesignContact,
  StoredDesign,
  SubmitDesignResult,
} from "@/types/configurator";

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
  const backendProjectId =
    args.backendProjectId?.trim() || DEMO_BACKEND_PROJECT_ID;
  const layoutCode = args.layoutCode?.trim() || "1bhk_type_3";
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

export async function getDesign(designCode: string): Promise<StoredDesign> {
  const code = designCode.trim().toUpperCase();
  const found = mockGetDesign(code);
  if (!found) throw new ApiError("Design not found", 404);
  return found;
}

export async function submitDesign(args: {
  streamProjectId: string;
  unitId: string;
  configuration: DesignConfiguration;
  contact: DesignContact;
  session: ConfiguratorSession;
  origin?: string;
}): Promise<SubmitDesignResult> {
  const { contact, configuration, session, streamProjectId, unitId } = args;
  if (
    !contact.name?.trim() ||
    !contact.email?.trim() ||
    !contact.phone?.trim()
  ) {
    throw new ApiError("Name, email, and phone are required", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    throw new ApiError("Invalid email", 400);
  }
  if (!configuration.selections?.length) {
    throw new ApiError("Add at least one selection before submitting", 400);
  }

  const meshIds = new Set(session.meshes.map((m) => m.id));
  const matIds = new Set(session.materials.map((m) => m.id));
  for (const s of configuration.selections) {
    if (!meshIds.has(s.meshId)) {
      throw new ApiError(`Unknown mesh: ${s.meshId}`, 400);
    }
    if (s.materialId && !matIds.has(s.materialId)) {
      throw new ApiError(`Unknown material: ${s.materialId}`, 400);
    }
    const allowed = session.materialsByMesh[s.meshId] ?? [];
    if (
      s.materialId &&
      allowed.length &&
      !allowed.includes(s.materialId)
    ) {
      throw new ApiError(
        `Material ${s.materialId} not allowed on ${s.meshId}`,
        400,
      );
    }
  }

  const price = computeAuthoritativePrice(session, configuration.selections);
  const designCode = mockGenerateDesignCode();
  const createdAt = new Date().toISOString();

  const stored: StoredDesign = {
    designCode,
    streamProjectId,
    unitId,
    configuration: {
      ...configuration,
      version: 1,
      meta: { ...configuration.meta, source: "submit" },
    },
    contact: {
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
    },
    price,
    currency: "AED",
    createdAt,
  };
  mockSaveDesign(stored);

  const origin =
    args.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const qs = new URLSearchParams({
    project_id: session.backendProjectId,
    layout_code: configuration.levelName,
    design_code: designCode,
    view: "1",
  });
  if (unitId) qs.set("unit", unitId);
  const shareUrl = `${origin}/configurator/${streamProjectId}?${qs.toString()}`;

  return { designCode, shareUrl, price, currency: "AED" };
}
