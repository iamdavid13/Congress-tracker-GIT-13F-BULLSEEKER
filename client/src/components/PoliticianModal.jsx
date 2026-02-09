import { useEffect, useState } from "react";
import { getPoliticianDetail } from "../api.js";

export default function PoliticianModal({ name, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trades");

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    getPoliticianDetail(name)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [name]);

  if (!name) return null;

  const pol = data?.politician;
  const trades = data?.trades || [];
  const bio = data?.bio;

  const partyLabel = pol?.party === "D" ? "democrat" : pol?.party === "R" ? "republican" : (pol?.fullParty || "");
  const districtLabel = pol?.district ? `${pol.state}-${pol.district}` : pol?.state || "";
  const chamberLabel = pol?.chamber?.toLowerCase() || "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {loading ? (
          <div className="modal-loading">
            <p className="muted">Loading politician data…</p>
          </div>
        ) : !pol ? (
          <div className="modal-loading">
            <p className="muted">Politician not found.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header">
              {pol.photo ? (
                <img
                  className="modal-avatar"
                  src={pol.photo}
                  alt={pol.name}
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : null}
              <h1 className="modal-name">{pol.name}</h1>
              <p className="modal-meta">
                {chamberLabel}{chamberLabel && partyLabel ? " | " : ""}{partyLabel}{districtLabel ? ` | ${districtLabel}` : ""}
              </p>
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              <button
                className={`modal-tab${tab === "trades" ? " active" : ""}`}
                onClick={() => setTab("trades")}
              >
                recent trades
              </button>
              <button
                className={`modal-tab${tab === "positions" ? " active" : ""}`}
                onClick={() => setTab("positions")}
              >
                position performance
              </button>
              <button
                className={`modal-tab${tab === "bio" ? " active" : ""}`}
                onClick={() => setTab("bio")}
              >
                biography
              </button>
            </div>

            {/* Bio section */}
            {bio && tab === "bio" && (
              <div className="modal-bio">
                <p>{bio}</p>
              </div>
            )}
            {tab === "bio" && !bio && (
              <div className="modal-bio">
                <p className="muted">No biography available for {pol.name}.</p>
              </div>
            )}

            {/* Trades Table */}
            {tab === "trades" && (
              <div className="modal-trades">
                {trades.length === 0 ? (
                  <p className="muted" style={{ padding: "2rem" }}>No trade records found for {pol.name}.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Reporter</th>
                          <th>Symbol</th>
                          <th>Trade Date</th>
                          <th>Transaction Info</th>
                          <th>Position</th>
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
                                  <span>{t.politician}</span>
                                  <span className="muted small">
                                    {t.chamber} | {t.party === "D" ? "Democrat" : "Republican"} | {t.state}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="ticker-link">{t.ticker}</span>
                              <span className="muted small">{t.asset}</span>
                            </td>
                            <td>{t.tradeDate}</td>
                            <td>
                              <span className={`type-badge ${t.type === "Purchase" ? "buy" : "sell"}`}>
                                {t.type === "Purchase" ? "BUY" : "SELL"}
                              </span>
                              <span className="muted small">{t.amount}</span>
                              <span className="muted small">Filing Date: {t.filedDate}</span>
                            </td>
                            <td>
                              <span className={`position-return ${t.positionReturn >= 0 ? "profit" : "loss"}`}>
                                {t.positionReturn >= 0 ? "▲" : "▼"} {Math.abs(t.positionReturn).toFixed(1)}%
                              </span>
                              <span className="muted small">{t.daysSinceTrade}d held</span>
                            </td>
                            <td>
                              <span className="disclosure-icon">&#x2197;</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Position Performance Table */}
            {tab === "positions" && (
              <div className="modal-trades">
                {trades.length === 0 ? (
                  <p className="muted" style={{ padding: "2rem" }}>No positions found.</p>
                ) : (
                  <>
                    <div className="position-summary">
                      <div className="stat-card accent">
                        <p>Total Positions</p>
                        <strong>{trades.length}</strong>
                      </div>
                      <div className="stat-card">
                        <p>Profitable</p>
                        <strong className="green">{trades.filter(t => t.effectiveReturn >= 0).length}</strong>
                      </div>
                      <div className="stat-card">
                        <p>Losing</p>
                        <strong className="red">{trades.filter(t => t.effectiveReturn < 0).length}</strong>
                      </div>
                      <div className="stat-card">
                        <p>Avg Return</p>
                        <strong className={avgReturn(trades) >= 0 ? "green" : "red"}>
                          {avgReturn(trades) >= 0 ? "+" : ""}{avgReturn(trades).toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Trade Date</th>
                            <th>Days Held</th>
                            <th>Position Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...trades]
                            .sort((a, b) => b.effectiveReturn - a.effectiveReturn)
                            .map(t => (
                              <tr key={t.id}>
                                <td>
                                  <span className="ticker-link">{t.ticker}</span>
                                  <span className="muted small">{t.asset}</span>
                                </td>
                                <td>
                                  <span className={`type-badge ${t.type === "Purchase" ? "buy" : "sell"}`}>
                                    {t.type === "Purchase" ? "BUY" : "SELL"}
                                  </span>
                                </td>
                                <td className="muted">{t.amount}</td>
                                <td>{t.tradeDate}</td>
                                <td>{t.daysSinceTrade}d</td>
                                <td>
                                  <span className={`position-return-lg ${t.effectiveReturn >= 0 ? "profit" : "loss"}`}>
                                    {t.effectiveReturn >= 0 ? "+" : ""}{t.effectiveReturn.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function avgReturn(trades) {
  if (!trades.length) return 0;
  return trades.reduce((s, t) => s + t.effectiveReturn, 0) / trades.length;
}
