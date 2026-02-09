import { useEffect, useState } from "react";
import { getSpending } from "../api.js";

function fmt(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function abbrev(name) {
  if (!name) return "?";
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

export default function GovSpending() {
  const [contracts, setContracts] = useState([]);
  const [topRecipients, setTopRecipients] = useState([]);

  useEffect(() => {
    getSpending().then(d => {
      setContracts(d.contracts || []);
      setTopRecipients(d.topRecipients || []);
    }).catch(() => {});
  }, []);

  const maxBar = topRecipients.length ? topRecipients[0].total : 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Government Spending</h1>
          <p className="sub">We use the <span className="accent-text">usaspending.gov</span> API to track government contracts to publicly traded companies</p>
          <span className="source-badge live">LIVE from USASpending.gov</span>
        </div>
        <button className="btn-outline">Export Data</button>
      </div>

      <section className="panel full">
        <header className="panel-head">
          <h2>Biggest Recipients (Last 90D)</h2>
        </header>
        <div className="bar-chart">
          {topRecipients.slice(0, 12).map((r, i) => (
            <div key={r.recipient + i} className="bar-item">
              <div className="bar" style={{
                height: `${(r.total / maxBar) * 200}px`,
                background: `hsl(${140 + i * 18}, 70%, ${55 - i * 2}%)`
              }}></div>
              <span className="bar-label">{abbrev(r.recipient)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel full">
        <header className="panel-head">
          <h2>Recent Contracts</h2>
        </header>
        <div className="spending-cards">
          {contracts.map(c => (
            <div key={c.id || c.awardId} className="spending-card">
              <div className="spending-card-icon">
                <span>{abbrev(c.recipient)}</span>
              </div>
              <div className="spending-card-body">
                <p className="spending-headline">
                  {c.department} <span className="muted">paid</span> <strong>{c.recipient}</strong>
                </p>
                <p className="muted small">{c.date}{c.awardId ? ` – ${c.awardId}` : ""}</p>
                <p className="muted small">{c.description}</p>
              </div>
              <div className="spending-amount">{fmt(c.amount)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
