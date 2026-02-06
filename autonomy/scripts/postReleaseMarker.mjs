const endpoint = process.env.RELEASE_MARKER_ENDPOINT;
const token = process.env.RELEASE_MARKER_TOKEN;

if (!endpoint || !token) {
  console.log("Skipping release marker publish: RELEASE_MARKER_ENDPOINT or RELEASE_MARKER_TOKEN missing.");
  process.exit(0);
}

const environment = process.env.RELEASE_ENVIRONMENT || "dev";
const version = process.env.RELEASE_VERSION || "dev";
const commitSha = process.env.RELEASE_COMMIT_SHA || process.env.GITHUB_SHA || "unknownsha";
const imageDigest = process.env.RELEASE_IMAGE_DIGEST || "unknown-image";
const migrationVersion = process.env.RELEASE_MIGRATION_VERSION || "unknown-migration";
const organizationId = Number(process.env.RELEASE_MARKER_ORG_ID || 0);

if (!Number.isFinite(organizationId) || organizationId <= 0) {
  console.error("RELEASE_MARKER_ORG_ID must be a positive integer when publishing release markers.");
  process.exit(1);
}

const payload = {
  version,
  environment,
  commitSha,
  imageDigest,
  migrationVersion,
  organizationId,
  metadata: {
    source: "github_actions",
    runId: process.env.GITHUB_RUN_ID ?? null,
    runNumber: process.env.GITHUB_RUN_NUMBER ?? null,
    actor: process.env.GITHUB_ACTOR ?? null,
  },
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-release-marker-token": token,
  },
  body: JSON.stringify(payload),
});

const text = await response.text();
if (!response.ok) {
  console.error(`Release marker publish failed with status ${response.status}: ${text}`);
  process.exit(1);
}

console.log(`Release marker published to ${endpoint}`);
