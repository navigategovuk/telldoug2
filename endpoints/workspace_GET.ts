import { schema, OutputType } from "./workspace_GET.schema";
import { getAuthenticatedWorkspace } from "../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    // Get the authenticated user's workspace
    const workspace = await getAuthenticatedWorkspace(request);

    return new Response(
      superjson.stringify({
        workspace,
      } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401 }
      );
    }
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 500 }
    );
  }
}