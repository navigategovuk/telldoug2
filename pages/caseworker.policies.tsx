import React, { useMemo, useState } from "react";
import { useCurrentPolicy, usePublishPolicy } from "../helpers/useModeration";

const DEFAULT_RULES = {
  blockedPhrases: ["discriminatory refusal", "racial exclusion"],
  watchPhrases: ["urgent homelessness", "eviction today"],
  blockedRegex: [],
};

export default function CaseworkerPoliciesPage() {
  const { data } = useCurrentPolicy();
  const publish = usePublishPolicy();

  const [title, setTitle] = useState("UK Housing Moderation Policy");
  const [rulesJson, setRulesJson] = useState(JSON.stringify(DEFAULT_RULES, null, 2));

  const parsedRules = useMemo(() => {
    try {
      return JSON.parse(rulesJson);
    } catch {
      return null;
    }
  }, [rulesJson]);

  const handlePublish = async () => {
    if (!parsedRules) return;
    await publish.mutateAsync({ title, rules: parsedRules });
  };

  return (
    <div>
      <h1>Policy Management</h1>
      <p>Active policy version: {data?.policy?.versionNumber ?? "none"}</p>

      <label>
        Policy title
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Policy rules JSON
        <textarea
          value={rulesJson}
          onChange={(e) => setRulesJson(e.target.value)}
          rows={14}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
      </label>

      <button onClick={() => void handlePublish()} disabled={!parsedRules || publish.isPending}>
        Publish New Policy Version
      </button>
    </div>
  );
}
