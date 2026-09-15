/** Backend catalog / designs APIs expect a numeric project id, never the stream app id. */
export function isBackendProjectId(id: string | null | undefined): boolean {
  return Boolean(id && /^\d+$/.test(id.trim()));
}

export function isStreamProjectId(
  id: string | null | undefined,
  streamId?: string | null,
): boolean {
  if (!id) return false;
  const value = id.trim();
  return (
    Boolean(streamId && value === streamId) || /^[a-f0-9]{24}$/i.test(value)
  );
}

export function backendProjectIdFromUrl(
  urlProjectId: string | null | undefined,
  streamId: string,
): string | null {
  const value = urlProjectId?.trim() || null;
  if (!value || isStreamProjectId(value, streamId)) return null;
  return isBackendProjectId(value) ? value : null;
}
