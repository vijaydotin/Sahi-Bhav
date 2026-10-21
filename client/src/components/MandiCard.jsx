import React from 'react';

export default function MandiCard({ record, lang, isSelectedForCompare, onToggleCompare }) {
  const isAboveMsp = record.msp && record.modal_price >= record.msp;
  const mspDiff = record.msp ? record.modal_price - record.msp : null;

  // Weight catalog conversions
  const modalPrice = record.modal_price || 0;
  const minPrice = record.min_price || 0;
  const maxPrice = record.max_price || 0;

  const perKgModal = (modalPrice / 100).toFixed(2);
  const perKgMin = (minPrice / 100).toFixed(1);
  const perKgMax = (maxPrice / 100).toFixed(1);

  return (
    <div style={{
      background: 'var(--color-card)',
      border: isSelectedForCompare ? '2px solid var(--color-primary)' : '1px solid var(--color-card-border)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      position: 'relative',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'var(--transition)'
    }}>
      {/* Header: Market & Distance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
            {lang === 'hi' ? record.market_hi : record.market_en}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', margin: '2px 0 0 0' }}>
            📍 {record.district}, {record.state} • {record.distance_km === 0 ? (lang === 'hi' ? 'स्थानीय मंडी' : 'Local Hub') : `~${record.distance_km} km`}
          </p>
        </div>
        
        {/* Compare Checkbox */}
        <button
          onClick={() => onToggleCompare(record)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: isSelectedForCompare ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
            color: isSelectedForCompare ? '#052e16' : 'var(--color-text-main)',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: isSelectedForCompare ? 'none' : '1px solid var(--color-card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {isSelectedForCompare ? '✓ ' + (lang === 'hi' ? 'तुलना में चुना गया' : 'Selected') : '+ ' + (lang === 'hi' ? 'तुलना करें' : 'Compare')}
        </button>
      </div>

      {/* Commodity, Variety & Standard Weight Unit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.85rem',
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-accent)',
            fontWeight: 600,
            border: '1px solid var(--color-card-border)'
          }}>
            {lang === 'hi' ? record.commodity_hi : record.commodity_en}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
            {lang === 'hi' ? `किस्म: ${record.variety}` : `Variety: ${record.variety}`}
          </span>
        </div>

        {/* Weight Unit Badge */}
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--color-primary-light)',
          background: 'rgba(34, 197, 94, 0.1)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(34, 197, 94, 0.25)'
        }}>
          ⚖️ {lang === 'hi' ? 'मानक: ₹ / क्विंटल (100 कि.ग्रा.)' : 'Std: ₹ / Quintal (100 kg)'}
        </span>
      </div>

      {/* Modal Price (Dual Catalog: ₹ / Quintal & ₹ / kg) */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeft: '4px solid var(--color-primary)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'hi' ? 'मॉडल भाव (नीलामी दर)' : 'Modal Auction Rate'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
              ₹{modalPrice.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
              / {lang === 'hi' ? 'क्विंटल' : 'qtl'}
            </span>
          </div>
          {/* Per Kg Conversion Subtitle */}
          <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, marginTop: '2px' }}>
            ≈ ₹{perKgModal} / {lang === 'hi' ? 'किलो (kg)' : 'kg'}
          </div>
        </div>

        {/* Range Min - Max in ₹/qtl and ₹/kg */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
            {lang === 'hi' ? 'न्यूनतम - अधिकतम' : 'Min - Max Range'}
          </span>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            ₹{minPrice} - ₹{maxPrice} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>/ qtl</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
            (₹{perKgMin} - ₹{perKgMax} / kg)
          </div>
        </div>
      </div>

      {/* MSP Indicator & Arrival volume */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
        {record.msp ? (
          <span style={{
            color: isAboveMsp ? 'var(--color-primary-light)' : 'var(--color-danger)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isAboveMsp ? '▲' : '▼'} {lang === 'hi' ? 'एम.एस.पी. से' : 'vs MSP'} {mspDiff >= 0 ? `+₹${mspDiff}` : `-₹${Math.abs(mspDiff)}`} 
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>
              (MSP: ₹{record.msp}/qtl • ₹{(record.msp / 100).toFixed(2)}/kg)
            </span>
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-dim)' }}>
            {lang === 'hi' ? 'खुला बाज़ार भाव (एमएसपी लागू नहीं)' : 'Open Market (No MSP)'}
          </span>
        )}

        <span style={{ color: 'var(--color-text-dim)' }}>
          📦 {lang === 'hi' ? `आवक: ${record.arrivals_quintal} क्विंटल` : `Arrivals: ${record.arrivals_quintal} qtl`}
        </span>
      </div>

      {/* Footer: Date & Source tag */}
      <div style={{
        borderTop: '1px solid var(--color-card-border)',
        paddingTop: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--color-text-dim)'
      }}>
        <span>📅 {record.reported_date}</span>
        <span style={{ color: 'var(--color-primary)' }}>✓ {record.source}</span>
      </div>
    </div>
  );
}
