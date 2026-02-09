import { useEffect, useState } from "react";
import { getPoliticians } from "../api.js";

export default function Politicians({ onPoliticianClick }) {
  const [dems, setDems] = useState([]);
  const [reps, setReps] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPoliticians().then(d => {
      setDems(d.democrats || []);
      setReps(d.republicans || []);
    }).catch(() => {});
  }, []);

  const filter = list =>
    search
      ? list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : list;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Politicians</h1>
          <span className="source-badge live">LIVE from GovTrack</span>
        </div>
        <input
          className="search-input"
          placeholder="Search politicians..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="two-col">
        <section className="panel">
          <header className="panel-head">
            <h2>Democrats</h2>
            <span className="muted">see all →</span>
          </header>
          <div className="pol-list">
            {filter(dems).map((p, i) => (
              <div key={p.name + i} className="pol-row" onClick={() => onPoliticianClick?.(p.name)}>
                {p.photo
                  ? <img className="avatar-img" src={p.photo} alt="" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  : null}
                <div className="avatar dem" style={p.photo ? {display:'none'} : {}}>{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                <div className="pol-info">
                  <span className="pol-name">{p.name}</span>
                  <span className="muted small">{p.chamber}{p.state ? ` · ${p.state}` : ""}</span>
                </div>
                {p.trades != null ? (
                  <div className="trade-count">
                    <strong>{p.trades.toLocaleString()}</strong>
                    <span className="muted small">Recorded Trades</span>
                  </div>
                ) : (
                  <div className="trade-count">
                    <span className="muted small">{p.fullParty || p.party}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2>Republicans</h2>
            <span className="muted">see all →</span>
          </header>
          <div className="pol-list">
            {filter(reps).map((p, i) => (
              <div key={p.name + i} className="pol-row" onClick={() => onPoliticianClick?.(p.name)}>
                {p.photo
                  ? <img className="avatar-img" src={p.photo} alt="" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  : null}
                <div className="avatar rep" style={p.photo ? {display:'none'} : {}}>{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                <div className="pol-info">
                  <span className="pol-name">{p.name}</span>
                  <span className="muted small">{p.chamber}{p.state ? ` · ${p.state}` : ""}</span>
                </div>
                {p.trades != null ? (
                  <div className="trade-count">
                    <strong>{p.trades.toLocaleString()}</strong>
                    <span className="muted small">Recorded Trades</span>
                  </div>
                ) : (
                  <div className="trade-count">
                    <span className="muted small">{p.fullParty || p.party}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
