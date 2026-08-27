import {
  StreamPixelApplication,
  type StreamPixelApplicationResult,
  type StreamPixelConfig,
} from "streampixelsdk";

export type StreamPixelInitConfig = Pick<
  StreamPixelConfig,
  | "appId"
  | "AutoConnect"
  | "streamerId"
  | "sfuHost"
  | "sfuPlayer"
  | "forceTurn"
  | "afktimeout"
>;

/** SDK can return null, {}, or a codec array — not only the success shape. */
export type StreamPixelInitResult =
  | StreamPixelApplicationResult
  | Record<string, never>
  | null
  | string[];

type CacheEntry = {
  key: string;
  promise: Promise<StreamPixelInitResult>;
  result: StreamPixelInitResult | undefined;
  disposed: boolean;
};

let cache: CacheEntry | null = null;

export function streamPixelInitKey(config: StreamPixelInitConfig): string {
  return [
    config.appId,
    config.streamerId ?? "",
    String(config.sfuHost ?? "false"),
    String(config.sfuPlayer ?? "false"),
    String(config.afktimeout ?? ""),
  ].join("|");
}

export function isStreamPixelSuccess(
  result: StreamPixelInitResult,
): result is StreamPixelApplicationResult {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  const r = result as Partial<StreamPixelApplicationResult>;
  return Boolean(r.appStream && r.pixelStreaming);
}

/**
 * StreamPixel SDK initializes once per page (`_sdkInitialized` never resets).
 * Cache the first call so React Strict Mode remounts reuse the same promise/result.
 */
export function ensureStreamPixelApplication(
  config: StreamPixelInitConfig,
): Promise<StreamPixelInitResult> {
  const key = streamPixelInitKey(config);

  if (cache) {
    if (cache.key === key && !cache.disposed) {
      return cache.promise;
    }

    if (cache.key !== key) {
      console.error(
        "[StreamPixel] Already initialized with a different config; full page reload required.",
        { previousKey: cache.key, nextKey: key },
      );
      return Promise.resolve({});
    }

    // Same key but disposed — SDK cannot re-init; reload required
    console.error(
      "[StreamPixel] Session was disposed; full page reload required to reconnect.",
    );
    return Promise.resolve({});
  }

  const promise = StreamPixelApplication(config as StreamPixelConfig).then(
    (result) => {
      if (cache && cache.promise === promise) {
        cache.result = result as StreamPixelInitResult;
      }
      return result as StreamPixelInitResult;
    },
  );

  cache = {
    key,
    promise,
    result: undefined,
    disposed: false,
  };

  return promise;
}

export function getCachedStreamPixelResult(): StreamPixelInitResult | undefined {
  return cache?.result;
}

export function markStreamPixelDisposed(): void {
  if (cache) {
    cache.disposed = true;
  }
}

export function peekStreamPixelCacheKey(): string | null {
  return cache?.key ?? null;
}
