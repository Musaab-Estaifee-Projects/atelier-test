"use client";

import Link from "next/link";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import { CATALOG_STYLES, type CatalogStyle } from "@/lib/styles/catalog";
import {
  CATALOG_PROJECTS,
  configuratorHref,
  DEMO_LEVEL_NAME,
  DEMO_STREAM_PROJECT_ID,
  DEMO_UNIT_ID,
  getProject,
} from "@/lib/projects/catalog";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import DiamondRuleFull from "@/components/icons/configurator/diamond-rule-full";
import Bg from "@/components/shared/bg";

export function demoCustomizeHref(style?: string) {
  const q = new URLSearchParams({
    unit: DEMO_UNIT_ID,
    level: DEMO_LEVEL_NAME,
  });
  if (style) q.set("style", style);
  return `/configurator/${DEMO_STREAM_PROJECT_ID}?${q.toString()}`;
}

type Props = {
  overlay?: boolean;
  onStartCustomizing?: () => void;
  onSelectStyle?: (slug: string) => void;
  projectSlug?: string | null;
  unitId?: string | null;
  levelName?: string | null;
};

function StyleCard({
  style,
  href,
  onSelect,
}: {
  style: CatalogStyle;
  href?: string;
  onSelect?: () => void;
}) {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/styles/card-frame.svg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="relative z-10 flex h-full flex-col gap-[13px] p-[25px]">
        <h2 className="text-center font-libre-baskerville text-[clamp(20px,2vw,25px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8] uppercase">
          {style.name}
        </h2>
        <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#001b1f]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={style.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <p className="text-[10px] leading-[1.2] text-white/70">
          {style.description}
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {style.swatches.map((color) => (
            <span
              key={color}
              className="size-7 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </>
  );

  const className =
    "relative flex aspect-[404/575] w-full flex-col text-left transition-transform hover:scale-[1.01]";

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href ?? demoCustomizeHref(style.slug)} className={className}>
      {inner}
    </Link>
  );
}

export default function SelectStyle({
  overlay = false,
  onStartCustomizing,
  onSelectStyle,
  projectSlug,
  unitId,
  levelName,
}: Props) {
  const project =
    (projectSlug ? getProject(projectSlug) : undefined) ??
    CATALOG_PROJECTS[1] ??
    CATALOG_PROJECTS[0];
  const customizeHref = configuratorHref({
    streamProjectId: project.streamProjectId,
    unitId: unitId || project.unitId,
    levelName: levelName || project.levelName,
  });
  const Wrapper = overlay ? "div" : "main";

  return (
    <Wrapper
      className={`relative bg-[#00272d] text-white ${
        overlay
          ? "absolute inset-0 z-50 overflow-y-auto"
          : "min-h-dvh overflow-x-hidden"
      }`}
      style={{
        ...pageNoiseStyle(0.16),
      }}
    >
      {/* <div className="pointer-events-none absolute inset-0 opacity-30"> */}
      {}
      {/* <img
          src="/images/styles/bg.png"
          alt=""
          className="h-full w-full object-cover"
        /> */}
      {/* </div> */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1251px] flex-col items-center px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
        {overlay ? <AtelierMark /> : <AtelierMark href="/" />}

        <h1 className="mt-10 max-w-[18em] text-center font-libre-baskerville text-[clamp(24px,3.2vw,34px)] leading-[1.16] font-normal tracking-[0.05em] text-white sm:mt-12">
          How Would You Like To Start Your Unit?
        </h1>

        <DiamondRuleFull className="mt-5 h-4 w-[176px]" />

        <p className="mt-4 max-w-[320px] text-center text-[12px] leading-[1.2] text-white/70 sm:text-[14px]">
          Choose a style that reflect you vision and lifestyle
        </p>

        <ul className="mt-10 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:mt-12">
          {CATALOG_STYLES.map((style) => (
            <li key={style.slug}>
              <StyleCard
                style={style}
                href={
                  onSelectStyle
                    ? undefined
                    : configuratorHref(
                        {
                          streamProjectId: project.streamProjectId,
                          unitId: unitId || project.unitId,
                          levelName: levelName || project.levelName,
                        },
                        { style: style.slug },
                      )
                }
                onSelect={
                  onSelectStyle ? () => onSelectStyle(style.slug) : undefined
                }
              />
            </li>
          ))}

          <li>
            <div className="relative flex aspect-[404/575] w-full flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/styles/cta-frame.svg"
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
              {}

              <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
                <div className="flex flex-col gap-2">
                  <h2 className="font-libre-baskerville text-[clamp(22px,2.2vw,27.4px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8]">
                    Create Your Own Design
                  </h2>
                  <p className="text-[10px] leading-[1.2] text-[#f2e9d8]">
                    Build a personalized interior language around your
                    preferences, lifestyle and vision. Select specific timber,
                    marble, and layout options in real-time.
                  </p>
                </div>
                {onStartCustomizing ? (
                  <Button
                    type="button"
                    variant="pill"
                    size="pill"
                    onClick={onStartCustomizing}
                  >
                    Start customizing
                  </Button>
                ) : (
                  <Button variant="pill" size="pill" asChild>
                    <Link href={customizeHref}>Start customizing</Link>
                  </Button>
                )}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Wrapper>
  );
}
