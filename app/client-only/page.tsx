import { ClientOnly } from "./ClientOnly";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main>
      <h1>Control: client-only (no SSR)</h1>
      <ClientOnly />
    </main>
  );
}
