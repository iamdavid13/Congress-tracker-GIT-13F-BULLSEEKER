import { useEffect, useState } from "react";
import { getCommittees } from "../api.js";

export default function Committees() {
  const [committees, setCommittees] = useState([]);
  const [search, setSearch] = useState("");
  const [chamber, setChamber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (chamber) params.set("chamber", chamber);
    getCommittees(params.toString())
      .then(d => setCommittees(d.committees || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, chamber]);

  // Separate top-level committees from subcommittees
  const topLevel = committees.filter(c => !c.parent);
  const subcommittees = committees.filter(c => c.parent);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Committees</h1>
          <p className="sub">Congressional committees and subcommittees</p>
        </div>
        <span className="live-badge"><span className="dot"></span> LIVE from Congress.gov</span>
      </div>

      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search committees…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={chamber} onChange={e => setChamber(e.target.value)}>
          <option value="">All Chambers</option>
          <option value="House">House</option>
          <option value="Senate">Senate</option>
        </select>
      </div>

      {loading ? (
        <p className="muted" style={{ padding: "2rem" }}>Loading committees…</p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat-card">
              <p>Total Committees</p>
              <strong>{committees.length}</strong>
            </div>
            <div className="stat-card accent">
              <p>Standing / Select</p>
              <strong>{topLevel.length}</strong>
            </div>
            <div className="stat-card">
              <p>Subcommittees</p>
              <strong>{subcommittees.length}</strong>
            </div>
            <div className="stat-card">
              <p>House</p>
              <strong>{committees.filter(c => c.chamber === "House").length}</strong>
            </div>
            <div className="stat-card">
              <p>Senate</p>
              <strong>{committees.filter(c => c.chamber === "Senate").length}</strong>
            </div>
          </div>

          <section className="panel full">
            <header className="panel-head">
              <h2>All Committees</h2>
              <span className="muted">{committees.length} total</span>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Committee</th>
                    <th>Chamber</th>
                    <th>Type</th>
                    <th>Parent</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {committees.map((c, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        <span className={`chamber-badge ${c.chamber === "Senate" ? "senate" : "house"}`}>
                          {c.chamber || "Joint"}
                        </span>
                      </td>
                      <td>
                        <span className="muted">{c.type || "—"}</span>
                      </td>
                      <td>
                        <span className="muted small">{c.parent || "—"}</span>
                      </td>
                      <td>
                        <code className="sys-code">{c.systemCode}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
