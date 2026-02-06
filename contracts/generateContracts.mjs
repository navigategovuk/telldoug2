import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const endpointRoot = path.join(cwd, "endpoints");

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(full));
      continue;
    }
    output.push(full);
  }
  return output;
}

function generateRoutes() {
  const handlerFiles = walk(endpointRoot)
    .filter((filePath) => filePath.endsWith(".ts") && !filePath.endsWith(".schema.ts"))
    .sort();

  return handlerFiles.map((absPath) => {
    const relativePath = path.relative(cwd, absPath).replace(/\\/g, "/");
    const routeSource = relativePath.replace(/^endpoints\//, "").replace(/\.ts$/, "");
    const methodMatch = routeSource.match(/_(GET|POST)$/);
    if (!methodMatch) {
      throw new Error(`Unexpected endpoint handler naming: ${relativePath}`);
    }

    const method = methodMatch[1];
    const apiPath = `/_api/${routeSource.replace(/_(GET|POST)$/, "")}`;
    const schemaPath = relativePath.replace(/\.ts$/, ".schema.ts");

    return {
      method,
      path: apiPath,
      handler: relativePath,
      clientSchema: fs.existsSync(path.join(cwd, schemaPath)) ? schemaPath : null,
    };
  });
}

function writeContractSnapshot(routes) {
  const groups = routes.reduce((acc, route) => {
    const group = route.path.split("/")[2] || "root";
    (acc[group] ||= []).push(route);
    return acc;
  }, {});

  const snapshot = {
    generatedAt: new Date().toISOString(),
    responseEnvelope: {
      success: { data: "any", correlationId: "string" },
      error: { error: { code: "string", message: "string" }, correlationId: "string" },
    },
    routes,
    groups,
  };

  fs.writeFileSync(
    path.join(cwd, "contracts/housing-api.contract.snapshot.json"),
    JSON.stringify(snapshot, null, 2) + "\n"
  );
}

function writeOpenApi(routes) {
  const openapiPaths = {};
  for (const route of routes) {
    const method = route.method.toLowerCase();
    (openapiPaths[route.path] ||= {})[method] = {
      operationId: `${method}_${route.path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`,
      responses: {
        200: {
          description: "Success envelope",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
            },
          },
        },
        "4XX": {
          description: "Error envelope",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
            },
          },
        },
        "5XX": {
          description: "Error envelope",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
            },
          },
        },
      },
      "x-handler": route.handler,
      "x-client-schema": route.clientSchema,
    };
  }

  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "Housing API",
      version: "1.0.0",
      description: "Frozen active contracts for the housing runtime.",
    },
    paths: openapiPaths,
    components: {
      schemas: {
        ApiSuccessEnvelope: {
          type: "object",
          required: ["data", "correlationId"],
          properties: {
            data: {},
            correlationId: { type: "string" },
          },
        },
        ApiErrorDetail: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: { type: "string" },
            message: { type: "string" },
          },
        },
        ApiErrorEnvelope: {
          type: "object",
          required: ["error", "correlationId"],
          properties: {
            error: { $ref: "#/components/schemas/ApiErrorDetail" },
            correlationId: { type: "string" },
          },
        },
      },
    },
  };

  fs.writeFileSync(path.join(cwd, "contracts/openapi.housing.v1.json"), JSON.stringify(openapi, null, 2) + "\n");
}

const routes = generateRoutes();
writeContractSnapshot(routes);
writeOpenApi(routes);

console.log(`Generated contract snapshots for ${routes.length} routes.`);
