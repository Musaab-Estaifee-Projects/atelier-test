"use client";

import Link from "next/link";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
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
import { CustomShape } from "@/components/shared/custom-shape";
import { ChevronRight } from "lucide-react";
import DiamondRule from "@/components/icons/configurator/diamond-rule";
import SelectedColorPalette from "@/components/icons/selected-color-palette";
import SecondColorPalette from "@/components/icons/second-color-palette";
import ThirdColorPalette from "@/components/icons/third-color-palette";
import CircleWithShadows from "@/components/icons/circle-with-shadows";

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

const SelectStyle = ({
  overlay = false,
  onStartCustomizing,
  onSelectStyle,
  projectSlug,
  unitId,
  levelName,
}: Props) => {
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
          : "min-h-dvh! h-auto 2xl:h-dvh! overflow-x-hidden overflow-y-auto"
      }`}
      style={{
        ...pageNoiseStyle(0.13),
      }}
    >
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      {/* max-w-[1280px] */}
      <div className="relative z-10 mx-auto flex h-full w-full flex-col items-center px-4 pt-8 pb-10 sm:px-8 sm:pt-10">
        {overlay ? <AtelierMark /> : <AtelierMark href="/" />}

        <h1 className="mt-10 max-w-[18em] text-center font-baskerville text-[clamp(24px,3.2vw,34px)] leading-[1.16] font-normal tracking-[0.05em] text-white sm:mt-12">
          Begin Your Journey
        </h1>

        <DiamondRuleFull className="mt-3 h-4 w-44" />

        <p className="mt-3 max-w-[320px] text-center text-[0.875rem] leading-[1.2] text-white opacity-70">
          Choose a style that reflects your vision and lifestyle
        </p>

        {/* Cards */}
        <div className="mt-10 flex w-full flex-1 flex-col items-stretch gap-5 md:flex-row md:items-stretch">
          <CustomShape
            className="relative w-full overflow-hidden md:w-[70%]"
            radius={{
              base: 18,
              sm: 20,
              md: 24,
            }}
            fill="#00272D"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1.33}
          >
            <div className="flex h-full min-h-120 w-full md:min-h-150">
              <div className="relative flex flex-col p-7 lg:p-9 gap-8 w-[50%] lg:w-[38%] shrink-0">
                <div className="flex flex-col gap-3.25 relative min-h-0 flex-1">
                  <div className="relative min-h-0 flex-1 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/projects/reef-996.png"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    {/* <Image
                      src="/images/projects/reef-996.png"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 45vw"
                      priority={false}
                    /> */}
                  </div>

                  <div className="flex items-start gap-1">
                    <span className="size-1.25 rounded-full bg-[#F2E9D8]" />
                    <span className="size-1.25 rounded-full bg-white/10" />
                    <span className="size-1.25 rounded-full bg-white/10" />
                    <span className="size-1.25 rounded-full bg-white/10" />
                    <span className="size-1.25 rounded-full bg-white/10" />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3.75">
                    <div className="flex flex-col items-start gap-1">
                      <h2 className="font-baskerville text-[clamp(16px,1.6vw,20px)] font-normal tracking-[0.04em] text-[#f2e9d8]">
                        Explore Ready Styles
                      </h2>

                      <DiamondRule className="w-21.25 h-auto" />
                    </div>

                    <p className="text-[12px] leading-[1.35] text-white/70 sm:text-[13px]">
                      Choose a style that reflect you vision and lifestyle
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="mt-1 h-auto w-fit rounded-full border-white/20 bg-transparent px-4 py-2 text-[11px] font-medium tracking-[0.06em] text-[#f2e9d8] hover:bg-white/10 hover:text-white"
                >
                  <Link href="/styles/browse-styles">
                    BROWSE ALL <ChevronRight />
                  </Link>
                </Button>
              </div>

              {/* Right column: room image fills full height of the shape */}
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/projects/reef-996.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover p-px"
                />
              </div>
            </div>
          </CustomShape>

          <CustomShape
            className="relative w-full overflow-hidden md:w-[30%]"
            radius={{
              base: 18,
              sm: 20,
              md: 24,
            }}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
          >
            <div className="flex h-full min-h-120 w-full md:min-h-150">
              <div className="relative flex flex-col p-7 lg:p-9 gap-8 w-full shrink-0">
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/projects/reef-996.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div
                    className="absolute left-4 bottom-6 flex items-center gap-2 bg-[rgba(58,51,44,0.23)] rounded-full p-[0.27644rem] backdrop-blur-sm"
                    style={{
                      border: `0.369px solid rgba(255, 255, 255, 0.25)`,
                    }}
                  >
                    <SelectedColorPalette />
                    <SecondColorPalette />
                    <ThirdColorPalette />
                    {/* <span className="size-6 shrink-0 rounded-full border border-white/30 bg-[#8fbc8f] shadow-sm" /> */}
                  </div>

                  <CircleWithShadows className="absolute top-0 left-4 bottom-0 my-auto" />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3.75">
                    <div className="flex flex-col items-start gap-1">
                      <h2 className="font-baskerville text-[clamp(16px,1.6vw,20px)] font-normal tracking-[0.04em] text-[#f2e9d8]">
                        Create Your Own Design
                      </h2>

                      <DiamondRule className="w-21.25 h-auto" />
                    </div>

                    <p className="text-[12px] leading-[1.35] text-white sm:text-[13px] opacity-70">
                      Choose a style that reflects your vision and lifestyle
                    </p>
                  </div>
                </div>
                {onStartCustomizing ? (
                  <Button
                    type="button"
                    variant="pill"
                    size="pill"
                    onClick={onStartCustomizing}
                    // className="mt-1 h-auto w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-[0.06em] text-[#f2e9d8] hover:bg-white/20 hover:text-white"
                  >
                    START CUSTOMIZING <ChevronRight />
                  </Button>
                ) : (
                  <Button variant="pill" size="pill" asChild>
                    <Link href={customizeHref}>Start customizing</Link>
                  </Button>
                )}
              </div>
            </div>
          </CustomShape>
        </div>
      </div>
    </Wrapper>
  );
};

export default SelectStyle;
