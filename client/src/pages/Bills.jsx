import { useEffect, useState } from "react";
import { getBills } from "../api.js";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [chamber, setChamber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (chamber) params.set("chamber", chamber);
    getBills(params.toString())
      .then(d => setBills(d.bills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, chamber]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bills & Legislation</h1>
          <p className="sub">Latest congressional bills from Congress.gov</p>
        </div>
        <span className="live-badge"><span className="dot"></span> LIVE from Congress.gov</span>
      </div>

      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search bills by title or number…"
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
        <p className="muted" style={{ padding: "2rem" }}>Loading bills…</p>
      ) : bills.length === 0 ? (
        <p className="muted" style={{ padding: "2rem" }}>No bills found.</p>
      ) : (
        <section className="panel full">
          <header className="panel-head">
            <h2>Recent Bills</h2>
            <span className="muted">{bills.length} shown</span>
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Title</th>
                  <th>Chamber</th>
                  <th>Latest Action</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b, i) => (
                  <tr key={i}>
                    <td>
                      <span className="ticker">{b.number}</span>
                      <span className="muted small">Congress {b.congress}</span>
                    </td>
                    <td style={{ maxWidth: "420px" }}>
                      <span className="bill-title">{b.title}</span>
                    </td>
                    <td>
                      <span className={`chamber-badge ${b.chamber === "Senate" ? "senate" : "house"}`}>
                        {b.chamber}
                      </span>
                    </td>
                    <td>
                      <span className="muted small">{b.latestAction}</span>
                    </td>
                    <td>{b.actionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
