"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { gtmPush } from "@/lib/gtm";

function PageViewTracker() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const isFirst      = useRef(true); // skip initial load — GTM fires its own page view on init

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    const qs = searchParams.toString();
    gtmPush({
      event:      "page_view",
      page_path:  pathname + (qs ? `?${qs}` : ""),
      page_title: typeof document !== "undefined" ? document.title : "",
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GTMProvider() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
