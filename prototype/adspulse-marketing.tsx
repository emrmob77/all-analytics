// @ts-nocheck
import { useState, useEffect, useRef } from "react";

/* ── utils ── */
const cn = (...args: unknown[]) => args.filter(Boolean).join(" ");

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function useWindowSize() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function AnimNum({ to, prefix = "", suffix = "", decimals = 0 }) {
  const [v, setV] = useState(0);
  const [ref, inView] = useInView();
  const raf = useRef(null);
  useEffect(() => {
    if (!inView) return;
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / 1400, 1);
      setV(+(((1 - Math.pow(1 - p, 3)) * to).toFixed(decimals)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{decimals > 0 ? v.toFixed(decimals) : v.toLocaleString()}{suffix}</span>;
}

/* ── platform icons ── */
const GoogleIcon = () => <svg viewBox="0 0 20 20" width="18" height="18"><path fill="#4285F4" d="M18.8 10.2c0-.65-.06-1.28-.17-1.88H10v3.56h4.94c-.21 1.14-.87 2.11-1.84 2.76v2.3h2.98c1.74-1.6 2.74-3.96 2.74-6.74z"/><path fill="#34A853" d="M10 19c2.48 0 4.56-.82 6.08-2.22l-2.98-2.3c-.82.55-1.86.88-3.1.88-2.38 0-4.4-1.61-5.12-3.77H1.8v2.37C3.32 16.98 6.44 19 10 19z"/><path fill="#FBBC05" d="M4.88 11.59A5.07 5.07 0 014.59 10c0-.55.1-1.09.29-1.59V5.04H1.8A9.01 9.01 0 001 10c0 1.45.35 2.82.97 4.04l2.9-2.45z"/><path fill="#EA4335" d="M10 4.48c1.34 0 2.54.46 3.49 1.37l2.62-2.62C14.55 1.74 12.47 1 10 1 6.44 1 3.32 3.02 1.8 5.96l3.08 2.45c.72-2.16 2.74-3.93 5.12-3.93z"/></svg>;
const MetaIcon = () => <svg viewBox="0 0 20 20" width="18" height="18"><path fill="#0866FF" d="M10 2C5.58 2 2 5.58 2 10c0 4.16 3.05 7.6 7.03 8.24v-5.83H6.9V10h2.13V8.17c0-2.1 1.25-3.25 3.16-3.25.92 0 1.87.16 1.87.16v2.06h-1.05c-1.04 0-1.36.64-1.36 1.3V10h2.31l-.37 2.41h-1.94v5.83C14.95 17.6 18 14.16 18 10c0-4.42-3.58-8-8-8z"/></svg>;
const TikTokIcon = () => <svg viewBox="0 0 20 20" width="18" height="18"><path fill="#161823" d="M16.3 5.6a4 4 0 01-3.14-3.55V2h-2.88v11.4a2.41 2.41 0 01-2.4 2.08 2.41 2.41 0 01-2.4-2.41 2.41 2.41 0 012.4-2.41c.23 0 .45.04.66.09V7.83a6.27 6.27 0 00-.66-.04A5.28 5.28 0 002.6 13.1 5.28 5.28 0 007.88 18.4a5.28 5.28 0 005.27-5.28V7.46a6.84 6.84 0 003.99 1.28V5.89a4.03 4.03 0 01-.84-.29z"/></svg>;
const PinterestIcon = () => <svg viewBox="0 0 20 20" width="18" height="18"><path fill="#E60023" d="M10 2C5.58 2 2 5.58 2 10c0 3.53 2.2 6.55 5.3 7.76-.07-.66-.14-1.67.03-2.39.15-.65.98-4.14.98-4.14s-.25-.5-.25-1.24c0-1.16.67-2.02 1.51-2.02.71 0 1.05.53 1.05 1.17 0 .72-.46 1.79-.69 2.78-.2.83.42 1.5 1.23 1.5 1.48 0 2.61-1.56 2.61-3.8 0-1.99-1.43-3.38-3.47-3.38-2.36 0-3.75 1.77-3.75 3.6 0 .71.27 1.48.62 1.9.07.08.08.15.06.24-.06.26-.2.83-.23.94-.04.15-.13.18-.29.11-1.04-.49-1.69-2-1.69-3.23 0-2.63 1.91-5.04 5.51-5.04 2.89 0 5.14 2.06 5.14 4.82 0 2.87-1.81 5.18-4.33 5.18-.85 0-1.64-.44-1.91-.96l-.52 1.98c-.19.72-.7 1.63-1.04 2.18.78.24 1.61.37 2.47.37 4.42 0 8-3.58 8-8s-3.58-8-8-8z"/></svg>;

/* ── Logo ── */
const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 11l2.5-4 2.5 2 2-3.5 3 5.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
    <span style={{ fontWeight: 700, fontSize: 17, color: "#202124", letterSpacing: -0.3 }}>AdsPulse</span>
  </div>
);

/* ══════════════════════════════════════
   NAVBAR
══════════════════════════════════════ */
function Navbar({ page, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const w = useWindowSize();
  const isMobile = w < 768;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = [
    { id: "home", label: "Product" },
    { id: "features", label: "Features" },
    { id: "pricing", label: "Pricing" },
    { id: "about", label: "About" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0)",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid #E3E8EF" : "1px solid transparent",
      transition: "all 0.25s ease",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Logo />
        </button>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => setPage(l.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 14px", borderRadius: 7,
                fontSize: 14, fontWeight: 500,
                color: page === l.id ? "#1A73E8" : "#5F6368",
                fontFamily: "inherit", transition: "color 0.15s",
              }}>{l.label}</button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isMobile && (
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#5F6368", fontFamily: "inherit", padding: "6px 14px" }}>
              Sign in
            </button>
          )}
          <button onClick={() => setPage("pricing")} style={{
            background: "#1A73E8", border: "none", cursor: "pointer",
            color: "#fff", fontSize: 13.5, fontWeight: 600,
            padding: "8px 18px", borderRadius: 8, fontFamily: "inherit",
            transition: "background 0.15s",
          }}>
            Get started
          </button>
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" fill="none" stroke="#5F6368" strokeWidth="1.8" strokeLinecap="round"><path d={menuOpen ? "M4 4l12 12M16 4L4 16" : "M3 5h14M3 10h14M3 15h14"}/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ background: "#fff", borderTop: "1px solid #E3E8EF", padding: "12px 20px 20px" }}>
          {navLinks.map(l => (
            <button key={l.id} onClick={() => { setPage(l.id); setMenuOpen(false); }} style={{
              display: "block", width: "100%", background: "none", border: "none",
              textAlign: "left", padding: "10px 0", fontSize: 15, fontWeight: 500,
              color: page === l.id ? "#1A73E8" : "#202124", cursor: "pointer", fontFamily: "inherit",
              borderBottom: "1px solid #F1F3F4",
            }}>{l.label}</button>
          ))}
          <button style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#5F6368", fontFamily: "inherit", padding: 0 }}>Sign in</button>
        </div>
      )}
    </nav>
  );
}

/* ══════════════════════════════════════
   HOME PAGE
══════════════════════════════════════ */
function HomePage({ setPage }) {
  const w = useWindowSize();
  const isMobile = w < 768;

  /* section fade */
  const Fade = ({ children, delay = 0 }) => {
    const [ref, inView] = useInView();
    return (
      <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: `all 0.65s cubic-bezier(.16,1,.3,1) ${delay}s` }}>
        {children}
      </div>
    );
  };

  const features = [
    { icon: "📊", title: "Unified Dashboard", desc: "Google, Meta, TikTok ve Pinterest verilerini tek ekranda görün. Platform değiştirme derdi yok." },
    { icon: "⚡", title: "Real-time Sync", desc: "Her 6 saatte otomatik, dilediğinizde manuel sync. Verileriniz her zaman güncel." },
    { icon: "📈", title: "Advanced Analytics", desc: "ROAS, CTR, CPC, conversion rate — tüm metrikler için derin trend analizleri." },
    { icon: "🎯", title: "Smart Filtering", desc: "Platform, durum, bütçe ve ROAS'a göre saniyeler içinde filtreleyin ve karşılaştırın." },
    { icon: "📋", title: "Report Export", desc: "CSV, Excel ve PDF formatında detaylı raporlar indirin veya ekibinizle paylaşın." },
    { icon: "👥", title: "Team Collaboration", desc: "Ekip üyelerini davet edin, rol bazlı erişim yönetimiyle güvenli çalışın." },
  ];

  const logos = [
    { name: "Google Ads", icon: <GoogleIcon />, color: "#1A73E8" },
    { name: "Meta Ads", icon: <MetaIcon />, color: "#0866FF" },
    { name: "TikTok Ads", icon: <TikTokIcon />, color: "#161823" },
    { name: "Pinterest Ads", icon: <PinterestIcon />, color: "#E60023" },
  ];

  const stats = [
    { value: 4200, suffix: "+", label: "Active Users", decimals: 0 },
    { value: 98.7, suffix: "%", label: "Uptime SLA", decimals: 1 },
    { value: 280, suffix: "M+", label: "Ad Spend Tracked", prefix: "$" },
    { value: 6, suffix: "hr", label: "Sync Interval", decimals: 0 },
  ];

  const testimonials = [
    { name: "Sarah K.", role: "Performance Marketing Lead", company: "Bloom Agency", text: "Daha önce 4 farklı sekmeyi aynı anda açıp çalışıyordum. AdsPulse ile tüm kampanyalarımı tek yerden görüyorum. Rapor süremi %70 azalttı.", avatar: "SK" },
    { name: "Mert D.", role: "E-commerce Director", company: "TrendStore", text: "ROAS karşılaştırması ve platform breakdown özellikleri çok güçlü. Bütçe dağılımını optimize etmemiz çok kolaylaştı.", avatar: "MD" },
    { name: "Lena W.", role: "Freelance Media Buyer", company: "Self-employed", text: "Müşterilerime PDF rapor göndermek artık 2 dakika sürüyor. Fiyat-performans açısından kategorisinin en iyisi.", avatar: "LW" },
  ];

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0F6FF 0%, #fff 60%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EAF1FB", border: "1px solid #D2E3FC", borderRadius: 20, padding: "5px 14px", fontSize: 12.5, color: "#1A73E8", fontWeight: 600, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34A853", display: "inline-block" }} />
            v1.0 şimdi çıktı · 4 platform desteği
          </div>
          <h1 style={{ fontSize: isMobile ? 36 : 58, fontWeight: 800, color: "#202124", letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 22 }}>
            Tüm reklam{" "}
            <span style={{ color: "#1A73E8" }}>kampanyalarınızı</span>
            <br />tek panelden yönetin
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 18, color: "#5F6368", lineHeight: 1.65, marginBottom: 36, maxWidth: 580, margin: "0 auto 36px" }}>
            Google Ads, Meta, TikTok ve Pinterest verilerini birleştirin. Gerçek zamanlı metrikler, derin analizler ve ekip işbirliği — hepsi bir arada.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setPage("pricing")} style={{ background: "#1A73E8", color: "#fff", border: "none", padding: "13px 28px", borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(26,115,232,0.35)", transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,115,232,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,115,232,0.35)"; }}>
              Ücretsiz başla →
            </button>
            <button style={{ background: "#fff", color: "#202124", border: "1.5px solid #E3E8EF", padding: "13px 28px", borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#1A73E8"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#E3E8EF"}>
              Demo izle
            </button>
          </div>
          <div style={{ marginTop: 18, fontSize: 12.5, color: "#9AA0A6" }}>
            Kredi kartı gerekmez · 14 gün ücretsiz deneme
          </div>
        </div>

        {/* Platforms */}
        <div style={{ marginTop: 60, display: "flex", alignItems: "center", gap: isMobile ? 16 : 28, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontSize: 12.5, color: "#9AA0A6", fontWeight: 500 }}>Bağlı platformlar:</span>
          {logos.map(l => (
            <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #E3E8EF", borderRadius: 8, padding: "7px 12px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              {l.icon}
              {!isMobile && <span style={{ fontSize: 13, fontWeight: 500, color: "#5F6368" }}>{l.name}</span>}
            </div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div style={{ marginTop: 64, maxWidth: 960, width: "100%", background: "#fff", borderRadius: 16, border: "1px solid #E3E8EF", boxShadow: "0 8px 48px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.04)", overflow: "hidden" }}>
          {/* Fake browser bar */}
          <div style={{ background: "#F8F9FA", borderBottom: "1px solid #E3E8EF", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 5, padding: "4px 12px", fontSize: 11, color: "#9AA0A6", border: "1px solid #E3E8EF", maxWidth: 260, margin: "0 auto", textAlign: "center" }}>
              app.adspulse.io/overview
            </div>
          </div>
          {/* Dashboard preview mockup */}
          <div style={{ padding: isMobile ? "16px" : "24px", background: "#F8F9FA" }}>
            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              {[
                { l: "Impressions", v: "5.9M", c: "+12.4%", pos: true },
                { l: "Clicks", v: "105.3K", c: "+8.7%", pos: true },
                { l: "Total Spend", v: "$10,471", c: "+5.2%", pos: true },
                { l: "Avg. ROAS", v: "4.58x", c: "+2.1%", pos: true },
              ].map((m, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 8, border: "1px solid #E3E8EF", padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#9AA0A6", marginBottom: 5 }}>{m.l}</div>
                  <div style={{ fontSize: isMobile ? 16 : 19, fontWeight: 700, color: "#202124", marginBottom: 4 }}>{m.v}</div>
                  <div style={{ fontSize: 10.5, color: m.pos ? "#137333" : "#C5221F", fontWeight: 600 }}>↑ {m.c}</div>
                </div>
              ))}
            </div>
            {/* Fake chart area */}
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #E3E8EF", padding: isMobile ? "14px" : "18px", height: isMobile ? 110 : 150, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#202124" }}>Performance Trend</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#1A73E8","#0866FF","#161823","#E60023"].map((c,i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 3, borderRadius: 2, background: c }} />
                      {!isMobile && <span style={{ fontSize: 9.5, color: "#9AA0A6" }}>{["Google","Meta","TikTok","Pinterest"][i]}</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Fake SVG lines */}
              <svg width="100%" height={isMobile ? 60 : 90} viewBox="0 0 600 90" preserveAspectRatio="none">
                <path d="M0 70 C50 65 100 40 150 45 C200 50 250 30 300 25 C350 20 400 35 450 30 C500 25 550 40 600 38" fill="url(#g1)" stroke="#1A73E8" strokeWidth="2" fillOpacity="0.12"/>
                <path d="M0 75 C50 70 100 55 150 60 C200 65 250 45 300 40 C350 35 400 50 450 45 C500 40 550 55 600 52" fill="none" stroke="#0866FF" strokeWidth="1.5" strokeDasharray="0"/>
                <path d="M0 80 C50 75 100 65 150 68 C200 71 250 58 300 55 C350 52 400 62 450 58 C500 54 550 65 600 62" fill="none" stroke="#9AA0A6" strokeWidth="1.5" strokeOpacity="0.5"/>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A73E8" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#1A73E8" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / Stats ── */}
      <section style={{ padding: "56px 24px", background: "#fff", borderTop: "1px solid #E3E8EF" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
            {stats.map((s, i) => (
              <Fade key={i} delay={i * 0.08}>
                <div style={{ padding: "20px 16px" }}>
                  <div style={{ fontSize: isMobile ? 30 : 38, fontWeight: 800, color: "#202124", letterSpacing: -1 }}>
                    <AnimNum to={s.value} prefix={s.prefix || ""} suffix={s.suffix} decimals={s.decimals} />
                  </div>
                  <div style={{ fontSize: 13, color: "#9AA0A6", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 24px", background: "#F8F9FA" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Fade>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ display: "inline-block", background: "#EAF1FB", color: "#1A73E8", fontSize: 12, fontWeight: 600, borderRadius: 20, padding: "4px 14px", marginBottom: 14, border: "1px solid #D2E3FC" }}>Özellikler</div>
              <h2 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, color: "#202124", letterSpacing: -0.8, marginBottom: 14 }}>Reklam yönetimini yeniden tanımlıyoruz</h2>
              <p style={{ fontSize: 16, color: "#5F6368", maxWidth: 480, margin: "0 auto" }}>Kampanyalarınızı analiz etmek için ihtiyacınız olan her şey, tek bir yerde.</p>
            </div>
          </Fade>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
            {features.map((f, i) => (
              <Fade key={i} delay={i * 0.07}>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E3E8EF", padding: "24px 24px 22px", transition: "box-shadow .2s, transform .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#202124", marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13.5, color: "#5F6368", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Fade>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ display: "inline-block", background: "#EAF1FB", color: "#1A73E8", fontSize: 12, fontWeight: 600, borderRadius: 20, padding: "4px 14px", marginBottom: 14, border: "1px solid #D2E3FC" }}>Nasıl çalışır?</div>
              <h2 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, color: "#202124", letterSpacing: -0.8 }}>3 adımda başlayın</h2>
            </div>
          </Fade>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 24 : 40, position: "relative" }}>
            {!isMobile && <div style={{ position: "absolute", top: 28, left: "18%", right: "18%", height: 1, background: "linear-gradient(90deg, #E3E8EF, #1A73E8, #E3E8EF)", zIndex: 0 }} />}
            {[
              { step: "01", title: "Hesabını bağla", desc: "Google, Meta, TikTok veya Pinterest hesabınızı OAuth ile güvenli bağlayın. 2 dakika sürer." },
              { step: "02", title: "Verileri senkronize et", desc: "Sistem otomatik olarak kampanya verilerini çeker. Manuel sync butonu da mevcut." },
              { step: "03", title: "Analiz et ve optimize et", desc: "Dashboard'unuza bakın, metrikleri karşılaştırın, rapor indirin." },
            ].map((s, i) => (
              <Fade key={i} delay={i * 0.12}>
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: i === 1 ? "#1A73E8" : "#fff", border: i === 1 ? "none" : "2px solid #E3E8EF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: i === 1 ? "0 4px 16px rgba(26,115,232,.3)" : "none" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: i === 1 ? "#fff" : "#9AA0A6" }}>{s.step}</span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "#202124", marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 13.5, color: "#5F6368", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "80px 24px", background: "#F8F9FA" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Fade>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: "#202124", letterSpacing: -0.7 }}>Kullanıcılarımız ne diyor?</h2>
            </div>
          </Fade>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
            {testimonials.map((t, i) => (
              <Fade key={i} delay={i * 0.1}>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E3E8EF", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: "#FBBC05", fontSize: 14 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 13.5, color: "#5F6368", lineHeight: 1.65, flex: 1 }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #F1F3F4", paddingTop: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#202124" }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9AA0A6" }}>{t.role} · {t.company}</div>
                    </div>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px", background: "#1A73E8" }}>
        <Fade>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: "#fff", letterSpacing: -0.8, marginBottom: 16 }}>
              Hemen başlamaya hazır mısınız?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.6 }}>
              14 günlük ücretsiz deneme. Kredi kartı gerekmez. İstediğiniz zaman iptal edin.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setPage("pricing")} style={{ background: "#fff", color: "#1A73E8", border: "none", padding: "13px 28px", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "transform .15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                Ücretsiz dene →
              </button>
              <button style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", padding: "13px 28px", borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                Demo talep et
              </button>
            </div>
          </div>
        </Fade>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════
   FEATURES PAGE
══════════════════════════════════════ */
function FeaturesPage() {
  const w = useWindowSize();
  const isMobile = w < 768;

  const Fade = ({ children, delay = 0 }) => {
    const [ref, inView] = useInView();
    return <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(18px)", transition: `all 0.6s ease ${delay}s` }}>{children}</div>;
  };

  const sections = [
    {
      title: "Platform Entegrasyonu", badge: "Connect",
      items: [
        { icon: <GoogleIcon />, title: "Google Ads", desc: "Search, Display, Shopping ve YouTube kampanyalarını anlık olarak takip edin. Conversion tracking ile ROAS hesaplama tam entegre." },
        { icon: <MetaIcon />, title: "Meta Ads", desc: "Facebook ve Instagram kampanyalarınızı yönetin. Audience Insights ve creative performance verilerini görün." },
        { icon: <TikTokIcon />, title: "TikTok Ads", desc: "TopView, In-Feed ve Branded Hashtag kampanyalarınızı takip edin. Genç kitle metrikleri özel olarak gösterilir." },
        { icon: <PinterestIcon />, title: "Pinterest Ads", desc: "Promoted Pins ve Idea Ads kampanyalarınızı izleyin. Görsel odaklı e-ticaret metrikleri ile optimize edin." },
      ]
    },
    {
      title: "Raporlama & Analiz", badge: "Analyze",
      items: [
        { icon: "📊", title: "Özelleştirilebilir Raporlar", desc: "Tarih aralığı, platform ve metrik bazında filtreli raporlar oluşturun. CSV, Excel ve PDF export." },
        { icon: "📅", title: "Karşılaştırmalı Analiz", desc: "Bu dönemi geçen dönemle karşılaştırın. Yükselme ve düşüş trendlerini anında fark edin." },
        { icon: "⏰", title: "Saatlik Performans", desc: "Reklamlarınızın günün hangi saatinde en çok tıklandığını görün ve bütçenizi buna göre optimize edin." },
        { icon: "💰", title: "ROAS Optimizasyonu", desc: "Platform bazında ROAS karşılaştırması yapın. Hangi kanalın en çok değer ürettiğini anlık görün." },
      ]
    },
  ];

  return (
    <div style={{ paddingTop: 62 }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, #F0F6FF, #fff)", padding: "80px 24px 64px", textAlign: "center" }}>
        <Fade>
          <div style={{ display: "inline-block", background: "#EAF1FB", color: "#1A73E8", fontSize: 12, fontWeight: 600, borderRadius: 20, padding: "4px 14px", marginBottom: 18, border: "1px solid #D2E3FC" }}>Tüm Özellikler</div>
          <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 800, color: "#202124", letterSpacing: -1, marginBottom: 16 }}>Güçlü araçlar, sade arayüz</h1>
          <p style={{ fontSize: 17, color: "#5F6368", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>Ajanslar ve in-house ekipler için tasarlandı. Karmaşıklık yok, sadece sonuçlar.</p>
        </Fade>
      </section>

      {sections.map((sec, si) => (
        <section key={si} style={{ padding: "64px 24px", background: si % 2 === 0 ? "#fff" : "#F8F9FA" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Fade>
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: "inline-block", background: "#EAF1FB", color: "#1A73E8", fontSize: 11.5, fontWeight: 600, borderRadius: 20, padding: "3px 12px", marginBottom: 10, border: "1px solid #D2E3FC" }}>{sec.badge}</div>
                <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#202124", letterSpacing: -0.5 }}>{sec.title}</h2>
              </div>
            </Fade>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              {sec.items.map((item, i) => (
                <Fade key={i} delay={i * 0.07}>
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E3E8EF", padding: "22px 24px", display: "flex", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F8F9FA", border: "1px solid #E3E8EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "#202124", marginBottom: 6 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "#5F6368", lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   PRICING PAGE
══════════════════════════════════════ */
function PricingPage() {
  const w = useWindowSize();
  const isMobile = w < 768;
  const [annual, setAnnual] = useState(true);

  const Fade = ({ children, delay = 0 }) => {
    const [ref, inView] = useInView();
    return <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(18px)", transition: `all 0.6s ease ${delay}s` }}>{children}</div>;
  };

  const plans = [
    {
      name: "Starter", color: "#5F6368",
      price: annual ? 29 : 39,
      desc: "Küçük ekipler ve freelancerlar için",
      popular: false,
      features: [
        "2 platform bağlantısı",
        "5 aktif kampanya",
        "30 günlük veri geçmişi",
        "CSV export",
        "1 kullanıcı",
        "Email desteği",
      ],
      cta: "Başla",
    },
    {
      name: "Pro", color: "#1A73E8",
      price: annual ? 79 : 99,
      desc: "Büyüyen ekipler ve ajanslar için",
      popular: true,
      features: [
        "4 platform bağlantısı",
        "Sınırsız kampanya",
        "12 aylık veri geçmişi",
        "CSV + Excel + PDF export",
        "5 kullanıcı",
        "Öncelikli destek",
        "API erişimi",
        "Özel raporlar",
      ],
      cta: "14 gün ücretsiz dene",
    },
    {
      name: "Agency", color: "#137333",
      price: annual ? 199 : 249,
      desc: "Büyük ajanslar ve kurumsal ekipler",
      popular: false,
      features: [
        "4 platform bağlantısı",
        "Sınırsız kampanya",
        "Sınırsız veri geçmişi",
        "Tüm export formatları",
        "Sınırsız kullanıcı",
        "Dedicated destek",
        "White-label raporlar",
        "SSO / SAML",
        "SLA güvencesi",
      ],
      cta: "Satış ile görüş",
    },
  ];

  const faqs = [
    { q: "Ücretsiz deneme nasıl çalışıyor?", a: "Pro planı 14 gün boyunca kredi kartı olmadan deneyebilirsiniz. Deneme bitiminde ister Pro'ya geçin, ister Starter'a düşün." },
    { q: "İstediğim zaman iptal edebilir miyim?", a: "Evet, her zaman iptal edebilirsiniz. İptal ettiğinizde mevcut dönem sonuna kadar erişiminiz devam eder." },
    { q: "Hangi ödeme yöntemleri destekleniyor?", a: "Kredi kartı (Visa, Mastercard, Amex) ve banka havalesi desteklenmektedir. Yıllık planlarda fatura seçeneği de mevcuttur." },
    { q: "Kaç platformu aynı anda bağlayabilirim?", a: "Starter'da 2, Pro ve Agency'de 4 platform (Google Ads, Meta, TikTok, Pinterest) bağlanabilir." },
    { q: "Verilerim güvende mi?", a: "Tüm veriler Supabase (PostgreSQL) üzerinde şifreli saklanır. Platform token'ları pgcrypto ile korunur. Row Level Security aktif." },
    { q: "API erişimi nedir?", a: "Pro ve üzeri planlarda REST API erişimiyle kendi sistemlerinize veri aktarabilirsiniz. Webhook desteği de mevcuttur." },
  ];

  return (
    <div style={{ paddingTop: 62 }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, #F0F6FF, #fff)", padding: "72px 24px 52px", textAlign: "center" }}>
        <Fade>
          <h1 style={{ fontSize: isMobile ? 32 : 46, fontWeight: 800, color: "#202124", letterSpacing: -1, marginBottom: 14 }}>Basit ve şeffaf fiyatlandırma</h1>
          <p style={{ fontSize: 16, color: "#5F6368", marginBottom: 28 }}>İhtiyacınıza göre büyüyen planlar. Gizli ücret yok.</p>
          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #E3E8EF", borderRadius: 10, padding: "6px 8px" }}>
            <button onClick={() => setAnnual(false)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: !annual ? "#202124" : "transparent", color: !annual ? "#fff" : "#5F6368", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>Aylık</button>
            <button onClick={() => setAnnual(true)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: annual ? "#202124" : "transparent", color: annual ? "#fff" : "#5F6368", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", gap: 7 }}>
              Yıllık
              <span style={{ background: "#E6F4EA", color: "#137333", fontSize: 10.5, fontWeight: 700, borderRadius: 5, padding: "1px 7px" }}>%25 indirim</span>
            </button>
          </div>
        </Fade>
      </section>

      {/* Plans */}
      <section style={{ padding: "0 24px 72px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <Fade key={i} delay={i * 0.09}>
                <div style={{
                  borderRadius: 14,
                  border: plan.popular ? "2px solid #1A73E8" : "1px solid #E3E8EF",
                  background: "#fff",
                  padding: "28px 26px",
                  position: "relative",
                  boxShadow: plan.popular ? "0 8px 32px rgba(26,115,232,.14)" : "none",
                  transform: plan.popular && !isMobile ? "scale(1.03)" : "none",
                }}>
                  {plan.popular && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#1A73E8", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 14px", whiteSpace: "nowrap" }}>
                      En Popüler
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: "#9AA0A6", marginBottom: 18 }}>{plan.desc}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: "#202124", letterSpacing: -1.5 }}>${plan.price}</span>
                    <span style={{ fontSize: 13, color: "#9AA0A6", paddingBottom: 8 }}>/ay</span>
                  </div>
                  {annual && <div style={{ fontSize: 11.5, color: "#137333", fontWeight: 600, marginBottom: 20 }}>Yıllık faturalandırılır · ${plan.price * 12}/yıl</div>}
                  {!annual && <div style={{ height: 20, marginBottom: 20 }} />}

                  <button style={{
                    width: "100%", padding: "11px", borderRadius: 9, border: plan.popular ? "none" : "1.5px solid #E3E8EF",
                    background: plan.popular ? "#1A73E8" : "#fff",
                    color: plan.popular ? "#fff" : "#202124",
                    fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    marginBottom: 22, transition: "transform .15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                    {plan.cta}
                  </button>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map((f, fi) => (
                      <div key={fi} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#5F6368" }}>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7" fill={plan.popular ? "#EAF1FB" : "#F1F3F4"}/><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke={plan.popular ? "#1A73E8" : "#9AA0A6"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Fade>
            ))}
          </div>

          {/* Enterprise */}
          <Fade delay={0.3}>
            <div style={{ marginTop: 24, background: "#F8F9FA", borderRadius: 12, border: "1px solid #E3E8EF", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#202124", marginBottom: 4 }}>Kurumsal ihtiyaçlarınız mı var?</div>
                <div style={{ fontSize: 13.5, color: "#5F6368" }}>Özel entegrasyon, dedicated sunucu ve SLA anlaşması için bizimle iletişime geçin.</div>
              </div>
              <button style={{ background: "#202124", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                Satış ekibiyle görüş →
              </button>
            </div>
          </Fade>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: "60px 24px", background: "#F8F9FA" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Fade>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#202124", letterSpacing: -0.5, textAlign: "center", marginBottom: 32 }}>Plan karşılaştırması</h2>
          </Fade>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E3E8EF", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA", borderBottom: "1px solid #E3E8EF" }}>
                  <th style={{ padding: "14px 18px", textAlign: "left", fontSize: 12, color: "#9AA0A6", fontWeight: 600 }}>Özellik</th>
                  {["Starter", "Pro", "Agency"].map((p, i) => (
                    <th key={p} style={{ padding: "14px 18px", textAlign: "center", fontSize: 13, fontWeight: 700, color: i === 1 ? "#1A73E8" : "#202124" }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Platform bağlantısı", "2", "4", "4"],
                  ["Aktif kampanya", "5", "Sınırsız", "Sınırsız"],
                  ["Kullanıcı sayısı", "1", "5", "Sınırsız"],
                  ["Veri geçmişi", "30 gün", "12 ay", "Sınırsız"],
                  ["PDF/Excel export", "—", "✓", "✓"],
                  ["API erişimi", "—", "✓", "✓"],
                  ["White-label rapor", "—", "—", "✓"],
                  ["Öncelikli destek", "—", "✓", "✓"],
                ].map(([feature, ...vals], ri) => (
                  <tr key={ri} style={{ borderBottom: ri < 7 ? "1px solid #F1F3F4" : "none" }}>
                    <td style={{ padding: "12px 18px", fontSize: 13, color: "#5F6368" }}>{feature}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} style={{ padding: "12px 18px", textAlign: "center", fontSize: 13, color: v === "✓" ? "#137333" : v === "—" ? "#D1D5DB" : vi === 1 ? "#1A73E8" : "#202124", fontWeight: v === "✓" || vi === 1 ? 600 : 400 }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "60px 24px 80px", background: "#fff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Fade>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#202124", letterSpacing: -0.5, textAlign: "center", marginBottom: 36 }}>Sık sorulan sorular</h2>
          </Fade>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {faqs.map((f, i) => {
              const [open, setOpen] = useState(false);
              return (
                <Fade key={i} delay={i * 0.05}>
                  <div style={{ background: "#F8F9FA", borderRadius: 10, border: "1px solid #E3E8EF", overflow: "hidden" }}>
                    <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#202124", textAlign: "left" }}>{f.q}</span>
                      <svg width="16" height="16" fill="none" stroke="#9AA0A6" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><path d="M3 6l5 5 5-5"/></svg>
                    </button>
                    {open && <div style={{ padding: "0 20px 16px", fontSize: 13.5, color: "#5F6368", lineHeight: 1.65 }}>{f.a}</div>}
                  </div>
                </Fade>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════
   ABOUT PAGE
══════════════════════════════════════ */
function AboutPage() {
  const w = useWindowSize();
  const isMobile = w < 768;

  const Fade = ({ children, delay = 0 }) => {
    const [ref, inView] = useInView();
    return <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(18px)", transition: `all 0.6s ease ${delay}s` }}>{children}</div>;
  };

  const team = [
    { name: "Alex Chen", role: "CEO & Co-founder", bio: "Ex-Google Ads ekibi. 10 yıl performance marketing deneyimi.", initials: "AC", color: "#1A73E8" },
    { name: "Maya Rodriguez", role: "CTO & Co-founder", bio: "Ex-Meta Engineer. Full-stack ve data infra uzmanı.", initials: "MR", color: "#0866FF" },
    { name: "Tom Bakker", role: "Head of Product", bio: "5 yıl SaaS ürün yönetimi. UX ve growth odaklı.", initials: "TB", color: "#137333" },
    { name: "Sarah Park", role: "Head of Design", bio: "Ex-Figma tasarımcı. Data visualization ve UI sistemleri.", initials: "SP", color: "#E60023" },
  ];

  const values = [
    { icon: "🎯", title: "Sadelik", desc: "Karmaşık verileri basit, anlaşılır arayüzlere dönüştürmek en büyük önceliğimiz." },
    { icon: "🔒", title: "Güven", desc: "Müşteri verilerini korumak bir seçenek değil, temel bir sorumluluk." },
    { icon: "⚡", title: "Hız", desc: "Karar almak için gereken veriye anında ulaşmak, rekabet avantajıdır." },
    { icon: "🤝", title: "Müşteri Başarısı", desc: "Sizin başarınız bizim başarımız. Destek ekibimiz her zaman yanınızda." },
  ];

  return (
    <div style={{ paddingTop: 62 }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, #F0F6FF, #fff)", padding: "80px 24px 64px", textAlign: "center" }}>
        <Fade>
          <div style={{ display: "inline-block", background: "#EAF1FB", color: "#1A73E8", fontSize: 12, fontWeight: 600, borderRadius: 20, padding: "4px 14px", marginBottom: 18, border: "1px solid #D2E3FC" }}>Hakkımızda</div>
          <h1 style={{ fontSize: isMobile ? 30 : 46, fontWeight: 800, color: "#202124", letterSpacing: -1, marginBottom: 18 }}>Pazarlamacılar tarafından,<br/>pazarlamacılar için</h1>
          <p style={{ fontSize: 16, color: "#5F6368", maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
            AdsPulse, kendi ajanslarında çalışırken her gün 4 farklı reklam panelini açmaktan bıkan iki girişimci tarafından 2024'te kuruldu.
          </p>
        </Fade>
      </section>

      {/* Story */}
      <section style={{ padding: "64px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Fade>
            <div style={{ background: "#F8F9FA", borderRadius: 16, border: "1px solid #E3E8EF", padding: isMobile ? "28px 22px" : "40px 44px" }}>
              <div style={{ fontSize: 32, marginBottom: 18 }}>💡</div>
              <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#202124", marginBottom: 16, letterSpacing: -0.5 }}>Hikayemiz</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14.5, color: "#5F6368", lineHeight: 1.75 }}>
                <p>2023'te bir performance marketing ajansı yönetirken, her sabah yapılan rutin şuydu: Google Ads aç, rakam not et, kapat. Meta Ads aç, rakam not et, kapat. TikTok Ads aç... Bu döngü bazen 45 dakika alıyordu.</p>
                <p>Piyasadaki araçlar ya çok pahalıydı (enterprise odaklı) ya da çok karmaşıktı. "Sadece verileri bir araya getiren, temiz bir dashboard" yoktu.</p>
                <p>AdsPulse'u yazmaya başladık. Kendimiz için. 3 ay sonra arkadaşlarımızdan ilk beta geri bildirimleri geldi. 6 ay sonra ilk ücretli müşteriler. Şimdi 4.200+ kullanıcıyla buradayız.</p>
              </div>
            </div>
          </Fade>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "64px 24px", background: "#F8F9FA" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Fade>
            <h2 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: "#202124", letterSpacing: -0.5, marginBottom: 36, textAlign: "center" }}>Değerlerimiz</h2>
          </Fade>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
            {values.map((v, i) => (
              <Fade key={i} delay={i * 0.08}>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E3E8EF", padding: "22px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginBottom: 8 }}>{v.title}</div>
                  <div style={{ fontSize: 12.5, color: "#9AA0A6", lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "64px 24px 80px", background: "#fff" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Fade>
            <h2 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: "#202124", letterSpacing: -0.5, marginBottom: 36, textAlign: "center" }}>Ekibimiz</h2>
          </Fade>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 18 }}>
            {team.map((m, i) => (
              <Fade key={i} delay={i * 0.08}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#fff", fontSize: 18, fontWeight: 700 }}>{m.initials}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginBottom: 3 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: m.color, fontWeight: 600, marginBottom: 7 }}>{m.role}</div>
                  <div style={{ fontSize: 12, color: "#9AA0A6", lineHeight: 1.5 }}>{m.bio}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
function Footer({ setPage }) {
  const w = useWindowSize();
  const isMobile = w < 768;

  return (
    <footer style={{ background: "#202124", padding: isMobile ? "40px 24px 28px" : "56px 24px 36px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? 28 : 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 10l2-3.5 2.5 1.5 2-3.5 2.5 5.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>AdsPulse</span>
            </div>
            <p style={{ fontSize: 13, color: "#9AA0A6", lineHeight: 1.65, maxWidth: 240 }}>Tüm reklam kampanyalarınızı tek panelden yönetin.</p>
          </div>
          {[
            { title: "Ürün", links: [{ l: "Özellikler", id: "features" }, { l: "Pricing", id: "pricing" }, { l: "Changelog", id: "home" }, { l: "Roadmap", id: "home" }] },
            { title: "Şirket", links: [{ l: "Hakkımızda", id: "about" }, { l: "Blog", id: "home" }, { l: "Kariyer", id: "home" }, { l: "İletişim", id: "home" }] },
            { title: "Destek", links: [{ l: "Dokümantasyon", id: "home" }, { l: "API Referansı", id: "home" }, { l: "Status", id: "home" }, { l: "Topluluk", id: "home" }] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>{col.title}</div>
              {col.links.map(lnk => (
                <button key={lnk.l} onClick={() => setPage(lnk.id)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", fontSize: 13.5, color: "#9AA0A6", fontFamily: "inherit", padding: "4px 0", transition: "color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "#9AA0A6"}>
                  {lnk.l}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #2D3142", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12.5, color: "#5F6368" }}>© 2026 AdsPulse. Tüm hakları saklıdır.</div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Gizlilik", "Kullanım Şartları", "Çerezler"].map(l => (
              <button key={l} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "#5F6368", fontFamily: "inherit", transition: "color .15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#9AA0A6"}
                onMouseLeave={e => e.currentTarget.style.color = "#5F6368"}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════
   APP
══════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #fff; color: #202124; }
        * { -webkit-font-smoothing: antialiased; }
        button { font-family: 'Inter', sans-serif; }
      `}</style>

      <Navbar page={page} setPage={setPage} />

      {page === "home"     && <HomePage setPage={setPage} />}
      {page === "features" && <FeaturesPage />}
      {page === "pricing"  && <PricingPage />}
      {page === "about"    && <AboutPage />}

      <Footer setPage={setPage} />
    </>
  );
}
