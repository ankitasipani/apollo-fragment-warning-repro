// Tiny in-process GraphQL server so the repro has no external dependencies.
import { graphql, buildSchema } from "graphql";

const schema = buildSchema(`
  type Product { id: ID! name: String! price: Float! }
  type Query { product: Product! }
`);

const rootValue = {
  product: () => ({ id: "1", name: "Example product", price: 9.99 }),
};

export async function POST(req: Request) {
  const { query, variables, operationName } = await req.json();
  const result = await graphql({
    schema,
    source: query,
    rootValue,
    variableValues: variables,
    operationName,
  });
  return Response.json(result);
}
