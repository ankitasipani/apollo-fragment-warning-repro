// Run from the project root after `npm install`:  node fix/check-fix.mjs
import { gql } from "graphql-tag";
import { print, parse, stripIgnoredCharacters } from "graphql";

const orig = gql(`
  fragment ProductFields on Product { id name price }
  query GetProduct { product { ...ProductFields } }
`);
const minified = stripIgnoredCharacters(print(orig));

const warns = [];
const w = console.warn;
console.warn = (...a) => warns.push(a[0]);

const cur = gql(print(gql(minified)));
console.log("current:", warns.length, "warning(s); same document as original:", cur === orig);
warns.length = 0;

const fixed = gql(print(parse(minified)));
console.log("fix    :", warns.length, "warning(s); same document as original:", fixed === orig);
console.warn = w;
