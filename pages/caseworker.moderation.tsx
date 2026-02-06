import React from "react";
import { useModerationDecision, useModerationQueue } from "../helpers/useModeration";

export default function CaseworkerModerationPage() {
  const { data } = useModerationQueue();
  const decision = useModerationDecision();
  const [reasons, setReasons] = React.useState<Record<number, string>>({});

  return (
    <div>
      <h1>Moderation Queue</h1>
      <p>Pre-publish gated items requiring manual review.</p>
      <p>High-risk and blocked outcomes require human final authority with a reason.</p>

      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="left">Target</th>
            <th align="left">Risk</th>
            <th align="left">Reason</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.targetType}:{item.targetId}</td>
              <td>{item.riskScore.toFixed(2)}</td>
              <td>
                <textarea
                  value={reasons[item.id] ?? ""}
                  onChange={(event) =>
                    setReasons((prev) => ({ ...prev, [item.id]: event.target.value }))
                  }
                  rows={2}
                  style={{ width: "100%" }}
                  placeholder="Required reason for moderation decision"
                />
              </td>
              <td>
                <button
                  disabled={(reasons[item.id] ?? "").trim().length < 2}
                  onClick={() =>
                    decision.mutate({
                      moderationItemId: item.id,
                      decision: "approved",
                      reason: (reasons[item.id] ?? "").trim(),
                    })
                  }
                >
                  Approve
                </button>
                <button
                  disabled={(reasons[item.id] ?? "").trim().length < 2}
                  onClick={() =>
                    decision.mutate({
                      moderationItemId: item.id,
                      decision: "blocked",
                      reason: (reasons[item.id] ?? "").trim(),
                    })
                  }
                >
                  Block
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
