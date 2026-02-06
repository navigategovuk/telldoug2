import { randomBytes } from "crypto";
import { sql } from "kysely";
import { compare } from "bcryptjs";
import { db } from "../../helpers/db";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./login_with_password_POST.schema";
import { handleEndpointError } from "../../helpers/endpointError";
import { setServerSession, SessionExpirationSeconds } from "../../helpers/getSetServerSession";
import { buildSessionContextForUser } from "../../helpers/sessionContextBuilder";
import { writeAuditEvent } from "../../helpers/audit";

const RATE_LIMIT = {
  maxFailedAttempts: 5,
  lockoutWindowMinutes: 15,
  lockoutDurationMinutes: 15,
};

export async function handle(request: Request) {
  try {
    const input = schema.parse(await parseRequestBody(request));
    const email = input.email.toLowerCase();

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT.lockoutWindowMinutes * 60 * 1000);

    const auth = await db.transaction().execute(async (trx) => {
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${email},0))`.execute(trx);

      const recentFailures = await trx
        .selectFrom("loginAttempts")
        .select([
          trx.fn.countAll<number>().as("failedCount"),
          trx.fn.max("attemptedAt").as("lastFailedAt"),
        ])
        .where("email", "=", email)
        .where("success", "=", false)
        .where("attemptedAt", ">=", windowStart)
        .executeTakeFirst();

      const failedCount = Number(recentFailures?.failedCount ?? 0);
      const lastFailedAt = recentFailures?.lastFailedAt
        ? new Date(recentFailures.lastFailedAt as unknown as string)
        : null;

      if (failedCount >= RATE_LIMIT.maxFailedAttempts && lastFailedAt) {
        const lockoutEnd = new Date(
          lastFailedAt.getTime() + RATE_LIMIT.lockoutDurationMinutes * 60 * 1000
        );
        if (now < lockoutEnd) {
          const remainingMinutes = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 60000);
          return { type: "locked" as const, remainingMinutes };
        }
      }

      const userRow = await trx
        .selectFrom("users")
        .innerJoin("userPasswords", "users.id", "userPasswords.userId")
        .select([
          "users.id as userId",
          "users.email as email",
          "users.role as role",
          "userPasswords.passwordHash as passwordHash",
        ])
        .where("users.email", "=", email)
        .executeTakeFirst();

      if (!userRow) {
        await trx
          .insertInto("loginAttempts")
          .values({ email, attemptedAt: now, success: false })
          .execute();
        return { type: "failed" as const };
      }

      const ok = await compare(input.password, userRow.passwordHash);
      if (!ok) {
        await trx
          .insertInto("loginAttempts")
          .values({ email, attemptedAt: now, success: false })
          .execute();
        return { type: "failed" as const };
      }

      await trx
        .insertInto("loginAttempts")
        .values({ email, attemptedAt: now, success: true })
        .execute();

      const sessionId = randomBytes(32).toString("hex");
      await trx
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: userRow.userId,
          createdAt: now,
          lastAccessed: now,
          expiresAt: new Date(now.getTime() + SessionExpirationSeconds * 1000),
        })
        .execute();

      return {
        type: "success" as const,
        sessionId,
        userId: userRow.userId,
        userRole: userRow.role,
      };
    });

    if (auth.type === "locked") {
      return jsonResponse(
        { message: `Too many attempts. Try again in ${auth.remainingMinutes} minutes.` },
        429
      );
    }

    if (auth.type === "failed") {
      return jsonResponse({ message: "Invalid email or password" }, 401);
    }

    const context = await buildSessionContextForUser({ userId: auth.userId });
    const mfaRequired =
      context.activeMembershipRole === "caseworker" ||
      context.activeMembershipRole === "platform_admin";

    const response = jsonResponse(
      mfaRequired
        ? {
            mfaRequired: true,
            message: "MFA code required for caseworker or admin sign-in",
          }
        : {
            mfaRequired: false,
            context: {
              user: context.user,
              memberships: context.memberships,
              activeOrganizationId: context.activeOrganizationId,
              permissions: context.permissions,
            },
          }
    );

    await setServerSession(response, {
      id: auth.sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
      activeOrganizationId: context.activeOrganizationId,
      mfaPending: mfaRequired,
    });

    await writeAuditEvent({
      organizationId: context.activeOrganizationId,
      actorUserId: auth.userId,
      eventType: "auth.login",
      entityType: "user",
      entityId: String(auth.userId),
      metadata: { mfaRequired },
    });

    return response;
  } catch (error) {
    return handleEndpointError(error);
  }
}
