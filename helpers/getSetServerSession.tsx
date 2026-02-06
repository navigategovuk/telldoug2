import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();
const secret = process.env.JWT_SECRET;

export const SessionExpirationSeconds = 60 * 60 * 24 * 7; // 7 days
export const CleanupProbability = 0.1;

const CookieName = "floot_built_app_session";

export interface Session {
  id: string;
  createdAt: number;
  lastAccessed: number;
  activeOrganizationId: number | null;
  mfaPending: boolean;
}

export class NotAuthenticatedError extends Error {
  constructor(message?: string) {
    super(message ?? "Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

function ensureSecret() {
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured and at least 32 characters");
  }
}

function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookie) => {
      const [rawName, ...rest] = cookie.split("=");
      if (!rawName || rest.length === 0) {
        return acc;
      }
      acc[rawName] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

export async function getServerSessionOrThrow(request: Request): Promise<Session> {
  ensureSecret();
  const cookies = parseCookies(request);
  const sessionCookie = cookies[CookieName];

  if (!sessionCookie) {
    throw new NotAuthenticatedError();
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, encoder.encode(secret));

    return {
      id: String(payload.id),
      createdAt: Number(payload.createdAt),
      lastAccessed: Number(payload.lastAccessed),
      activeOrganizationId:
        payload.activeOrganizationId === null || payload.activeOrganizationId === undefined
          ? null
          : Number(payload.activeOrganizationId),
      mfaPending: Boolean(payload.mfaPending),
    };
  } catch {
    throw new NotAuthenticatedError();
  }
}

export async function setServerSession(response: Response, session: Session): Promise<void> {
  ensureSecret();

  const token = await new SignJWT({
    id: session.id,
    createdAt: session.createdAt,
    lastAccessed: session.lastAccessed,
    activeOrganizationId: session.activeOrganizationId,
    mfaPending: session.mfaPending,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(secret));

  const cookieValue = [
    `${CookieName}=${token}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SessionExpirationSeconds}`,
  ].join("; ");

  response.headers.set("Set-Cookie", cookieValue);
}

export function clearServerSession(response: Response) {
  const cookieValue = [
    `${CookieName}=`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ].join("; ");

  response.headers.set("Set-Cookie", cookieValue);
}
