import { useEffect, useState } from "react";
import { getTrades } from "../api.js";

export default function InsiderTrades({ onPoliticianClick }) {
  const [trades, setTrades] = useState([]);
  const [tickerQ, setTickerQ] = useState("");
  const [polQ, setPolQ] = useState("");

  useEffect(() => { load(); }, []);

  function load() {
    const params = new URLSearchParams({ limit: 50 });
    if (tickerQ) params.set("ticker", tickerQ);
    if (polQ) params.set("politician", polQ);
    getTrades(params.toString()).then(d => setTrades(d.trades || [])).catch(() => {});
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>House &amp; Senate Trade History</h1>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Search for a ticker" value={tickerQ}
          onChange={e => setTickerQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()} />
        <input className="search-input" placeholder="Search for a politician" value={polQ}
          onChange={e => setPolQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()} />
        <button className="btn-accent" onClick={load}>Search</button>
      </div>

      <section className="panel full">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Symbol</th>
                <th>Trade Date</th>
                <th>Transaction Info</th>
                <th>Disclosure</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="pol-cell">
                      <div className={`avatar sm ${t.party === "D" ? "dem" : "rep"}`}>
                        {t.politician.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <button className="pol-name-link" onClick={() => onPoliticianClick?.(t.politician)}>{t.politician}</button>
                        <span className="muted small">{t.chamber} | {t.party === "D" ? "Democrat" : "Republican"} | {t.state}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="ticker-link">{t.ticker}</span>
                    <span className="muted small">{t.asset}</span>
                  </td>
                  <td>{t.tradeDate}</td>
                  <td>
                    <span className={`type-badge ${t.type === "Purchase" ? "buy" : "sell"}`}>{t.type === "Purchase" ? "BUY" : "SELL"}</span>
                    <span className="muted small">{t.amount}</span>
                    <span className="muted small">Filing Date: {t.filedDate}</span>
                  </td>
                  <td>
                    <span className="disclosure-icon">&#x2197;</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
