import { jsonResponse } from "../../../helpers/http";

export async function handle() {
  return jsonResponse({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
}
