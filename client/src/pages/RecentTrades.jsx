import { useEffect, useState } from "react";
import { getTrades } from "../api.js";

export default function RecentTrades({ onPoliticianClick }) {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    getTrades("limit=12").then(d => setTrades(d.trades || [])).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Recent Trades</h1>
          <p className="sub">Latest congressional stock transactions</p>
        </div>
        <button className="btn-outline">View Dataset</button>
      </div>

      <section className="panel full">
        <div className="trade-cards">
          {trades.map(t => (
            <div key={t.id} className="trade-card">
              <div className="trade-card-left">
                <div className={`ticker-box ${t.ticker !== "--" ? "" : "neutral"}`}>
                  {t.ticker !== "--" ? t.ticker.slice(0, 4) : "—"}
                </div>
                <div>
                  <strong>{t.ticker}</strong>
                  <span className="muted small">{t.asset}</span>
                </div>
              </div>
              <div className="trade-card-mid">
                <div className="pol-cell">
                  <div className={`avatar sm ${t.party === "D" ? "dem" : "rep"}`}>
                    {t.politician.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <button className="pol-name-link" onClick={() => onPoliticianClick?.(t.politician)}>{t.politician}</button>
                    <span className="muted small">{t.chamber} ({t.party})</span>
                  </div>
                </div>
              </div>
              <div className="trade-card-type">
                <span className={t.type === "Purchase" ? "green" : "red"}>{t.type}</span>
                <span className="muted small">{t.amount}</span>
              </div>
              <div className="trade-card-dates">
                <strong>{new Date(t.filedDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</strong>
                <span className="muted small">Traded: {new Date(t.tradeDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
