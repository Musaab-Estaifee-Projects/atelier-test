"use client";

import { useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { pageLoaderDoneAtom } from "@/atoms/page-loader-atom";
import PageLoader from "./page-loader";

const PageLoaderWrapper = ({ children }: { children: React.ReactNode }) => {
  const setTransitionDone = useSetAtom(pageLoaderDoneAtom);

  const [showLoader, setShowLoader] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      setShowLoader(true);
    }
  }, []);

  return (
    <>
      {children}

      <PageLoader
        active={showLoader}
        onComplete={() => {
          setShowLoader(false);
          setTimeout(() => {
            setTransitionDone(true);
          }, 0);
        }}
      />
    </>
  );
};

export default PageLoaderWrapper;
