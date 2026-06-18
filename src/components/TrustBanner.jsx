const NAVY = '#05111F';
const GOLD = '#C9A84C';

const PILLARS = [
  { label: 'Made in USA',                sub: 'Compounded & lyophilized domestically' },
  { label: 'Independently Tested',         sub: 'HPLC · LAL endotoxin · ICP-MS metals' },
  { label: 'Premium Manufacturing',        sub: 'Licensed U.S. manufacturing partners' },
  { label: 'Batch Traceability',           sub: 'Lot-specific COA on every order' },
  { label: 'White Label Ready',            sub: 'Your brand. Our manufacturing.' },
  { label: 'Distribution Partner Accounts',sub: 'Wholesale access for qualified partners' },
];

export default function TrustBanner() {
  return (
    <div style={{ background: NAVY, borderTop: `1px solid rgba(201,168,76,0.15)`, borderBottom: `1px solid rgba(201,168,76,0.15)`, padding: '32px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Taglines */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            For partners who value quality over price.
          </div>
          <div style={{ fontSize: 11, color: `rgba(201,168,76,0.55)`, letterSpacing: 1.5 }}>
            Lyophilized and packaged in the USA &nbsp;·&nbsp; Premium American manufacturing
          </div>
        </div>

        {/* Pillar grid */}
        <div className="trust-pillar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: 'rgba(201,168,76,0.08)' }}>
          {PILLARS.map(({ label, sub }) => (
            <div
              key={label}
              style={{
                background: NAVY,
                padding: '18px 14px',
                textAlign: 'center',
                borderRight: '1px solid rgba(201,168,76,0.1)',
              }}
            >
              <div style={{ width: 20, height: 2, background: GOLD, margin: '0 auto 10px' }}/>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
