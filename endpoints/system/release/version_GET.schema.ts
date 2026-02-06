import superjson from "superjson";

export type OutputType = {
  version: string;
  commitSha: string | null;
  builtAt: string | null;
};

export async function getReleaseVersion(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/system/release/version`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const parsed = text ? superjson.parse<any>(text) : null;
    throw new Error(
      (typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ??
        "Release version lookup failed"
    );
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody
    ? parsedBody.data
    : parsedBody) as OutputType;
}
