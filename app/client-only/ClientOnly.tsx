"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Same <Product /> component, but never server-rendered, so no query text is
// serialized from the server to the browser.
const Product = dynamic(() => import("../Product").then((m) => m.Product), { ssr: false });

export function ClientOnly() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Product />
    </Suspense>
  );
}
