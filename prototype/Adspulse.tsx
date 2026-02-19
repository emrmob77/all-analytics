import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

function useWindowSize() {
  const [s, setS] = useState({ w: typeof window !== "undefined" ? window.innerWidth : 1400 });
  useEffect(() => {
    const fn = () => setS({ w: window.innerWidth });
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return s;
}

function AnimNum({ value, prefix = "", suffix = "", decimals = 0, duration = 1000 }) {
  const [d, setD] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / duration, 1);
      setD(+(((1 - Math.pow(1 - p, 3)) * value).toFixed(decimals)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{prefix}{decimals > 0 ? d.toFixed(decimals) : d.toLocaleString()}{suffix}</>;
}

/* ── Platform config ── */
const PLATFORMS = [
  { id: "all",       label: "All Platforms", color: "#1A73E8", bg: "#EAF1FB" },
  { id: "google",    label: "Google Ads",    color: "#1A73E8", bg: "#EAF1FB",
    icon: <svg viewBox="0 0 20 20" width="14" height="14"><path fill="#4285F4" d="M18.8 10.2c0-.65-.06-1.28-.17-1.88H10v3.56h4.94c-.21 1.14-.87 2.11-1.84 2.76v2.3h2.98c1.74-1.6 2.74-3.96 2.74-6.74z"/><path fill="#34A853" d="M10 19c2.48 0 4.56-.82 6.08-2.22l-2.98-2.3c-.82.55-1.86.88-3.1.88-2.38 0-4.4-1.61-5.12-3.77H1.8v2.37C3.32 16.98 6.44 19 10 19z"/><path fill="#FBBC05" d="M4.88 11.59A5.07 5.07 0 014.59 10c0-.55.1-1.09.29-1.59V5.04H1.8A9.01 9.01 0 001 10c0 1.45.35 2.82.97 4.04l2.9-2.45z"/><path fill="#EA4335" d="M10 4.48c1.34 0 2.54.46 3.49 1.37l2.62-2.62C14.55 1.74 12.47 1 10 1 6.44 1 3.32 3.02 1.8 5.96l3.08 2.45c.72-2.16 2.74-3.93 5.12-3.93z"/></svg> },
  { id: "meta",      label: "Meta Ads",      color: "#0866FF", bg: "#EBF3FF",
    icon: <svg viewBox="0 0 20 20" width="14" height="14"><path fill="#0866FF" d="M10 2C5.58 2 2 5.58 2 10c0 4.16 3.05 7.6 7.03 8.24v-5.83H6.9V10h2.13V8.17c0-2.1 1.25-3.25 3.16-3.25.92 0 1.87.16 1.87.16v2.06h-1.05c-1.04 0-1.36.64-1.36 1.3V10h2.31l-.37 2.41h-1.94v5.83C14.95 17.6 18 14.16 18 10c0-4.42-3.58-8-8-8z"/></svg> },
  { id: "tiktok",    label: "TikTok Ads",    color: "#161823", bg: "#F5F5F5",
    icon: <svg viewBox="0 0 20 20" width="14" height="14"><path fill="#161823" d="M16.3 5.6a4 4 0 01-3.14-3.55V2h-2.88v11.4a2.41 2.41 0 01-2.4 2.08 2.41 2.41 0 01-2.4-2.41 2.41 2.41 0 012.4-2.41c.23 0 .45.04.66.09V7.83a6.27 6.27 0 00-.66-.04A5.28 5.28 0 002.6 13.1 5.28 5.28 0 007.88 18.4a5.28 5.28 0 005.27-5.28V7.46a6.84 6.84 0 003.99 1.28V5.89a4.03 4.03 0 01-.84-.29z"/></svg> },
  { id: "pinterest", label: "Pinterest",     color: "#E60023", bg: "#FFF0F1",
    icon: <svg viewBox="0 0 20 20" width="14" height="14"><path fill="#E60023" d="M10 2C5.58 2 2 5.58 2 10c0 3.53 2.2 6.55 5.3 7.76-.07-.66-.14-1.67.03-2.39.15-.65.98-4.14.98-4.14s-.25-.5-.25-1.24c0-1.16.67-2.02 1.51-2.02.71 0 1.05.53 1.05 1.17 0 .72-.46 1.79-.69 2.78-.2.83.42 1.5 1.23 1.5 1.48 0 2.61-1.56 2.61-3.8 0-1.99-1.43-3.38-3.47-3.38-2.36 0-3.75 1.77-3.75 3.6 0 .71.27 1.48.62 1.9.07.08.08.15.06.24-.06.26-.2.83-.23.94-.04.15-.13.18-.29.11-1.04-.49-1.69-2-1.69-3.23 0-2.63 1.91-5.04 5.51-5.04 2.89 0 5.14 2.06 5.14 4.82 0 2.87-1.81 5.18-4.33 5.18-.85 0-1.64-.44-1.91-.96l-.52 1.98c-.19.72-.7 1.63-1.04 2.18.78.24 1.61.37 2.47.37 4.42 0 8-3.58 8-8s-3.58-8-8-8z"/></svg> },
];

/* ── Data ── */
const days30 = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  google:    Math.round(3200 + Math.sin(i * 0.4) * 800 + Math.random() * 300),
  meta:      Math.round(2800 + Math.cos(i * 0.35) * 700 + Math.random() * 300),
  tiktok:    Math.round(1900 + Math.sin(i * 0.5 + 1) * 600 + Math.random() * 250),
  pinterest: Math.round(900  + Math.cos(i * 0.6 + 2) * 300 + Math.random() * 150),
}));

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}h`, ctr: +(0.8 + Math.sin(i * 0.5) * 0.6 + Math.random() * 0.3).toFixed(2),
}));

const campaigns = [
  { name: "Summer Sale 2025",    platform: "google",   status: "active", budget: 5000, spend: 3241, impr: 842000,  clicks: 14200, ctr: 1.69, conv: 412, roas: 4.2 },
  { name: "Brand Awareness Q3",  platform: "meta",     status: "active", budget: 3500, spend: 2890, impr: 1240000, clicks: 18600, ctr: 1.50, conv: 290, roas: 3.8 },
  { name: "Product Launch Reel", platform: "tiktok",   status: "active", budget: 2000, spend: 1750, impr: 2100000, clicks: 42000, ctr: 2.00, conv: 185, roas: 5.1 },
  { name: "Holiday Pins",        platform: "pinterest",status: "paused", budget: 1200, spend: 890,  impr: 320000,  clicks: 5200,  ctr: 1.63, conv: 98,  roas: 2.9 },
  { name: "Retargeting — Cart",  platform: "google",   status: "active", budget: 2500, spend: 2100, impr: 420000,  clicks: 9800,  ctr: 2.33, conv: 320, roas: 6.8 },
  { name: "Influencer Collab",   platform: "tiktok",   status: "draft",  budget: 4000, spend: 0,    impr: 0,       clicks: 0,     ctr: 0,    conv: 0,   roas: 0   },
  { name: "Spring Collection",   platform: "meta",     status: "active", budget: 3000, spend: 2450, impr: 980000,  clicks: 15700, ctr: 1.60, conv: 275, roas: 4.5 },
  { name: "Discovery Ads",       platform: "pinterest",status: "active", budget: 1500, spend: 1100, impr: 460000,  clicks: 7600,  ctr: 1.65, conv: 142, roas: 3.4 },
];

const statusStyle = {
  active: { bg: "#E6F4EA", color: "#137333", dot: "#34A853" },
  paused: { bg: "#FEF7E0", color: "#B06000", dot: "#F9AB00" },
  draft:  { bg: "#F1F3F4", color: "#5F6368", dot: "#9AA0A6" },
};

const NAV_ITEMS = [
  { id: "overview",   label: "Overview" },
  { id: "campaigns",  label: "Campaigns", badge: 8 },
  { id: "adgroups",   label: "Ad Groups" },
  { id: "audiences",  label: "Audiences" },
  { id: "keywords",   label: "Keywords" },
  { id: "creatives",  label: "Ads & Creatives" },
  { id: "budget",     label: "Budget & Billing" },
  { id: "reports",    label: "Reports" },
  { id: "settings",   label: "Settings" },
];

/* ── Stat Card ── */
function StatCard({ label, value, prefix, suffix, decimals, change, positive, sub, delay }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      flex: "1 1 150px", background: "#fff", borderRadius: 10,
      border: "1px solid #E3E8EF", padding: "16px 18px", minWidth: 0,
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(7px)",
      transition: "all 0.45s cubic-bezier(.16,1,.3,1)",
    }}>
      <div style={{ fontSize: 11.5, color: "#5F6368", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#202124", letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 8 }}>
        <AnimNum value={value} prefix={prefix||""} suffix={suffix||""} decimals={decimals||0} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
        <span style={{ color: positive ? "#137333" : "#C5221F", fontWeight: 600 }}>
          {positive ? "↑" : "↓"} {change}
        </span>
        <span style={{ color: "#9AA0A6" }}>{sub}</span>
      </div>
    </div>
  );
}

/* ══════════════ MAIN ══════════════ */
export default function AdDashboard() {
  const { w } = useWindowSize();
  const isMobile  = w < 768;
  const isDesktop = w >= 1100;

  const [activeNav, setActiveNav]           = useState("overview");
  const [activePlatform, setActivePlatform] = useState("all");
  const [dateRange, setDateRange]           = useState("30d");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sortCol, setSortCol]               = useState("spend");

  const filtered = activePlatform === "all" ? campaigns : campaigns.filter(r => r.platform === activePlatform);
  const plColor  = { google: "#1A73E8", meta: "#0866FF", tiktok: "#161823", pinterest: "#E60023", all: "#1A73E8" };
  const activeColor = plColor[activePlatform] || "#1A73E8";

  /* ── Sidebar ── */
  const SidebarContent = () => (
    <aside style={{ width: "100%", height: "100%", background: "#FAFAFA", borderRight: "1px solid #E3E8EF", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      {/* Logo */}
      <div style={{ padding: "18px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#202124" }}>AdsPulse</span>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5F6368", display: "flex", padding: 4 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4L4 12"/></svg>
          </button>
        )}
      </div>

      {/* Account */}
      <div style={{ margin: "0 12px 14px", padding: "9px 11px", borderRadius: 9, background: "#fff", border: "1px solid #E3E8EF", display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#FBBC05", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>A</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#202124" }}>Acme Corp</div>
          <div style={{ fontSize: 10.5, color: "#9AA0A6" }}>4 ad accounts</div>
        </div>
        <svg width="12" height="12" fill="none" stroke="#9AA0A6" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4l4 4 4-4"/></svg>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9AA0A6", letterSpacing: 1, textTransform: "uppercase", padding: "4px 8px 8px" }}>Menu</div>
        {NAV_ITEMS.map(n => {
          const isA = activeNav === n.id;
          return (
            <button key={n.id} onClick={() => { setActiveNav(n.id); if (isMobile) setSidebarOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "7px 10px", borderRadius: 8,
              border: isA ? "1px solid #D2E3FC" : "1px solid transparent",
              background: isA ? "#E8F0FE" : "transparent",
              color: isA ? "#1A73E8" : "#5F6368",
              fontSize: 13, fontWeight: isA ? 600 : 400, cursor: "pointer",
              fontFamily: "inherit", textAlign: "left", marginBottom: 1,
              transition: "all 0.14s",
            }}>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && <span style={{ background: isA ? "#1A73E8" : "#E3E8EF", color: isA ? "#fff" : "#5F6368", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 6px" }}>{n.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Connected platforms */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #E3E8EF" }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9AA0A6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Connected</div>
        <div style={{ display: "flex", gap: 6 }}>
          {PLATFORMS.slice(1).map(p => (
            <div key={p.id} title={p.label} style={{ width: 28, height: 28, borderRadius: 7, background: "#fff", border: "1px solid #E3E8EF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {p.icon}
            </div>
          ))}
        </div>
      </div>

      {/* User */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #E3E8EF", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>JD</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#202124" }}>John Doe</div>
          <div style={{ fontSize: 10.5, color: "#9AA0A6" }}>Admin</div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body, #root { height:100%; width:100%; }
        * { scrollbar-width:none !important; }
        *::-webkit-scrollbar { display:none !important; }
        .mscroll { scrollbar-width:thin !important; scrollbar-color:#E3E8EF transparent !important; }
        .mscroll::-webkit-scrollbar { display:block !important; width:4px !important; }
        .mscroll::-webkit-scrollbar-thumb { background:#E3E8EF !important; border-radius:3px !important; }
        .trow:hover { background:#F8FBFF !important; }
        .navbtn:hover { background:#F1F3F4 !important; color:#202124 !important; }
      `}</style>

      <div style={{ fontFamily: "'Roboto', -apple-system, sans-serif", width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#E8EAED", padding: isMobile ? 0 : 14 }}>
        <div style={{ width: "100%", maxWidth: 1500, height: isMobile ? "100vh" : "calc(100vh - 28px)", display: "flex", borderRadius: isMobile ? 0 : 14, overflow: "hidden", boxShadow: isMobile ? "none" : "0 4px 32px rgba(0,0,0,.12)" }}>

          {/* Sidebar desktop */}
          {!isMobile && <div style={{ width: 220, minWidth: 220, flexShrink: 0 }}><SidebarContent /></div>}

          {/* Mobile drawer */}
          {isMobile && (
            <>
              <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 998, opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "auto" : "none", transition: "opacity .22s" }} />
              <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 248, zIndex: 999, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform .28s cubic-bezier(.16,1,.3,1)" }}>
                <SidebarContent />
              </div>
            </>
          )}

          {/* Main */}
          <div className="mscroll" style={{ flex: 1, overflowY: "auto", background: "#F8F9FA", overflowX: "hidden" }}>
            <div style={{ padding: isMobile ? "14px 14px 28px" : "22px 24px 32px", maxWidth: 1280 }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isMobile && (
                    <button onClick={() => setSidebarOpen(true)} style={{ background: "#fff", border: "1px solid #E3E8EF", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" stroke="#5F6368" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
                    </button>
                  )}
                  <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: "#202124", letterSpacing: -0.3 }}>Campaign Overview</h1>
                    <p style={{ fontSize: 12, color: "#9AA0A6", marginTop: 2 }}>All platforms · Updated just now</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* Date range */}
                  <div style={{ display: "flex", background: "#fff", border: "1px solid #E3E8EF", borderRadius: 8, overflow: "hidden" }}>
                    {["7d","30d","90d"].map((d, i) => (
                      <button key={d} onClick={() => setDateRange(d)} style={{
                        padding: "6px 13px", border: "none",
                        borderLeft: i > 0 ? "1px solid #E3E8EF" : "none",
                        background: dateRange === d ? "#E8F0FE" : "#fff",
                        color: dateRange === d ? "#1A73E8" : "#5F6368",
                        fontSize: 12, fontWeight: dateRange === d ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s",
                      }}>{d}</button>
                    ))}
                  </div>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #E3E8EF", background: "#fff", color: "#5F6368", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="2" width="11" height="10" rx="1.5"/><path d="M1 5h11M4 1v2M8 1v2"/></svg>
                    {!isMobile && "Jun 1 – Jun 30"}
                  </button>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: "#1A73E8", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    + New Campaign
                  </button>
                </div>
              </div>

              {/* Platform tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setActivePlatform(p.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                    border: activePlatform === p.id ? `1.5px solid ${p.color}` : "1.5px solid #E3E8EF",
                    background: activePlatform === p.id ? p.bg : "#fff",
                    color: activePlatform === p.id ? p.color : "#5F6368",
                    fontSize: 12, fontWeight: activePlatform === p.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s",
                  }}>
                    {p.id !== "all" && p.icon}
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Stat cards */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <StatCard label="Total Impressions" value={5962000} change="12.4%" positive sub="vs last period" delay={0} />
                <StatCard label="Total Clicks"      value={105300}  change="8.7%"  positive sub="vs last period" delay={70} />
                <StatCard label="Total Spend"       value={10471}   prefix="$"   change="5.2%"  positive sub="vs last period" delay={140} />
                <StatCard label="Avg. CTR"          value={1.77}    suffix="%"   decimals={2} change="0.3%" positive sub="vs last period" delay={210} />
                <StatCard label="Conversions"       value={1722}    change="18.1%" positive sub="vs last period" delay={280} />
                <StatCard label="Avg. ROAS"         value={4.58}    suffix="x"   decimals={2} change="2.1%" positive sub="vs last period" delay={350} />
              </div>

              {/* Charts */}
              <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: isDesktop ? "nowrap" : "wrap" }}>
                {/* Area chart */}
                <div style={{ flex: "2 1 380px", background: "#fff", borderRadius: 10, border: "1px solid #E3E8EF", padding: "18px 20px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>Performance Trend</div>
                      <div style={{ fontSize: 11.5, color: "#9AA0A6", marginTop: 2 }}>Impressions · {dateRange === "7d" ? "Last 7 days" : "Last 30 days"}</div>
                    </div>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, border: "1px solid #E3E8EF", background: "#fff", color: "#5F6368", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h8M4 8h4M6 12h0"/></svg>
                      Filter
                    </button>
                  </div>
                  <div style={{ height: isMobile ? 175 : 215 }}>
                    <ResponsiveContainer>
                      {activePlatform === "all" ? (
                        <AreaChart data={days30.slice(0, dateRange === "7d" ? 7 : 30)} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                          <defs>
                            {[["google","#1A73E8"],["meta","#0866FF"],["tiktok","#161823"],["pinterest","#E60023"]].map(([pl, c]) => (
                              <linearGradient key={pl} id={`gr-${pl}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={c} stopOpacity={0.18}/>
                                <stop offset="95%" stopColor={c} stopOpacity={0}/>
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9AA0A6" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9AA0A6" }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E3E8EF", boxShadow: "0 2px 8px rgba(0,0,0,.08)", fontSize: 11.5 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {[["google","#1A73E8"],["meta","#0866FF"],["tiktok","#161823"],["pinterest","#E60023"]].map(([pl, c]) => (
                            <Area key={pl} type="monotone" dataKey={pl} name={pl.charAt(0).toUpperCase()+pl.slice(1)} stroke={c} strokeWidth={2} fill={`url(#gr-${pl})`} dot={false} animationDuration={700} />
                          ))}
                        </AreaChart>
                      ) : (
                        <AreaChart data={days30.slice(0, dateRange === "7d" ? 7 : 30)} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grActive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={activeColor} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9AA0A6" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9AA0A6" }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E3E8EF", boxShadow: "0 2px 8px rgba(0,0,0,.08)", fontSize: 11.5 }} />
                          <Area type="monotone" dataKey={activePlatform} name={PLATFORMS.find(p=>p.id===activePlatform)?.label} stroke={activeColor} strokeWidth={2} fill="url(#grActive)" dot={false} animationDuration={700} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar chart */}
                <div style={{ flex: "1 1 240px", background: "#fff", borderRadius: 10, border: "1px solid #E3E8EF", padding: "18px 20px", minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#202124", marginBottom: 3 }}>CTR by Hour</div>
                  <div style={{ fontSize: 11.5, color: "#9AA0A6", marginBottom: 14 }}>Average across all platforms</div>
                  <div style={{ height: isMobile ? 155 : 215 }}>
                    <ResponsiveContainer>
                      <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />
                        <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#9AA0A6" }} interval={3} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#9AA0A6" }} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E3E8EF", fontSize: 11.5 }} />
                        <Bar dataKey="ctr" name="CTR %" fill="#1A73E8" radius={[3, 3, 0, 0]} animationDuration={700} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Platform breakdown */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E3E8EF", padding: "18px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#202124", marginBottom: 16 }}>Platform Summary</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {PLATFORMS.slice(1).map((p, pi) => {
                    const rows = campaigns.filter(r => r.platform === p.id);
                    const totalSpend = rows.reduce((a, r) => a + r.spend, 0);
                    const totalConv  = rows.reduce((a, r) => a + r.conv, 0);
                    const totalImpr  = rows.reduce((a, r) => a + r.impr, 0);
                    const avgRoas    = rows.filter(r=>r.roas>0).length ? (rows.reduce((a,r)=>a+r.roas,0)/rows.filter(r=>r.roas>0).length).toFixed(1) : "—";
                    const pct        = Math.round(totalSpend / 10471 * 100);
                    return (
                      <div key={p.id} style={{ flex: "1 1 190px", padding: "14px 16px", borderRadius: 9, border: `1px solid ${p.color}30`, background: p.bg, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                          {p.icon}
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#202124" }}>{p.label}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                          {[["Spend", `$${totalSpend.toLocaleString()}`], ["Conv.", totalConv], ["Impr.", `${(totalImpr/1000).toFixed(0)}K`], ["ROAS", `${avgRoas}x`]].map(([l,v]) => (
                            <div key={l}>
                              <div style={{ fontSize: 9.5, color: "#9AA0A6" }}>{l}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginTop: 1 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#9AA0A6", marginBottom: 5 }}>
                          <span>Budget share</span>
                          <span style={{ color: p.color, fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "#fff", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: p.color, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaigns table */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E3E8EF", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F3F4", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>Campaigns</div>
                    <div style={{ fontSize: 11.5, color: "#9AA0A6", marginTop: 1 }}>{filtered.length} campaigns · {PLATFORMS.find(p=>p.id===activePlatform)?.label}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E3E8EF", background: "#fff", color: "#5F6368", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3h10M3 7h6M5 11h2"/></svg>
                      Filter
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E3E8EF", background: "#fff", color: "#5F6368", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 1v7M3 5l3 3 3-3M1 10h10"/></svg>
                      Export
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: "#F8F9FA" }}>
                        {[
                          { k: "name", l: "Campaign" }, { k: "platform", l: "Platform" }, { k: "status", l: "Status" },
                          { k: "impr", l: "Impressions" }, { k: "clicks", l: "Clicks" }, { k: "ctr", l: "CTR" },
                          { k: "spend", l: "Spend / Budget" }, { k: "conv", l: "Conv." }, { k: "roas", l: "ROAS" },
                        ].map(col => (
                          <th key={col.k} onClick={() => setSortCol(col.k)} style={{
                            padding: "9px 14px", textAlign: "left", fontWeight: 500, fontSize: 11,
                            color: sortCol === col.k ? "#1A73E8" : "#5F6368",
                            borderBottom: "1px solid #E3E8EF", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
                          }}>
                            {col.l} {sortCol === col.k && "↓"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.sort((a, b) => b[sortCol] > a[sortCol] ? 1 : -1).map((row, i) => {
                        const ss  = statusStyle[row.status];
                        const pl  = PLATFORMS.find(p => p.id === row.platform);
                        const pct = row.budget > 0 ? Math.round(row.spend / row.budget * 100) : 0;
                        const barC = pct > 90 ? "#C5221F" : pct > 70 ? "#B06000" : "#1A73E8";
                        return (
                          <tr key={i} className="trow" style={{ background: "#fff", cursor: "pointer" }}>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4", minWidth: 170 }}>
                              <div style={{ fontWeight: 500, color: "#202124" }}>{row.name}</div>
                            </td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: pl?.bg, fontSize: 11, fontWeight: 500, color: pl?.color, border: `1px solid ${pl?.color}30` }}>
                                {pl?.icon} {pl?.label.split(" ")[0]}
                              </span>
                            </td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 5, textTransform: "capitalize" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                                {row.status}
                              </span>
                            </td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4", color: "#5F6368" }}>{row.impr > 0 ? (row.impr/1000).toFixed(0)+"K" : "—"}</td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4", color: "#5F6368" }}>{row.clicks > 0 ? row.clicks.toLocaleString() : "—"}</td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4", color: "#5F6368" }}>{row.ctr > 0 ? row.ctr+"%" : "—"}</td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4", minWidth: 140 }}>
                              {row.spend > 0 ? (
                                <>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4, color: "#202124" }}>
                                    <span style={{ fontWeight: 500 }}>${row.spend.toLocaleString()}</span>
                                    <span style={{ color: "#9AA0A6" }}>/ ${row.budget.toLocaleString()}</span>
                                  </div>
                                  <div style={{ height: 4, borderRadius: 2, background: "#F1F3F4" }}>
                                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: barC, transition: "width .5s" }} />
                                  </div>
                                </>
                              ) : <span style={{ color: "#E3E8EF" }}>Not started</span>}
                            </td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4", color: "#202124", fontWeight: row.conv > 0 ? 500 : 400 }}>{row.conv > 0 ? row.conv : "—"}</td>
                            <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F3F4" }}>
                              {row.roas > 0 ? (
                                <span style={{ fontWeight: 700, color: row.roas >= 5 ? "#137333" : row.roas >= 3 ? "#B06000" : "#C5221F" }}>
                                  {row.roas}x
                                </span>
                              ) : <span style={{ color: "#E3E8EF" }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
