import { useEffect, useState } from "react";
import { getTrades } from "../api.js";

export default function CongressTrading({ onPoliticianClick }) {
  const [trades, setTrades] = useState([]);
  const [total, setTotal] = useState(0);
  const [tickerQ, setTickerQ] = useState("");
  const [polQ, setPolQ] = useState("");

  useEffect(() => {
    load();
  }, []);

  function load() {
    const params = new URLSearchParams({ limit: 50 });
    if (tickerQ) params.set("ticker", tickerQ);
    if (polQ) params.set("politician", polQ);
    getTrades(params.toString()).then(d => {
      setTrades(d.trades || []);
      setTotal(d.total || 0);
    }).catch(() => {});
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Congress Trading</h1>
        <span className="muted">{total} trades</span>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Search by ticker..." value={tickerQ}
          onChange={e => setTickerQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()} />
        <input className="search-input" placeholder="Search by politician..." value={polQ}
          onChange={e => setPolQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()} />
        <button className="btn-accent" onClick={load}>Filter</button>
      </div>

      <section className="panel full">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Transaction</th>
                <th>Politician</th>
                <th>Filed</th>
                <th>Traded</th>
                <th>Description</th>
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
                    <span className={`type-badge ${t.type === "Purchase" ? "buy" : "sell"}`}>{t.type}</span>
                    <span className="muted small">{t.amount}</span>
                  </td>
                  <td>
                    <div className="pol-cell">
                      <div className={`avatar sm ${t.party === "D" ? "dem" : "rep"}`}>
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
                  <td className="muted small">{t.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
