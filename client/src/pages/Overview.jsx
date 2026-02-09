import { useEffect, useState } from "react";
import { getStats, getTrades } from "../api.js";

export default function Overview({ onPoliticianClick }) {
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    getTrades("limit=150").then(d => setTrades(d.trades || [])).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p className="sub">Real-time congressional trading activity at a glance.</p>
        </div>
        <span className="live-badge"><span className="dot"></span> Live — Politicians &amp; Spending</span>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <p>Total Trades</p>
          <strong>{stats?.totalTrades ?? "—"}</strong>
        </div>
        <div className="stat-card">
          <p>Politicians Tracked</p>
          <strong>{stats?.totalPoliticians ?? "—"}</strong>
        </div>
        <div className="stat-card accent">
          <p>Purchases</p>
          <strong>{stats?.purchases ?? "—"}</strong>
        </div>
        <div className="stat-card sell">
          <p>Sales</p>
          <strong>{stats?.sales ?? "—"}</strong>
        </div>
        <div className="stat-card">
          <p>Latest Filing</p>
          <strong>{stats?.latestFiling ?? "—"}</strong>
        </div>
      </div>

      <section className="panel full">
        <header className="panel-head">
          <h2>Recent Trades</h2>
          <span className="muted">{trades.length} shown</span>
        </header>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Transaction</th>
                <th>Politician</th>
                <th>Filed</th>
                <th>Traded</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id}>
                  <td>
                    <span className="ticker">{t.ticker}</span>
                    <span className="muted small">{t.asset}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${t.type === "Purchase" ? "buy" : "sell"}`}>
                      {t.type}
                    </span>
                    <span className="muted small">{t.amount}</span>
                  </td>
                  <td>
                    <div className="pol-cell">
                      <div className={`avatar ${t.party === "D" ? "dem" : "rep"}`}>
                        {t.politician.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <button className="pol-name-link" onClick={() => onPoliticianClick?.(t.politician)}>{t.politician}</button>
                        <span className="muted small">{t.chamber} / {t.party}</span>
                      </div>
                    </div>
                  </td>
                  <td>{t.filedDate}</td>
                  <td>{t.tradeDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
