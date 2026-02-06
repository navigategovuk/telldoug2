import { getAiProvider } from "../../../helpers/ai";
import { requireAnyRole } from "../../../helpers/authorize";
import { db } from "../../../helpers/db";
import { handleEndpointError } from "../../../helpers/endpointError";
import { jsonResponse } from "../../../helpers/http";
import { DependencyHealth } from "../../../contracts/platformTypes";

function envDependency(name: string, description: string): DependencyHealth {
  if (process.env[name] && String(process.env[name]).trim().length > 0) {
    return { status: "ok" };
  }
  return {
    status: "degraded",
    detail: `${description} is not configured`,
  };
}

export async function handle(request: Request) {
  try {
    await requireAnyRole(request, ["caseworker", "platform_admin"]);

    let dbStatus: DependencyHealth = { status: "ok" };
    try {
      await db.selectFrom("organizations").select("id").limit(1).execute();
    } catch (error) {
      dbStatus = { status: "down", detail: "Database check failed" };
    }

    let aiProviderStatus: DependencyHealth = { status: "ok" };
    try {
      getAiProvider();
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("fill this up")) {
        aiProviderStatus = {
          status: "degraded",
          detail: "OPENAI_API_KEY is missing or placeholder",
        };
      }
    } catch {
      aiProviderStatus = { status: "down", detail: "AI provider initialization failed" };
    }

    const dependencies = {
      db: dbStatus,
      storage: envDependency("OBJECT_STORAGE_BUCKET", "Object storage bucket"),
      queue: envDependency("SQS_QUEUE_URL", "Queue URL"),
      aiProvider: aiProviderStatus,
    };

    const hasDown = Object.values(dependencies).some((item) => item.status === "down");
    const hasDegraded = Object.values(dependencies).some((item) => item.status === "degraded");
    const status = hasDown ? "down" : hasDegraded ? "degraded" : "ready";

    return jsonResponse({
      status,
      dependencies,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
