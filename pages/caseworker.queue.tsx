import React from "react";
import { Link } from "react-router-dom";
import { useCaseQueue } from "../helpers/useCases";

export default function CaseworkerQueuePage() {
  const { data, isLoading } = useCaseQueue();

  return (
    <div>
      <h1>Case Queue</h1>
      {isLoading ? <p>Loading queue...</p> : null}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Case</th>
            <th align="left">Applicant</th>
            <th align="left">Status</th>
            <th align="left">Priority</th>
            <th align="left">SLA</th>
          </tr>
        </thead>
        <tbody>
          {data?.cases.map((item) => (
            <tr key={item.id}>
              <td>
                <Link to={`/caseworker/case/${item.id}`}>Case #{item.id}</Link>
              </td>
              <td>{item.applicantName}</td>
              <td>{item.status}</td>
              <td>{item.priority}</td>
              <td>{item.slaDueAt ? new Date(item.slaDueAt).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
