import { getSingleProject } from "@/services/get-single-project.service";

/** StreamPixel app id from the single-project API — never a hardcoded demo id. */
export async function streamAppIdForProjectCode(
  code?: string | null,
): Promise<string | null> {
  const value = code?.trim();
  if (!value) return null;
  try {
    const project = await getSingleProject(value);
    return project.streampixel_app_id?.trim() || null;
  } catch {
    return null;
  }
}
