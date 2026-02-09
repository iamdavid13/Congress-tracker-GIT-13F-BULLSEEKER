import { useEffect, useState } from "react";
import { getNetWorth } from "../api.js";

function fmtMoney(n) {
  if (n >= 1e9) return `$ ${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `$ ${(n / 1e6).toFixed(2)} M`;
  return `$ ${n.toLocaleString()}`;
}

export default function NetWorth({ onPoliticianClick }) {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    getNetWorth().then(d => setRankings(d.rankings || [])).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header center">
        <div>
          <h1>Congress Live Net Worth Tracker</h1>
          <p className="sub">We used <span className="accent-text">our data on politicians' stock portfolios</span> to calculate live net worth estimates for members of Congress.</p>
        </div>
      </div>

      <section className="panel full">
        <div className="table-wrap">
          <table className="nw-table">
            <thead>
              <tr>
                <th></th>
                <th>Politician</th>
                <th>Current Net Worth (USD) ↕</th>
                <th>Daily Change (USD) ↕</th>
                <th>Daily % Change ↕</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={r.name}>
                  <td className="rank">{i + 1}</td>
                  <td>
                    <div className="pol-cell">
                      <div className={`avatar ${r.party === "D" ? "dem" : "rep"}`}>
                        {r.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <button className="pol-name-link" onClick={() => onPoliticianClick?.(r.name)}><strong>{r.name}</strong></button>
                        <span className="muted small">{r.chamber} – {r.party === "D" ? "Dem" : "Rep"}</span>
                        <span className="muted small">{r.state}</span>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{fmtMoney(r.netWorth)}</td>
                  <td className={r.dailyChange >= 0 ? "green" : "red"}>
                    {r.dailyChange >= 0 ? "+ " : "- "}{Math.abs(r.dailyChange).toFixed(2)}
                  </td>
                  <td className="muted">{r.dailyPct.toFixed(2)}%</td>
                  <td><button className="btn-outline sm">Live Portfolio</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
