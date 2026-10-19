# Repro: false-positive "fragment with name X already exists" warning with Apollo streaming SSR

A single, uniquely named fragment, used by a single query in a single client
component, triggers graphql-tag's duplicate-fragment warning in the browser when
the page is server-rendered through `@apollo/client-integration-nextjs`.

Related issue: https://github.com/apollographql/apollo-client-integrations/issues/328
("Using fragments in combination with `PreloadQuery` leads to `unique-names` warnings").
This repro shows the same warning with plain `useSuspenseQuery`, so it is not specific to `PreloadQuery`.

## Versions (see `package-lock.json` for the full tree)
- `@apollo/client-integration-nextjs` 0.14.4
- `@apollo/client-react-streaming` 0.14.4
- `@apollo/client` ^4.1.6 (lockfile resolves 4.3.4; `graphql-tag` 2.12.7)
- `next` 15.5.28, `react` / `react-dom` 19.x, `graphql` 16.x
- Node 22

## Steps
```bash
npm install
npm run build && npm start      # http://localhost:3000  (dev mode: npm run dev)
```
The GraphQL server is a route handler in this project (`app/api/graphql/route.ts`),
so no external services are needed. The Apollo link points at
`http://localhost:3000`, so run on port 3000.

1. Open `http://localhost:3000/` with the browser console open.
2. Observe:

```
Warning: fragment with name ProductFields already exists.
graphql-tag enforces all fragment names across your application to be unique; ...
```

## Expected
No warning. `ProductFields` is defined exactly once in the project
(`app/Product.tsx`).

## Control
`http://localhost:3000/client-only` renders the same `<Product />` component with
`next/dynamic` and `ssr: false`. No query text is serialized from the server
(the page HTML contains no `ProductFields`), and no warning is expected.

| Route | Server-rendered | Warning in browser |
|---|---|---|
| `/` | yes | yes |
| `/client-only` | no | no |

## Cause
In `@apollo/client-react-streaming` 0.14.4:

1. Server (`dist/index.ssr.js`): the query is serialized with `printMinified`,
   i.e. `stripIgnoredCharacters(print(query))`. The SSR HTML contains
   `fragment ProductFields on Product{id name price}...`.
2. Browser (`dist/index.browser.js`): `deserializeOptions` runs
   `gql(print(gql(options.query)))`. The inner `gql` registers the fragment from
   the minified text, `print` produces multi-line text, and the outer `gql` sees
   the same fragment name with a different source string, so graphql-tag warns.

The mechanism can be reproduced without a browser:

```js
import { gql } from "graphql-tag";
import { print, stripIgnoredCharacters } from "graphql";

const orig = gql`
  fragment ProductFields on Product { id name price }
  query GetProduct { product { ...ProductFields } }
`;
const minified = stripIgnoredCharacters(print(orig));
gql(print(gql(minified))); // logs: Warning: fragment with name ProductFields already exists.
```

Nothing actually collides; graphql-tag compares source text and the text only
differs in whitespace.

## Notes
- Impact: with many fragments this produces a lot of console noise.
  `disableFragmentWarnings()` hides it but also hides real collisions.
- Only `useSuspenseQuery` is exercised here.

## Suggested fix
In `deserializeOptions`, replace the inner `gql(...)` with `parse(...)` from `graphql`:

```diff
-import { stripIgnoredCharacters } from "graphql";
+import { parse, stripIgnoredCharacters } from "graphql";
 ...
-    query: gql(print(gql(options.query)))
+    query: gql(print(parse(options.query)))
```

Why this works: the inner `gql(minified)` is what registers the fragment from the
minified text, and graphql-tag warns because that text differs from the original
only in whitespace. `parse` builds the same AST without touching graphql-tag's
fragment registry. The outer `gql(print(...))` is unchanged, so it still returns
the same document object as the client-side `gql` call (the referential identity
the original comment is after). `graphql` is already a peer dependency and
`stripIgnoredCharacters` is already imported from it.

Checked in Node with graphql-tag 2.12.7 (see `fix/check-fix.mjs`):

| | warnings | same document object as original |
|---|---|---|
| current: `gql(print(gql(minified)))` | 1 | yes |
| fix: `gql(print(parse(minified)))` | 0 | yes |

To try it in this repro, apply `fix/deserialize-options.patch` to the installed
package (it edits the four `dist/*.js` files that contain `deserializeOptions`):

```bash
cd node_modules/@apollo/client-react-streaming && patch -p1 < ../../../fix/deserialize-options.patch
```
Then rebuild and reload `/`. Not yet confirmed in a browser: the console should
stay empty. Not covered: the `.cjs` builds, which need the equivalent one-line
change in the source.
