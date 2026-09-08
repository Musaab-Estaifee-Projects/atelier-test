"use client";

import { useMemo, useState } from "react";
import { ScrollText, X } from "lucide-react";
import { useUeLog } from "@/hooks/configurator/use-ue-logger";
import { clearUeLog, type UeLogEntry } from "@/lib/stream-pixel/ue-logger";

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type Pair = {
  send: UeLogEntry;
  responses: UeLogEntry[];
};

function pairLogs(entries: UeLogEntry[]): { pairs: Pair[]; orphans: UeLogEntry[] } {
  const sendIds = new Set(entries.filter((e) => e.kind === "send").map((e) => e.id));
  const pairs: Pair[] = [];
  for (const entry of entries) {
    if (entry.kind !== "send") continue;
    pairs.push({
      send: entry,
      responses: entries.filter(
        (r) => r.kind === "response" && r.inReplyTo === entry.id,
      ),
    });
  }
  const orphans = entries.filter(
    (e) => e.kind === "response" && (e.inReplyTo == null || !sendIds.has(e.inReplyTo)),
  );
  return {
    pairs: pairs.slice().reverse(),
    orphans: orphans.slice().reverse(),
  };
}

export default function UeLogSidebar() {
  const [open, setOpen] = useState(false);
  const entries = useUeLog();
  const { pairs, orphans } = useMemo(() => pairLogs(entries), [entries]);

  return (
    <>
      <button
        type="button"
        className="pointer-events-auto absolute right-3 top-[max(10px,env(safe-area-inset-top))] z-[40] flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-white/15"
        onClick={() => setOpen(true)}
        aria-label="Open Unreal logs"
        title="Unreal logs"
      >
        <ScrollText className="size-4" />
      </button>

      {open ? (
        <aside className="pointer-events-auto absolute inset-y-0 right-0 z-[70] flex w-[min(100%,22rem)] flex-col border-l border-white/15 bg-[#0a1618]/95 text-white shadow-2xl backdrop-blur-xl sm:w-[24rem]">
          <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
            <div>
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.4px] text-white/50">
                Unreal
              </p>
              <h2 className="font-sans text-sm font-medium">Command log</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.3px] text-white/70 hover:bg-white/10"
                onClick={() => clearUeLog()}
              >
                Clear
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close Unreal logs"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {pairs.length === 0 && orphans.length === 0 ? (
              <p className="px-1 text-sm text-white/50">
                Interact with the apartment to see send / response pairs here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {orphans.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2"
                  >
                    <LogBlock entry={entry} />
                  </li>
                ))}
                {pairs.map((pair) => (
                  <li
                    key={pair.send.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2"
                  >
                    <LogBlock entry={pair.send} />
                    {pair.responses.length === 0 ? (
                      <p className="mt-1.5 text-[11px] text-amber-200/80">
                        Waiting for response…
                      </p>
                    ) : (
                      pair.responses.map((res) => (
                        <div key={res.id} className="mt-1.5 border-t border-white/10 pt-1.5">
                          <LogBlock entry={res} />
                        </div>
                      ))
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}

function LogBlock({ entry }: { entry: UeLogEntry }) {
  const tone =
    entry.kind === "send"
      ? "text-sky-200"
      : entry.ok === false
        ? "text-red-300"
        : entry.ok === true
          ? "text-emerald-300"
          : "text-white/80";
  const label = entry.kind === "send" ? "SEND" : "RECV";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`font-mono text-[11px] font-medium ${tone}`}>
          {label} · {entry.name}
        </p>
        <span className="font-mono text-[10px] text-white/40">{timeLabel(entry.at)}</span>
      </div>
      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-[1.45] text-white/70">
        {pretty(entry.payload)}
      </pre>
    </div>
  );
}
