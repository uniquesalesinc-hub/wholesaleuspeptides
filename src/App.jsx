export default function App() {
  return (
    <div
      style={{
        background: "#0F172A",
        color: "#F8FAFC",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HERO */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            marginBottom: "20px",
            fontWeight: "700",
          }}
        >
          Wholesale US Peptides
        </h1>

        <p
          style={{
            fontSize: "24px",
            color: "#CBD5E1",
            maxWidth: "800px",
            margin: "0 auto 40px",
          }}
        >
          Premium peptide solutions for clinics, wellness providers,
          researchers, distributors, and private label partners.
        </p>

        <button
          style={{
            background: "#D4AF37",
            color: "#000",
            border: "none",
            padding: "16px 32px",
            fontSize: "18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Request Wholesale Pricing
        </button>
      </section>

      {/* TRUST BAR */}
      <section
        style={{
          background: "#111827",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>✓ Third-Party Tested</div>
          <div>✓ White Label Available</div>
          <div>✓ USA Fulfillment</div>
          <div>✓ Wholesale Pricing</div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "40px",
            marginBottom: "50px",
          }}
        >
          Product Categories
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "25px",
          }}
        >
          {[
            "GLP-1 Solutions",
            "Wellness Peptides",
            "Performance Peptides",
            "Research Compounds",
          ].map((item) => (
            <div
              key={item}
              style={{
                background: "#1E293B",
                padding: "30px",
                borderRadius: "12px",
              }}
            >
              <h3>{item}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* WHITE LABEL */}
      <section
        style={{
          background: "#111827",
          padding: "80px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "40px" }}>
            White Label & Private Branding
          </h2>

          <p
            style={{
              marginTop: "20px",
              color: "#CBD5E1",
              fontSize: "20px",
            }}
          >
            Launch your own peptide brand with custom packaging,
            labeling, fulfillment, and wholesale support.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "100px 20px",
        }}
      >
        <h2 style={{ fontSize: "40px" }}>
          Ready To Become A Wholesale Partner?
        </h2>

        <p
          style={{
            marginTop: "20px",
            color: "#CBD5E1",
          }}
        >
          Contact our team to discuss pricing, private label options,
          and bulk purchasing opportunities.
        </p>

        <button
          style={{
            marginTop: "30px",
            background: "#D4AF37",
            color: "#000",
            border: "none",
            padding: "16px 32px",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Contact Sales
        </button>
      </section>
    </div>
  );
}
