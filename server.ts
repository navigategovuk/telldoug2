import "./loadEnv.js";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import superjson from "superjson";

type Method = "GET" | "POST";

type RouteDef = {
  method: Method;
  path: string;
  importPath: string;
};

const app = new Hono();

const routes: RouteDef[] = [
  { method: "POST", path: "/_api/auth/register", importPath: "./endpoints/auth/register_POST.js" },
  {
    method: "POST",
    path: "/_api/auth/login_with_password",
    importPath: "./endpoints/auth/login_with_password_POST.js",
  },
  { method: "POST", path: "/_api/auth/mfa/verify", importPath: "./endpoints/auth/mfa/verify_POST.js" },
  { method: "GET", path: "/_api/auth/session", importPath: "./endpoints/auth/session_GET.js" },
  { method: "POST", path: "/_api/auth/logout", importPath: "./endpoints/auth/logout_POST.js" },

  { method: "GET", path: "/_api/orgs/mine", importPath: "./endpoints/orgs/mine_GET.js" },
  { method: "POST", path: "/_api/orgs/switch", importPath: "./endpoints/orgs/switch_POST.js" },

  { method: "GET", path: "/_api/applicant/profile", importPath: "./endpoints/applicant/profile_GET.js" },
  {
    method: "POST",
    path: "/_api/applicant/profile/update",
    importPath: "./endpoints/applicant/profile/update_POST.js",
  },

  { method: "GET", path: "/_api/applications/current", importPath: "./endpoints/applications/current_GET.js" },
  { method: "POST", path: "/_api/applications/create", importPath: "./endpoints/applications/create_POST.js" },
  { method: "POST", path: "/_api/applications/update", importPath: "./endpoints/applications/update_POST.js" },
  { method: "POST", path: "/_api/applications/submit", importPath: "./endpoints/applications/submit_POST.js" },

  {
    method: "POST",
    path: "/_api/documents/create-upload-url",
    importPath: "./endpoints/documents/create-upload-url_POST.js",
  },
  { method: "POST", path: "/_api/documents/attach", importPath: "./endpoints/documents/attach_POST.js" },
  { method: "GET", path: "/_api/documents/list", importPath: "./endpoints/documents/list_GET.js" },
  {
    method: "POST",
    path: "/_api/documents/request-recheck",
    importPath: "./endpoints/documents/request-recheck_POST.js",
  },

  { method: "GET", path: "/_api/messages/thread", importPath: "./endpoints/messages/thread_GET.js" },
  { method: "POST", path: "/_api/messages/send", importPath: "./endpoints/messages/send_POST.js" },

  { method: "GET", path: "/_api/cases/queue", importPath: "./endpoints/cases/queue_GET.js" },
  { method: "GET", path: "/_api/cases/detail", importPath: "./endpoints/cases/detail_GET.js" },
  { method: "POST", path: "/_api/cases/assign", importPath: "./endpoints/cases/assign_POST.js" },
  {
    method: "POST",
    path: "/_api/cases/update-status",
    importPath: "./endpoints/cases/update-status_POST.js",
  },
  { method: "POST", path: "/_api/cases/add-note", importPath: "./endpoints/cases/add-note_POST.js" },

  { method: "GET", path: "/_api/moderation/queue", importPath: "./endpoints/moderation/queue_GET.js" },
  { method: "POST", path: "/_api/moderation/decision", importPath: "./endpoints/moderation/decision_POST.js" },
  {
    method: "GET",
    path: "/_api/moderation/policy/current",
    importPath: "./endpoints/moderation/policy/current_GET.js",
  },
  {
    method: "POST",
    path: "/_api/moderation/policy/publish",
    importPath: "./endpoints/moderation/policy/publish_POST.js",
  },

  {
    method: "POST",
    path: "/_api/ai/eligibility/precheck",
    importPath: "./endpoints/ai/eligibility/precheck_POST.js",
  },
  {
    method: "POST",
    path: "/_api/ai/documents/extract",
    importPath: "./endpoints/ai/documents/extract_POST.js",
  },
  {
    method: "POST",
    path: "/_api/ai/assistant/stream",
    importPath: "./endpoints/ai/assistant/stream_POST.js",
  },

  { method: "GET", path: "/_api/audit/events", importPath: "./endpoints/audit/events_GET.js" },
  {
    method: "POST",
    path: "/_api/audit/release-marker",
    importPath: "./endpoints/audit/release-marker_POST.js",
  },
  {
    method: "GET",
    path: "/_api/metrics/operational",
    importPath: "./endpoints/metrics/operational_GET.js",
  },
  {
    method: "GET",
    path: "/_api/metrics/slo",
    importPath: "./endpoints/metrics/slo_GET.js",
  },
  {
    method: "GET",
    path: "/_api/system/health/readiness",
    importPath: "./endpoints/system/health/readiness_GET.js",
  },
  {
    method: "GET",
    path: "/_api/system/health/dependencies",
    importPath: "./endpoints/system/health/dependencies_GET.js",
  },
  {
    method: "GET",
    path: "/_api/system/health/liveness",
    importPath: "./endpoints/system/health/liveness_GET.js",
  },
  {
    method: "GET",
    path: "/_api/system/release/version",
    importPath: "./endpoints/system/release/version_GET.js",
  },
];

for (const route of routes) {
  const register = route.method === "GET" ? app.get.bind(app) : app.post.bind(app);
  register(route.path, async (c) => {
    try {
      const mod = await import(route.importPath);
      const response = await mod.handle(c.req.raw);

      if (!(response instanceof Response) && response?.constructor?.name !== "Response") {
        return c.text("Endpoint handler must return a Response object", 500);
      }

      return response;
    } catch (error) {
      console.error(`Error in ${route.path}:`, error);
      const correlationId = crypto.randomUUID();
      return c.body(
        superjson.stringify({
          error: {
            code: "endpoint_failure",
            message: error instanceof Error ? error.message : "unknown",
          },
          correlationId,
        }),
        500,
        {
          "Content-Type": "application/json",
          "x-correlation-id": correlationId,
        }
      );
    }
  });
}

app.use("/*", serveStatic({ root: "./static" }));
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", async (c, next) => {
  const path = c.req.path;
  if (path.startsWith("/_api")) {
    return next();
  }
  return serveStatic({ path: "./dist/index.html" })(c, next);
});

serve({ fetch: app.fetch, port: 3333 });
console.log("Running at http://localhost:3333");
