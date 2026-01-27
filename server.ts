import "./loadEnv.js";
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server';
import { createPathBasedRateLimiter, DEFAULT_RATE_LIMIT_RULES } from "./helpers/rateLimitMiddleware.js";
import { csrfMiddleware } from "./helpers/csrfMiddleware.js";

const app = new Hono();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// CSRF protection (double-submit cookie pattern)
// Exempt paths: auth login/register, public share views
app.use('/_api/*', csrfMiddleware({
  exemptPaths: [
    '/_api/auth/login',
    '/_api/auth/register',
    '/_api/auth/oauth',
    '/_api/share/view',
  ],
}));

// Path-based rate limiting
// auth: 5/min, export: 10/min, import: 5/min, ai: 10/min, crud: 60/min
const rateLimitRules = [
  { pattern: '/_api/auth/', category: 'auth' as const },
  { pattern: '/_api/export/', category: 'export' as const },
  { pattern: '/_api/import/', category: 'import' as const },
  { pattern: '/_api/share', category: 'share' as const },
  { pattern: '/_api/ai/', category: 'ai' as const },
  { pattern: '/_api/', category: 'crud' as const }, // Default for all other API routes
];
app.use('/_api/*', createPathBasedRateLimiter(rateLimitRules));

// ============================================================================
// API ENDPOINTS
// ============================================================================

// ----------------------------------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------------------------------
app.post('/_api/auth/login', async c => {
  try {
    const { handle } = await import("./endpoints/auth/login_with_password_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.post('/_api/auth/register', async c => {
  try {
    const { handle } = await import("./endpoints/auth/register_with_password_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.post('/_api/auth/logout', async c => {
  try {
    const { handle } = await import("./endpoints/auth/logout_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.get('/_api/auth/session', async c => {
  try {
    const { handle } = await import("./endpoints/auth/session_GET.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.post('/_api/auth/establish-session', async c => {
  try {
    const { handle } = await import("./endpoints/auth/establish_session_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.get('/_api/auth/oauth/authorize', async c => {
  try {
    const { handle } = await import("./endpoints/auth/oauth_authorize_GET.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.get('/_api/auth/oauth/callback', async c => {
  try {
    const { handle } = await import("./endpoints/auth/oauth_callback_GET.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

// ----------------------------------------------------------------------------
// IMPORT ENDPOINTS
// ----------------------------------------------------------------------------
app.post('/_api/import/upload', async c => {
  try {
    const { handle } = await import("./endpoints/import/upload_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.post('/_api/import/staging', async c => {
  try {
    const { handle } = await import("./endpoints/import/staging_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.post('/_api/import/staging-update', async c => {
  try {
    const { handle } = await import("./endpoints/import/staging-update_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

app.post('/_api/import/commit', async c => {
  try {
    const { handle } = await import("./endpoints/import/commit_POST.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

// ----------------------------------------------------------------------------
// WORKSPACE ENDPOINT
// ----------------------------------------------------------------------------
app.get('/_api/workspace', async c => {
  try {
    const { handle } = await import("./endpoints/workspace_GET.js");
    const response = await handle(c.req.raw);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint: " + (e as Error).message, 500);
  }
});

// ----------------------------------------------------------------------------
// AI ENDPOINTS
// ----------------------------------------------------------------------------
app.post('_api/ai/chat',async c => {
  try {
    const { handle } = await import("./endpoints/ai/chat_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/jobs/list',async c => {
  try {
    const { handle } = await import("./endpoints/jobs/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/goals/list',async c => {
  try {
    const { handle } = await import("./endpoints/goals/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/events/list',async c => {
  try {
    const { handle } = await import("./endpoints/events/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/people/list',async c => {
  try {
    const { handle } = await import("./endpoints/people/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/skills/list',async c => {
  try {
    const { handle } = await import("./endpoints/skills/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/content/list',async c => {
  try {
    const { handle } = await import("./endpoints/content/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/jobs/create',async c => {
  try {
    const { handle } = await import("./endpoints/jobs/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/jobs/delete',async c => {
  try {
    const { handle } = await import("./endpoints/jobs/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/jobs/update',async c => {
  try {
    const { handle } = await import("./endpoints/jobs/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/feedback/list',async c => {
  try {
    const { handle } = await import("./endpoints/feedback/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/goals/create',async c => {
  try {
    const { handle } = await import("./endpoints/goals/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/goals/delete',async c => {
  try {
    const { handle } = await import("./endpoints/goals/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/goals/update',async c => {
  try {
    const { handle } = await import("./endpoints/goals/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/learning/list',async c => {
  try {
    const { handle } = await import("./endpoints/learning/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/projects/list',async c => {
  try {
    const { handle } = await import("./endpoints/projects/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/search/global',async c => {
  try {
    const { handle } = await import("./endpoints/search/global_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/timeline/data',async c => {
  try {
    const { handle } = await import("./endpoints/timeline/data_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/events/create',async c => {
  try {
    const { handle } = await import("./endpoints/events/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/events/delete',async c => {
  try {
    const { handle } = await import("./endpoints/events/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/events/update',async c => {
  try {
    const { handle } = await import("./endpoints/events/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/people/create',async c => {
  try {
    const { handle } = await import("./endpoints/people/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/people/delete',async c => {
  try {
    const { handle } = await import("./endpoints/people/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/people/update',async c => {
  try {
    const { handle } = await import("./endpoints/people/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/skills/create',async c => {
  try {
    const { handle } = await import("./endpoints/skills/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/skills/delete',async c => {
  try {
    const { handle } = await import("./endpoints/skills/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/skills/update',async c => {
  try {
    const { handle } = await import("./endpoints/skills/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/content/create',async c => {
  try {
    const { handle } = await import("./endpoints/content/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/content/delete',async c => {
  try {
    const { handle } = await import("./endpoints/content/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/content/update',async c => {
  try {
    const { handle } = await import("./endpoints/content/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/dashboard/stats',async c => {
  try {
    const { handle } = await import("./endpoints/dashboard/stats_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/feedback/create',async c => {
  try {
    const { handle } = await import("./endpoints/feedback/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/feedback/delete',async c => {
  try {
    const { handle } = await import("./endpoints/feedback/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/feedback/update',async c => {
  try {
    const { handle } = await import("./endpoints/feedback/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/import/linkedin',async c => {
  try {
    const { handle } = await import("./endpoints/import/linkedin_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/learning/create',async c => {
  try {
    const { handle } = await import("./endpoints/learning/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/learning/delete',async c => {
  try {
    const { handle } = await import("./endpoints/learning/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/learning/update',async c => {
  try {
    const { handle } = await import("./endpoints/learning/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/projects/create',async c => {
  try {
    const { handle } = await import("./endpoints/projects/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/projects/delete',async c => {
  try {
    const { handle } = await import("./endpoints/projects/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/projects/update',async c => {
  try {
    const { handle } = await import("./endpoints/projects/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/achievements/list',async c => {
  try {
    const { handle } = await import("./endpoints/achievements/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/ai/draft-content',async c => {
  try {
    const { handle } = await import("./endpoints/ai/draft-content_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/ai/meeting-brief',async c => {
  try {
    const { handle } = await import("./endpoints/ai/meeting-brief_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/compensation/list',async c => {
  try {
    const { handle } = await import("./endpoints/compensation/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/institutions/list',async c => {
  try {
    const { handle } = await import("./endpoints/institutions/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/interactions/list',async c => {
  try {
    const { handle } = await import("./endpoints/interactions/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/relationships/list',async c => {
  try {
    const { handle } = await import("./endpoints/relationships/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/achievements/create',async c => {
  try {
    const { handle } = await import("./endpoints/achievements/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/achievements/delete',async c => {
  try {
    const { handle } = await import("./endpoints/achievements/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/achievements/update',async c => {
  try {
    const { handle } = await import("./endpoints/achievements/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/ai/career-narrative',async c => {
  try {
    const { handle } = await import("./endpoints/ai/career-narrative_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/compensation/create',async c => {
  try {
    const { handle } = await import("./endpoints/compensation/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/compensation/delete',async c => {
  try {
    const { handle } = await import("./endpoints/compensation/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/compensation/update',async c => {
  try {
    const { handle } = await import("./endpoints/compensation/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/institutions/create',async c => {
  try {
    const { handle } = await import("./endpoints/institutions/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/institutions/delete',async c => {
  try {
    const { handle } = await import("./endpoints/institutions/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/institutions/update',async c => {
  try {
    const { handle } = await import("./endpoints/institutions/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/interactions/create',async c => {
  try {
    const { handle } = await import("./endpoints/interactions/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/interactions/delete',async c => {
  try {
    const { handle } = await import("./endpoints/interactions/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/interactions/update',async c => {
  try {
    const { handle } = await import("./endpoints/interactions/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/relationships/create',async c => {
  try {
    const { handle } = await import("./endpoints/relationships/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/relationships/delete',async c => {
  try {
    const { handle } = await import("./endpoints/relationships/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/relationships/update',async c => {
  try {
    const { handle } = await import("./endpoints/relationships/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})

// ============================================================================
// PROFILE ENDPOINTS (Resume Builder)
// ============================================================================

app.get('_api/profile/get',async c => {
  try {
    const { handle } = await import("./endpoints/profile/get_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/updateBasics',async c => {
  try {
    const { handle } = await import("./endpoints/profile/updateBasics_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/populate',async c => {
  try {
    const { handle } = await import("./endpoints/profile/populate_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/profile/work/list',async c => {
  try {
    const { handle } = await import("./endpoints/profile/work_list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/work/create',async c => {
  try {
    const { handle } = await import("./endpoints/profile/work_create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/work/update',async c => {
  try {
    const { handle } = await import("./endpoints/profile/work_update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/work/delete',async c => {
  try {
    const { handle } = await import("./endpoints/profile/work_delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/profile/education/list',async c => {
  try {
    const { handle } = await import("./endpoints/profile/education_list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/education/create',async c => {
  try {
    const { handle } = await import("./endpoints/profile/education_create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/education/update',async c => {
  try {
    const { handle } = await import("./endpoints/profile/education_update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/education/delete',async c => {
  try {
    const { handle } = await import("./endpoints/profile/education_delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/profile/skills/list',async c => {
  try {
    const { handle } = await import("./endpoints/profile/skills_list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/skills/create',async c => {
  try {
    const { handle } = await import("./endpoints/profile/skills_create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/skills/update',async c => {
  try {
    const { handle } = await import("./endpoints/profile/skills_update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/skills/delete',async c => {
  try {
    const { handle } = await import("./endpoints/profile/skills_delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/profile/projects/list',async c => {
  try {
    const { handle } = await import("./endpoints/profile/projects_list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/projects/create',async c => {
  try {
    const { handle } = await import("./endpoints/profile/projects_create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/projects/update',async c => {
  try {
    const { handle } = await import("./endpoints/profile/projects_update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/profile/projects/delete',async c => {
  try {
    const { handle } = await import("./endpoints/profile/projects_delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})

// ============================================================================
// VARIANTS ENDPOINTS (Resume Builder)
// ============================================================================

app.get('_api/variants/list',async c => {
  try {
    const { handle } = await import("./endpoints/variants/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/variants/get',async c => {
  try {
    const { handle } = await import("./endpoints/variants/get_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/variants/create',async c => {
  try {
    const { handle } = await import("./endpoints/variants/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/variants/update',async c => {
  try {
    const { handle } = await import("./endpoints/variants/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/variants/delete',async c => {
  try {
    const { handle } = await import("./endpoints/variants/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/variants/duplicate',async c => {
  try {
    const { handle } = await import("./endpoints/variants/duplicate_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/variants/setPrimary',async c => {
  try {
    const { handle } = await import("./endpoints/variants/setPrimary_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})

// ============================================================================
// EXPORT ENDPOINTS (Resume Builder)
// ============================================================================

app.post('_api/export/generate',async c => {
  try {
    const { handle } = await import("./endpoints/export/generate_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/export/preview',async c => {
  try {
    const { handle } = await import("./endpoints/export/preview_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})

// ============================================================================
// SHARE ENDPOINTS (Resume Builder)
// ============================================================================

app.get('_api/share/list',async c => {
  try {
    const { handle } = await import("./endpoints/share/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/share/view',async c => {
  try {
    const { handle } = await import("./endpoints/share/view_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/share/create',async c => {
  try {
    const { handle } = await import("./endpoints/share/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/share/update',async c => {
  try {
    const { handle } = await import("./endpoints/share/update_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/share/delete',async c => {
  try {
    const { handle } = await import("./endpoints/share/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/share/revoke',async c => {
  try {
    const { handle } = await import("./endpoints/share/revoke_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})

// ============================================================================
// SNAPSHOTS ENDPOINTS (Resume Builder)
// ============================================================================

app.get('_api/snapshots/list',async c => {
  try {
    const { handle } = await import("./endpoints/snapshots/list_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.get('_api/snapshots/get',async c => {
  try {
    const { handle } = await import("./endpoints/snapshots/get_GET.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/snapshots/create',async c => {
  try {
    const { handle } = await import("./endpoints/snapshots/create_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/snapshots/delete',async c => {
  try {
    const { handle } = await import("./endpoints/snapshots/delete_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.post('_api/snapshots/restore',async c => {
  try {
    const { handle } = await import("./endpoints/snapshots/restore_POST.js");
    const request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + (e as Error).message,  500)
  }
})
app.use("/*", serveStatic({ root: "./static" }));
app.use('/*', serveStatic({ root: './dist' }))
app.get("*", async (c, next) => {
  const p = c.req.path;
  if (p.startsWith("/_api")) {
    return next();
  }
  return serveStatic({ path: "./dist/index.html" })(c, next);
});
serve({ fetch: app.fetch, port: 3333 });
console.log("Running at http://localhost:3333")
      