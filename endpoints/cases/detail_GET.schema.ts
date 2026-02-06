import superjson from "superjson";

export type OutputType = {
  caseFile: any;
  application: any;
  profile: any;
  notes: any[];
  documents: any[];
  messages: any[];
};

export async function getCaseDetail(caseId: number, init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/cases/detail?caseId=${caseId}`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch case detail");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
