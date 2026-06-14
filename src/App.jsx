export default function App() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>Wholesale US Peptides</div>
        <nav style={styles.nav}>
          <a style={styles.navLink}>Products</a>
          <a style={styles.navLink}>White Label</a>
          <a style={styles.navLink}>Testing</a>
          <a style={styles.navLink}>Wholesale</a>
          <a style={styles.navButton}>Apply</a>
        </nav>
      </header>

      <section style={styles.hero}>
        <p style={styles.eyebrow}>WHOLESALE • WHITE LABEL • RESEARCH SUPPLY</p>
        <h1 style={styles.heroTitle}>
          Wholesale Peptide Manufacturing & Private Label Solutions
        </h1>
        <p style={styles.heroText}>
          Premium peptide solutions for clinics, wellness providers, distributors,
          research organizations, and private label brands.
        </p>
        <div style={styles.buttonRow}>
          <button style={styles.goldButton}>Request Wholesale Pricing</button>
          <button style={styles.outlineButton}>Become A Partner</button>
        </div>
      </section>

      <section style={styles.trustGrid}>
        {[
          "Third-Party Tested",
          "White Label Available",
          "USA Fulfillment",
          "Batch Documentation",
          "QR COA Verification",
          "Dedicated Account Support",
        ].map((item) => (
          <div style={styles.trustCard} key={item}>✓ {item}</div>
        ))}
      </section>

      <section style={styles.section}>
        <p style={styles.eyebrow}>PRODUCT CATEGORIES</p>
        <h2 style={styles.sectionTitle}>Built For Wholesale Buyers</h2>
        <div style={styles.cardGrid}>
          {[
            ["GLP Solutions", "Wholesale supply support for weight management focused brands."],
            ["Wellness Peptides", "Popular research categories for longevity and optimization markets."],
            ["Performance Peptides", "Solutions for performance, recovery, and specialty research buyers."],
            ["Custom Blends", "Private label blend concepts for qualified wholesale partners."],
          ].map(([title, text]) => (
            <div style={styles.card} key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.altSection}>
        <p style={styles.eyebrow}>PRIVATE LABEL</p>
        <h2 style={styles.sectionTitle}>Launch Your Own Peptide Brand</h2>
        <p style={styles.lead}>
          We support qualified partners with label-ready product programs,
          custom branding, wholesale pricing, and fulfillment workflows.
        </p>
        <div style={styles.steps}>
          {["Apply", "Review", "Approve", "Fulfill"].map((step, i) => (
            <div style={styles.step} key={step}>
              <span style={styles.stepNum}>{i + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <p style={styles.eyebrow}>QUALITY & TESTING</p>
        <h2 style={styles.sectionTitle}>Confidence In Every Batch</h2>
        <p style={styles.lead}>
          Support your brand reputation with batch documentation, third-party
          testing, COA records, and QR-linked verification workflows.
        </p>
      </section>

      <section style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Apply For Wholesale Access</h2>
        <p style={styles.lead}>
          Approved accounts receive wholesale pricing, white-label information,
          and ACH payment instructions after review.
        </p>

        <form style={styles.form}>
          <input style={styles.input} placeholder="Company Name" />
          <input style={styles.input} placeholder="Contact Name" />
          <input style={styles.input} placeholder="Email Address" />
          <input style={styles.input} placeholder="Phone Number" />
          <select style={styles.input}>
            <option>Business Type</option>
            <option>Clinic / Wellness Provider</option>
            <option>Distributor</option>
            <option>Private Label Brand</option>
            <option>Research Organization</option>
          </select>
          <textarea style={styles.textarea} placeholder="Tell us about your monthly volume and product interests." />
          <button type="button" style={styles.goldButton}>Submit Application</button>
        </form>
      </section>

      <footer style={styles.footer}>
        <strong>Wholesale US Peptides</strong>
        <p>Wholesale • White Label • Research Supply</p>
        <p style={styles.disclaimer}>
          Products are intended for qualified wholesale and research-related buyers.
          All purchasing is subject to account approval and applicable compliance review.
        </p>
      </footer>
    </main>
  );
}

const styles = {
  page: {
    background: "#0B1020",
    color: "#F8FAFC",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 6%",
    background: "rgba(11,16,32,.92)",
    borderBottom: "1px solid rgba(212,175,55,.25)",
  },
  logo: {
    fontWeight: 900,
    fontSize: 22,
    color: "#F8FAFC",
  },
  nav: {
    display: "flex",
    gap: 22,
    alignItems: "center",
    flexWrap: "wrap",
  },
  navLink: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  navButton: {
    background: "#D4AF37",
    color: "#020617",
    padding: "10px 18px",
    borderRadius: 8,
    fontWeight: 800,
  },
  hero: {
    padding: "110px 6% 90px",
    textAlign: "center",
    maxWidth: 1150,
    margin: "0 auto",
  },
  eyebrow: {
    color: "#D4AF37",
    letterSpacing: 3,
    fontWeight: 800,
    fontSize: 13,
  },
  heroTitle: {
    fontSize: "clamp(38px, 7vw, 78px)",
    lineHeight: 1.05,
    margin: "18px auto",
  },
  heroText: {
    color: "#CBD5E1",
    fontSize: "clamp(18px, 3vw, 24px)",
    lineHeight: 1.5,
    maxWidth: 850,
    margin: "0 auto 34px",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  goldButton: {
    background: "#D4AF37",
    color: "#020617",
    border: "none",
    padding: "16px 26px",
    borderRadius: 10,
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  },
  outlineButton: {
    background: "transparent",
    color: "#F8FAFC",
    border: "1px solid #D4AF37",
    padding: "16px 26px",
    borderRadius: 10,
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  },
  trustGrid: {
    maxWidth: 1150,
    margin: "0 auto",
    padding: "35px 6%",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  },
  trustCard: {
    background: "#1E293B",
    border: "1px solid rgba(212,175,55,.28)",
    borderRadius: 18,
    padding: 24,
    fontSize: 18,
  },
  section: {
    maxWidth: 1150,
    margin: "0 auto",
    padding: "90px 6%",
    textAlign: "center",
  },
  altSection: {
    padding: "90px 6%",
    background: "#111827",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "clamp(34px, 5vw, 52px)",
    margin: "14px 0",
  },
  lead: {
    maxWidth: 800,
    margin: "20px auto",
    color: "#CBD5E1",
    fontSize: 20,
    lineHeight: 1.6,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    marginTop: 36,
  },
  card: {
    background: "#1E293B",
    border: "1px solid rgba(212,175,55,.28)",
    borderRadius: 18,
    padding: 28,
    textAlign: "left",
    color: "#CBD5E1",
  },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 18,
    maxWidth: 850,
    margin: "40px auto 0",
  },
  step: {
    background: "#1E293B",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(212,175,55,.28)",
  },
  stepNum: {
    display: "block",
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 8,
  },
  formSection: {
    maxWidth: 850,
    margin: "0 auto",
    padding: "90px 6%",
    textAlign: "center",
  },
  form: {
    display: "grid",
    gap: 14,
    marginTop: 30,
  },
  input: {
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(212,175,55,.35)",
    background: "#111827",
    color: "#F8FAFC",
    fontSize: 16,
  },
  textarea: {
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(212,175,55,.35)",
    background: "#111827",
    color: "#F8FAFC",
    fontSize: 16,
    minHeight: 130,
  },
  footer: {
    borderTop: "1px solid rgba(212,175,55,.25)",
    padding: "40px 6%",
    textAlign: "center",
    color: "#CBD5E1",
  },
  disclaimer: {
    fontSize: 12,
    maxWidth: 760,
    margin: "15px auto 0",
    lineHeight: 1.6,
  },
};
