import { db } from "../../helpers/db";
import { clearServerSession, getServerSessionOrThrow } from "../../helpers/getSetServerSession";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  let sessionId: string | null = null;
  try {
    const session = await getServerSessionOrThrow(request);
    sessionId = session.id;
  } catch {
    // ignore missing session
  }

  if (sessionId) {
    await db.deleteFrom("sessions").where("id", "=", sessionId).execute();
  }

  const response = jsonResponse({ ok: true });
  clearServerSession(response);
  return response;
}
