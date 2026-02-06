import { db } from "../../../helpers/db";
import { jsonResponse } from "../../../helpers/http";

export async function handle() {
  try {
    await db.selectFrom("organizations").select("id").limit(1).execute();

    return jsonResponse({
      status: "ready",
      checks: {
        database: "ok",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Readiness check failed:", error);
    return jsonResponse(
      {
        error: "Readiness check failed",
      },
      503
    );
  }
}
