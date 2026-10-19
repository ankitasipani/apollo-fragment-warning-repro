"use client";

import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";

// One fragment, defined once, used by exactly one query in one client component.
// There is NO duplicate fragment name anywhere in this project.
const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id
    name
    price
  }
`;

const GET_PRODUCT = gql`
  query GetProduct {
    product {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export function Product() {
  const { data } = useSuspenseQuery<{ product: { id: string; name: string; price: number } }>(
    GET_PRODUCT
  );
  return (
    <p>
      {data.product.name}: ${data.product.price}
    </p>
  );
}
