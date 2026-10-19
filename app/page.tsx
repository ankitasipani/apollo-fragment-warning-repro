export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Product } from "./Product";

export default function Page() {
  return (
    <main>
      <h1>Fragment warning repro</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Product />
      </Suspense>
    </main>
  );
}
