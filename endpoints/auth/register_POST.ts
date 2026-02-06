import { randomBytes } from "crypto";
import { db } from "../../helpers/db";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { setServerSession, SessionExpirationSeconds } from "../../helpers/getSetServerSession";
import { buildSessionContextForUser } from "../../helpers/sessionContextBuilder";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { handleEndpointError } from "../../helpers/endpointError";
import { writeAuditEvent } from "../../helpers/audit";
import { schema } from "./register_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(await parseRequestBody(request));
    const email = input.email.toLowerCase();

    const existing = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (existing) {
      return jsonResponse({ error: "Email already in use" }, 409);
    }

    let organizationId = input.organizationId ?? null;

    if (!organizationId) {
      const firstOrg = await db
        .selectFrom("organizations")
        .select("id")
        .where("status", "=", "active")
        .orderBy("id")
        .executeTakeFirst();

      if (firstOrg) {
        organizationId = firstOrg.id;
      } else {
        const createdOrg = await db
          .insertInto("organizations")
          .values({
            name: "Default Housing Authority",
            ukRegion: "England",
            status: "active",
          })
          .returning("id")
          .executeTakeFirstOrThrow();
        organizationId = createdOrg.id;
      }
    }

    const passwordHash = await generatePasswordHash(input.password);

    const user = await db.transaction().execute(async (trx) => {
      const insertedUser = await trx
        .insertInto("users")
        .values({
          email,
          displayName: input.displayName,
          role: "applicant",
          defaultOrganizationId: organizationId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("userPasswords")
        .values({
          userId: insertedUser.id,
          passwordHash,
        })
        .execute();

      await trx
        .insertInto("organizationMemberships")
        .values({
          userId: insertedUser.id,
          organizationId,
          role: "applicant",
          isDefault: true,
        })
        .execute();

      await trx
        .insertInto("applicantProfiles")
        .values({
          organizationId,
          userId: insertedUser.id,
          legalFullName: input.displayName,
          consentAccepted: false,
        })
        .execute();

      return insertedUser;
    });

    const now = new Date();
    const sessionId = randomBytes(32).toString("hex");
    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: user.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt: new Date(now.getTime() + SessionExpirationSeconds * 1000),
      })
      .execute();

    const context = await buildSessionContextForUser({
      userId: user.id,
      preferredOrganizationId: organizationId,
    });

    await writeAuditEvent({
      organizationId,
      actorUserId: user.id,
      eventType: "auth.register",
      entityType: "user",
      entityId: String(user.id),
    });

    const response = jsonResponse({
      user: context.user,
      memberships: context.memberships,
      activeOrganizationId: context.activeOrganizationId,
      permissions: context.permissions,
    });

    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
      activeOrganizationId: context.activeOrganizationId,
      mfaPending: false,
    });

    return response;
  } catch (error) {
    return handleEndpointError(error);
  }
}
