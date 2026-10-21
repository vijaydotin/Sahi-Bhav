import React, { useState } from 'react';

export default function ComparisonModal({ mandis, lang, onClose }) {
  if (!mandis || mandis.length < 2) return null;

  const [mandiA, mandiB] = mandis;

  // Farmer inputs for Net Profit calculation
  const [quantityQtl, setQuantityQtl] = useState(25); // 25 Quintals
  const [transitCostPerKm, setTransitCostPerKm] = useState(20); // ₹20/km

  const priceA = mandiA.modal_price || 0;
  const priceB = mandiB.modal_price || 0;
  const priceDiffPerQtl = priceA - priceB;

  const distA = mandiA.distance_km || 0;
  const distB = mandiB.distance_km || 0;
  const distDiff = Math.abs(distA - distB);

  // Financial calculations
  const grossDiffTotal = Math.round(priceDiffPerQtl * quantityQtl);
  const transitDiffTotal = Math.round(distDiff * transitCostPerKm);

  // Net Profit determination
  // If Mandi A has higher price but is further:
  let netGain = 0;
  let recommendedMandi = null;

  if (priceA >= priceB) {
    const transportExtra = (distA > distB) ? (distA - distB) * transitCostPerKm : 0;
    netGain = (priceA - priceB) * quantityQtl - transportExtra;
    recommendedMandi = netGain > 0 ? mandiA : mandiB;
  } else {
    const transportExtra = (distB > distA) ? (distB - distA) * transitCostPerKm : 0;
    netGain = (priceB - priceA) * quantityQtl - transportExtra;
    recommendedMandi = netGain > 0 ? mandiB : mandiA;
  }

  const isNetPositive = netGain > 0;
  const winnerName = lang === 'hi' ? recommendedMandi.market_hi : recommendedMandi.market_en;

  // Share summary via WhatsApp
  const handleShareWhatsApp = () => {
    const text = lang === 'hi' 
      ? `🌾 *सही भाव (SahiBhav) मंडी तुलना रिपोर्ट*\n\n` +
        `📍 *मंडी 1:* ${mandiA.market_hi} - ₹${priceA}/क्विंटल (${distA} km)\n` +
        `📍 *मंडी 2:* ${mandiB.market_hi} - ₹${priceB}/क्विंटल (${distB} km)\n\n` +
        `⚖️ *भाव अंतर:* ₹${Math.abs(priceDiffPerQtl)}/क्विंटल\n` +
        `🚚 *कुल मात्रा:* ${quantityQtl} क्विंटल\n` +
        `💰 *अनुमानित शुद्ध मुनाफ़ा:* ₹${Math.abs(netGain).toLocaleString('en-IN')}\n\n` +
        `✅ *सलाह:* ${winnerName} में बेचना अधिक फायदेमंद है।\n` +
        `_स्रोत: data.gov.in (कृषि मंत्रालय, भारत सरकार)_`
      : `🌾 *SahiBhav Mandi Comparison Report*\n\n` +
        `📍 *Market 1:* ${mandiA.market_en} - ₹${priceA}/qtl (~${distA} km)\n` +
        `📍 *Market 2:* ${mandiB.market_en} - ₹${priceB}/qtl (~${distB} km)\n\n` +
        `⚖️ *Price Delta:* ₹${Math.abs(priceDiffPerQtl)}/qtl\n` +
        `🚚 *Harvest Quantity:* ${quantityQtl} Quintals\n` +
        `💰 *Estimated Net Profit:* ₹${Math.abs(netGain).toLocaleString('en-IN')}\n\n` +
        `✅ *Recommendation:* Selling at ${winnerName} gives the best return after transport.\n` +
        `_Source: data.gov.in (Ministry of Agriculture)_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 200
    }}>
      <div style={{
        background: '#102219',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            borderRadius: 'var(--radius-full)',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-light)', marginBottom: '4px' }}>
          ⚖️ {lang === 'hi' ? 'मंडी तुलना व सही मुनाफ़ा कैलकुलेटर' : 'Mandi Comparison & Net Profit Engine'}
        </h2>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: '20px' }}>
          {lang === 'hi' 
            ? 'परिवहन लागत व फसल मात्रा को जोड़कर वास्तविक जेब में आने वाले मुनाफ़े की गणना' 
            : 'Deterministic take-home profit calculated after transit distance and fuel expenses'}
        </p>

        {/* Side-by-side Mandi Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Mandi A */}
          <div style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
              {lang === 'hi' ? 'मंडी 1' : 'Mandi 1'}
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '4px 0' }}>
              {lang === 'hi' ? mandiA.market_hi : mandiA.market_en}
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: '12px' }}>
              📍 {mandiA.district}, {mandiA.state} • ~{distA} km
            </p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
              ₹{priceA.toLocaleString('en-IN')}<span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}> / qtl</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
              {mandiA.commodity_hi || mandiA.commodity_en} ({mandiA.variety})
            </div>
          </div>

          {/* Mandi B */}
          <div style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
              {lang === 'hi' ? 'मंडी 2' : 'Mandi 2'}
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '4px 0' }}>
              {lang === 'hi' ? mandiB.market_hi : mandiB.market_en}
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: '12px' }}>
              📍 {mandiB.district}, {mandiB.state} • ~{distB} km
            </p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
              ₹{priceB.toLocaleString('en-IN')}<span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}> / qtl</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
              {mandiB.commodity_hi || mandiB.commodity_en} ({mandiB.variety})
            </div>
          </div>
        </div>

        {/* Inputs row: Quantity & Transport Cost */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-dim)', marginBottom: '6px' }}>
              🌾 {lang === 'hi' ? 'फसल की कुल मात्रा (क्विंटल):' : 'Estimated Harvest Quantity (Quintals):'}
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={quantityQtl}
              onChange={(e) => setQuantityQtl(Number(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-card-border)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-dim)', marginBottom: '6px' }}>
              🚚 {lang === 'hi' ? 'अनुमानित परिवहन खर्च (₹ / km):' : 'Estimated Transit Cost (₹ / km):'}
            </label>
            <input
              type="number"
              min="0"
              max="150"
              value={transitCostPerKm}
              onChange={(e) => setTransitCostPerKm(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-card-border)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700
              }}
            />
          </div>
        </div>

        {/* The Result / Sahi Munafa Decision Box */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 34, 25, 0.4) 100%)',
          border: '2px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                💡 {lang === 'hi' ? 'सही फ़ैसला (Sahi Decision)' : 'Smart Selling Recommendation'}
              </span>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '4px 0' }}>
                {winnerName} {lang === 'hi' ? 'जाना अधिक लाभदायक रहेगा' : 'is the most profitable mandi'}
              </h3>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', margin: 0 }}>
                {lang === 'hi' 
                  ? `परिवहन खर्च काटने के बाद भी ₹${Math.abs(netGain).toLocaleString('en-IN')} का शुद्ध अतिरिक्त मुनाफ़ा होगा।`
                  : `Even after transit fuel expenses, you will earn an extra net ₹${Math.abs(netGain).toLocaleString('en-IN')}.`}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                {lang === 'hi' ? 'शुद्ध मुनाफ़ा अंतर' : 'Net Take-Home Gain'}
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                +₹{Math.abs(netGain).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Transparent formula breakdown */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.78rem',
            color: 'var(--color-text-dim)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <span>⚖️ {lang === 'hi' ? 'भाव अंतर' : 'Rate Delta'}: ₹{Math.abs(priceDiffPerQtl)}/क्विंटल</span>
            <span>📍 {lang === 'hi' ? 'दूरी अंतर' : 'Distance Delta'}: ~{distDiff} km</span>
            <span>🚚 {lang === 'hi' ? 'कुल परिवहन अंतर' : 'Transit Cost Delta'}: ₹{transitDiffTotal}</span>
          </div>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleShareWhatsApp}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: '#25D366',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            💬 {lang === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-card-border)',
              color: 'var(--color-text-main)',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
