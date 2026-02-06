import { describe, expect, it } from "vitest";
import { permissionsForRole, ROLE_PERMISSIONS } from "../../helpers/permissions";

describe("permissions", () => {
  it("returns role permissions for applicant", () => {
    const permissions = permissionsForRole("applicant");
    expect(permissions).toContain("application:submit_self");
    expect(permissions).toContain("assistant:use");
  });

  it("returns role permissions for caseworker", () => {
    const permissions = permissionsForRole("caseworker");
    expect(permissions).toContain("moderation:review_org");
    expect(permissions).toContain("reporting:read_org");
  });

  it("keeps platform admin superset controls", () => {
    const permissions = permissionsForRole("platform_admin");
    expect(permissions).toContain("organization:manage");
    expect(permissions.length).toBeGreaterThanOrEqual(ROLE_PERMISSIONS.caseworker.length);
  });
});
