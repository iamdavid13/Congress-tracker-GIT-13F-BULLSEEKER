import { useEffect, useState } from "react";
import { getTrades } from "../api.js";

export default function PoliticalFlow({ onPoliticianClick }) {
  const [trades, setTrades] = useState([]);
  const [polQ, setPolQ] = useState("");

  useEffect(() => { load(); }, []);

  function load() {
    const p = new URLSearchParams({ limit: 50 });
    if (polQ) p.set("politician", polQ);
    getTrades(p.toString()).then(d => setTrades(d.trades || [])).catch(() => {});
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Politics Flow</h1>
        <div className="flow-controls">
          <input className="search-input" placeholder="Search Politicians" value={polQ}
            onChange={e => setPolQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()} />
          <button className="btn-accent" onClick={load}>▶ Live Flow</button>
        </div>
      </div>

      <section className="panel full">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Asset</th>
                <th>Amounts ↕</th>
                <th>Trade Date ↕</th>
                <th>Disclosure Date ↕</th>
                <th>Chamber</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id}>
                  <td><button className="pol-name-link accent-text" onClick={() => onPoliticianClick?.(t.politician)}>{t.politician}</button></td>
                  <td>
                    <span className="ticker-link">{t.ticker}</span>
                    <span className="muted small">{t.asset}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${t.type === "Purchase" ? "buy" : "sell"}`}>
                      {t.type === "Purchase" ? "BUY" : "SELL"}
                    </span>
                    {" "}{t.amount}
                  </td>
                  <td>{t.tradeDate}</td>
                  <td>{t.filedDate}</td>
                  <td>{t.chamber} | {t.party === "D" ? "Democrat" : "Republican"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
