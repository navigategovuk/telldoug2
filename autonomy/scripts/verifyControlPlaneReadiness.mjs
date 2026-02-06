const required = [
  "AWS_DEPLOY_ROLE_ARN",
  "RELEASE_MANIFEST_SIGNING_KEY",
  "RELEASE_MARKER_TOKEN",
  "RELEASE_MARKER_ORG_ID",
  "ECS_CLUSTER",
  "ECS_SERVICE",
  "SLO_ERROR_ALARM",
  "SLO_P95_ALARM",
  "RELEASE_VERSION",
  "RELEASE_MARKER_ENDPOINT",
];

const missing = required.filter((key) => {
  const value = process.env[key];
  return !value || String(value).trim().length === 0;
});

if (missing.length > 0) {
  console.error("Control-plane readiness check failed. Missing values:");
  for (const key of missing) {
    console.error(` - ${key}`);
  }
  process.exit(1);
}

console.log("Control-plane readiness check passed.");
