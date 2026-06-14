export default function App() {
  return (
    <main style={{ background: "#0B1020", color: "#F8FAFC", fontFamily: "Arial, sans-serif" }}>
      <section style={{ padding: "90px 24px", textAlign: "center" }}>
        <p style={{ color: "#D4AF37", letterSpacing: 3, fontWeight: 700 }}>
          WHOLESALE • WHITE LABEL • RESEARCH SUPPLY
        </p>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 82px)", lineHeight: 1.05 }}>
          Wholesale Peptide Manufacturing & Private Label Solutions
        </h1>
        <p style={{ maxWidth: 820, margin: "28px auto", fontSize: 22, color: "#CBD5E1" }}>
          Premium peptide solutions for clinics, wellness providers, distributors,
          and private label brands.
        </p>
        <button style={button}>Request Wholesale Pricing</button>
        <button style={{ ...button, background: "transparent", color: "#F8FAFC", border: "1px solid #D4AF37", marginLeft: 12 }}>
          Become A Partner
        </button>
      </section>

      <section style={grid}>
        {["Third-Party Tested", "White Label Available", "USA Fulfillment", "Wholesale Pricing"].map((x) => (
          <div style={card} key={x}>✓ {x}</div>
        ))}
      </section>

      <section style={section}>
        <h2 style={h2}>Product Categories</h2>
        <div style={grid}>
          {["GLP-1 Solutions", "Wellness Peptides", "Performance Peptides", "Research Compounds"].map((x) => (
            <div style={card} key={x}>
              <h3>{x}</h3>
              <p style={muted}>Bulk availability, private label options, and wholesale support.</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionAlt}>
        <h2 style={h2}>White Label Program</h2>
        <p style={lead}>
          Build your brand with custom labels, packaging, fulfillment support,
          and partner-focused wholesale pricing.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>Testing & Documentation</h2>
        <p style={lead}>
          Support your brand reputation with third-party testing, batch records,
          COA documentation, and QR-linked verification workflows.
        </p>
      </section>

      <section style={sectionAlt}>
        <h2 style={h2}>Apply For A Wholesale Account</h2>
        <p style={lead}>
          Approved accounts receive wholesale pricing, white-label guidance,
          and ACH payment instructions after review.
        </p>
        <button style={button}>Start Application</button>
      </section>
    </main>
  );
}

const button = {
  background: "#D4AF37",
  color: "#020617",
  border: "none",
  padding: "16px 28px",
  borderRadius: 10,
  fontSize: 17,
  fontWeight: 800,
  cursor: "pointer",
};

const section = {
  padding: "80px 24px",
  maxWidth: 1150,
  margin: "0 auto",
  textAlign: "center",
};

const sectionAlt = {
  padding: "80px 24px",
  background: "#111827",
  textAlign: "center",
};

const grid = {
  maxWidth: 1150,
  margin: "0 auto",
  padding: "30px 24px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 18,
};

const card = {
  background: "#1E293B",
  border: "1px solid rgba(212,175,55,.25)",
  borderRadius: 16,
  padding: 28,
  fontSize: 18,
};

const h2 = {
  fontSize: "clamp(32px, 5vw, 48px)",
};

const lead = {
  maxWidth: 760,
  margin: "20px auto",
  fontSize: 20,
  color: "#CBD5E1",
  lineHeight: 1.6,
};

const muted = {
  color: "#CBD5E1",
  lineHeight: 1.5,
};
