// src/lib/configurator/api.ts
/**
 * Configurator API façade.
 * // MOCK: replace function bodies with real fetch() — keep signatures stable.
 */
import { computeAuthoritativePrice } from "@/lib/configurator/pricing";
import {
  mockGenerateDesignCode,
  mockGetDesign,
  mockSaveDesign,
} from "@/mocks/configurator/designs-store";
import { buildMockSession } from "@/mocks/configurator/session";
import type {
  ConfiguratorSession,
  DesignConfiguration,
  DesignContact,
  StoredDesign,
  SubmitDesignResult,
} from "@/types/configurator";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** // MOCK: GET /api/configurator/session?unit=&streamProjectId=&level= */
export async function getConfiguratorSession(args: {
  unitId: string;
  streamProjectId: string;
  levelName?: string;
}): Promise<ConfiguratorSession> {
  await delay(120);
  if (!args.unitId?.trim()) {
    throw new ApiError("unit is required", 400);
  }
  return buildMockSession({
    unitId: args.unitId.trim(),
    streamProjectId: args.streamProjectId,
    levelName: args.levelName,
  });
}

/** // MOCK: GET /api/configurator/designs/:designCode */
export async function getDesign(designCode: string): Promise<StoredDesign> {
  await delay(100);
  const code = designCode.trim().toUpperCase();
  const found = mockGetDesign(code);
  if (!found) throw new ApiError("Design not found", 404);
  return found;
}

/** // MOCK: POST /api/configurator/designs */
export async function submitDesign(args: {
  streamProjectId: string;
  unitId: string;
  configuration: DesignConfiguration;
  contact: DesignContact;
  /** Catalog used to validate + price (from session). */
  session: ConfiguratorSession;
  origin?: string;
}): Promise<SubmitDesignResult> {
  await delay(250);

  const { contact, configuration, session, streamProjectId, unitId } = args;
  if (!contact.name?.trim() || !contact.email?.trim() || !contact.phone?.trim()) {
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
    if (!matIds.has(s.materialId)) {
      throw new ApiError(`Unknown material: ${s.materialId}`, 400);
    }
    const allowed = session.materialsByMesh[s.meshId] ?? [];
    if (allowed.length && !allowed.includes(s.materialId)) {
      throw new ApiError(
        `Material ${s.materialId} not allowed on ${s.meshId}`,
        400,
      );
    }
  }

  // Authoritative mock price — do not use client total
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
  const shareUrl = `${origin}/configurator/${streamProjectId}?unit=${encodeURIComponent(unitId)}&level=${encodeURIComponent(configuration.levelName)}&designCode=${designCode}`;

  return { designCode, shareUrl, price, currency: "AED" };
}
