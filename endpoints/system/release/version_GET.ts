import { jsonResponse } from "../../../helpers/http";

export async function handle() {
  return jsonResponse({
    version: process.env.RELEASE_VERSION ?? process.env.npm_package_version ?? "dev",
    commitSha: process.env.GIT_SHA ?? null,
    builtAt: process.env.BUILD_TIMESTAMP ?? null,
  });
}
