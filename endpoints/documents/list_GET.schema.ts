import superjson from "superjson";
import { Selectable } from "kysely";
import { Documents } from "../../helpers/schema";

export type OutputType = { documents: Selectable<Documents>[] };

export async function getDocuments(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/documents/list`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const text = await result.text();
  if (!result.ok) {
    const parsed = text ? superjson.parse<any>(text) : null;
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to load documents");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
