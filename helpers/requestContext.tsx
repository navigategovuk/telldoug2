export function getCorrelationId(request: Request): string {
  const headerId = request.headers.get("x-correlation-id");
  if (headerId && headerId.trim().length > 0) {
    return headerId.trim();
  }
  return crypto.randomUUID();
}
