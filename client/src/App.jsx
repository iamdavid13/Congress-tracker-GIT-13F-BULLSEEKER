import { useState } from "react";
import Overview from "./pages/Overview.jsx";
import Politicians from "./pages/Politicians.jsx";
import Bills from "./pages/Bills.jsx";
import Committees from "./pages/Committees.jsx";
import CongressTrading from "./pages/CongressTrading.jsx";
import InsiderTrades from "./pages/InsiderTrades.jsx";
import GovSpending from "./pages/GovSpending.jsx";
import PoliticalFlow from "./pages/PoliticalFlow.jsx";
import NetWorth from "./pages/NetWorth.jsx";
import PoliticianModal from "./components/PoliticianModal.jsx";

const NAV = [
  { id: "overview",    label: "Overview",        icon: "◉" },
  { id: "politicians", label: "Politicians",     icon: "👤" },
  { id: "bills",       label: "Bills",           icon: "📜" },
  { id: "committees",  label: "Committees",      icon: "🏛" },
  { id: "trading",     label: "Congress Trading", icon: "📊" },
  { id: "insider",     label: "Insider Trades",  icon: "🔍" },
  { id: "spending",    label: "Gov Spending",     icon: "💰" },
  { id: "flow",        label: "Political Flow",  icon: "⚡" },
  { id: "networth",    label: "Net Worth",       icon: "🏦" },
];

const PAGES = {
  overview: Overview,
  politicians: Politicians,
  bills: Bills,
  committees: Committees,
  trading: CongressTrading,
  insider: InsiderTrades,
  spending: GovSpending,
  flow: PoliticalFlow,
  networth: NetWorth,
};

export default function App() {
  const [active, setActive] = useState("overview");
  const [selectedPol, setSelectedPol] = useState(null);
  const Page = PAGES[active] || Overview;

  return (
    <div className="shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-dot"></span>
          <span className="brand-text">BullSeeker</span>
        </div>

        <ul className="nav-list">
          {NAV.map(n => (
            <li key={n.id}>
              <button
                className={`nav-btn${active === n.id ? " active" : ""}`}
                onClick={() => setActive(n.id)}
              >
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <p>Congress Tracker</p>
          <p className="muted small">v0.2 · Congress.gov + USASpending</p>
        </div>
      </nav>

      {/* Main content */}
      <main className="content">
        <Page onPoliticianClick={setSelectedPol} />
      </main>

      {selectedPol && (
        <PoliticianModal name={selectedPol} onClose={() => setSelectedPol(null)} />
      )}
    </div>
  );
}
