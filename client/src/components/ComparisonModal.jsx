import React, { useState, useEffect } from 'react';
import { getGeminiComparisonExplanation } from '../services/aiAdvisorService.js';

export default function ComparisonModal({ mandis, lang, onClose }) {
  if (!mandis || mandis.length < 2) return null;

  const [mandiA, mandiB] = mandis;

  // Farmer inputs for Net Profit calculation
  const [quantityQtl, setQuantityQtl] = useState(25); // 25 Quintals
  const [transitCostPerKm, setTransitCostPerKm] = useState(20); // ₹20/km

  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  const winnerName = lang === 'hi' 
    ? (recommendedMandi.market_hi || recommendedMandi.market_en) 
    : (recommendedMandi.market_en || recommendedMandi.market_hi);

  const isAWinner = recommendedMandi.id === mandiA.id;

  // Fetch Gemini explanation on mount and whenever parameters change
  useEffect(() => {
    let isCurrent = true;
    setIsAiLoading(true);

    getGeminiComparisonExplanation({
      mandiA: lang === 'hi' ? mandiA.market_hi : mandiA.market_en,
      mandiB: lang === 'hi' ? mandiB.market_hi : mandiB.market_en,
      commodity: lang === 'hi' ? (mandiA.commodity_hi || mandiA.commodity_en) : mandiA.commodity_en,
      priceA,
      priceB,
      distA,
      distB,
      quantityQtl,
      netGain,
      recommendedMandiName: winnerName,
      lang
    }).then(res => {
      if (isCurrent) {
        setAiAdvice(res.text);
        setIsAiLoading(false);
      }
    });

    return () => {
      isCurrent = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [mandiA, mandiB, quantityQtl, transitCostPerKm, lang, winnerName, netGain]);

  // Read aloud TTS
  const handleSpeakAdvice = () => {
    if (!window.speechSynthesis || !aiAdvice) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(aiAdvice);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Share summary via WhatsApp
  const handleShareWhatsApp = () => {
    const nameA = lang === 'hi' ? (mandiA.market_hi || mandiA.market_en) : (mandiA.market_en || mandiA.market_hi);
    const nameB = lang === 'hi' ? (mandiB.market_hi || mandiB.market_en) : (mandiB.market_en || mandiB.market_hi);

    const text = lang === 'hi' 
      ? `🌾 *सही भाव (SahiBhav) मंडी तुलना रिपोर्ट*\n\n` +
        `📍 *मंडी 1:* ${nameA} - ₹${priceA}/क्विंटल (~${distA} km)\n` +
        `📍 *मंडी 2:* ${nameB} - ₹${priceB}/क्विंटल (~${distB} km)\n\n` +
        `⚖️ *भाव अंतर:* ₹${Math.abs(priceDiffPerQtl)}/क्विंटल\n` +
        `🚚 *कुल मात्रा:* ${quantityQtl} क्विंटल\n` +
        `💰 *अनुमानित शुद्ध मुनाफ़ा:* ₹${Math.abs(netGain).toLocaleString('en-IN')}\n\n` +
        `🤖 *जेमिनी एआई सलाह:* ${aiAdvice || winnerName + ' जाना अधिक फायदेमंद रहेगा।'}\n\n` +
        `_सत्यापित स्रोत: data.gov.in (कृषि मंत्रालय, भारत सरकार)_`
      : `🌾 *SahiBhav Mandi Comparison Report*\n\n` +
        `📍 *Market 1:* ${nameA} - ₹${priceA}/qtl (~${distA} km)\n` +
        `📍 *Market 2:* ${nameB} - ₹${priceB}/qtl (~${distB} km)\n\n` +
        `⚖️ *Price Delta:* ₹${Math.abs(priceDiffPerQtl)}/qtl\n` +
        `🚚 *Harvest Quantity:* ${quantityQtl} Quintals\n` +
        `💰 *Estimated Net Profit:* ₹${Math.abs(netGain).toLocaleString('en-IN')}\n\n` +
        `🤖 *Gemini AI Insight:* ${aiAdvice || 'Selling at ' + winnerName + ' gives the best return.'}\n\n` +
        `_Verified Source: data.gov.in (Ministry of Agriculture)_`;

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
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 200
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        maxWidth: '820px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f1f5f9',
            color: '#475569',
            borderRadius: 'var(--radius-full)',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            cursor: 'pointer',
            border: '1px solid #e2e8f0'
          }}
        >
          ✕
        </button>

        {/* Title & Subtitle */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>
            ⚖️ {lang === 'hi' ? 'मंडी तुलना व सही मुनाफ़ा कैलकुलेटर' : 'Mandi Comparison & Net Profit Engine'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
            {lang === 'hi' 
              ? 'परिवहन लागत व फसल मात्रा को जोड़कर वास्तविक जेब में आने वाले शुद्ध मुनाफ़े की गणना' 
              : 'Deterministic take-home profit calculated after transit distance and fuel expenses'}
          </p>
        </div>

        {/* Side-by-side Mandi Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Mandi A */}
          <div style={{
            background: isAWinner ? '#f0fdf4' : '#f8fafc',
            border: isAWinner ? '2px solid #22c55e' : '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            boxShadow: isAWinner ? '0 4px 12px rgba(34, 197, 94, 0.12)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'मंडी 1' : 'Mandi 1'}
              </span>
              {isAWinner && (
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  🏆 {lang === 'hi' ? 'अधिक मुनाफ़ा' : 'Best Return'}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '6px 0 2px 0' }}>
              {lang === 'hi' ? (mandiA.market_hi || mandiA.market_en) : (mandiA.market_en || mandiA.market_hi)}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '14px', fontWeight: 500 }}>
              📍 {mandiA.district}, {mandiA.state} • ~{distA} km
            </p>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
              ₹{priceA.toLocaleString('en-IN')}<span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}> / {lang === 'hi' ? 'क्विंटल' : 'qtl'}</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 700, marginTop: '4px' }}>
              ≈ ₹{(priceA / 100).toFixed(2)} / {lang === 'hi' ? 'किलो (kg)' : 'kg'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              {mandiA.commodity_hi || mandiA.commodity_en} ({mandiA.variety || 'Standard'})
            </div>
          </div>

          {/* Mandi B */}
          <div style={{
            background: !isAWinner ? '#f0fdf4' : '#f8fafc',
            border: !isAWinner ? '2px solid #22c55e' : '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            boxShadow: !isAWinner ? '0 4px 12px rgba(34, 197, 94, 0.12)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'मंडी 2' : 'Mandi 2'}
              </span>
              {!isAWinner && (
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  🏆 {lang === 'hi' ? 'अधिक मुनाफ़ा' : 'Best Return'}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '6px 0 2px 0' }}>
              {lang === 'hi' ? (mandiB.market_hi || mandiB.market_en) : (mandiB.market_en || mandiB.market_hi)}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '14px', fontWeight: 500 }}>
              📍 {mandiB.district}, {mandiB.state} • ~{distB} km
            </p>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
              ₹{priceB.toLocaleString('en-IN')}<span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}> / {lang === 'hi' ? 'क्विंटल' : 'qtl'}</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 700, marginTop: '4px' }}>
              ≈ ₹{(priceB / 100).toFixed(2)} / {lang === 'hi' ? 'किलो (kg)' : 'kg'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
              {mandiB.commodity_hi || mandiB.commodity_en} ({mandiB.variety || 'Standard'})
            </div>
          </div>
        </div>

        {/* Inputs row: Quantity & Transport Cost */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              🌾 {lang === 'hi' ? `फसल मात्रा: ${quantityQtl} क्विंटल (${(quantityQtl * 100).toLocaleString('en-IN')} kg)` : `Harvest Quantity: ${quantityQtl} Quintals`}
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
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#111827',
                fontSize: '1.05rem',
                fontWeight: 700
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              🚚 {lang === 'hi' ? 'अनुमानित परिवहन खर्च (₹ / km):' : 'Estimated Transit Expense (₹ / km):'}
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
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#111827',
                fontSize: '1.05rem',
                fontWeight: 700
              }}
            />
          </div>
        </div>

        {/* ✨ Gemini AI Advisor Box */}
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ✨ {lang === 'hi' ? 'जेमिनी एआई किसान सलाहकार (Gemini 3.5 Flash Lite)' : 'Gemini 3.5 Flash Lite AI Advisor'}
            </span>

            <button
              onClick={handleSpeakAdvice}
              disabled={isAiLoading || !aiAdvice}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: isSpeaking ? '#ef4444' : '#15803d',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {isSpeaking ? '⏹️ ' + (lang === 'hi' ? 'रोकें' : 'Stop') : '🔊 ' + (lang === 'hi' ? 'सुनो' : 'Listen')}
            </button>
          </div>

          <p style={{
            fontSize: '0.94rem',
            color: '#14532d',
            margin: 0,
            lineHeight: 1.6,
            fontWeight: 500,
            fontStyle: isAiLoading ? 'italic' : 'normal'
          }}>
            {isAiLoading 
              ? (lang === 'hi' ? '✨ जेमिनी एआई सलाह तैयार कर रहा है...' : '✨ Gemini AI is analyzing best mandi returns...') 
              : `"${aiAdvice}"`}
          </p>
        </div>

        {/* Decision & Financial Breakdown Banner */}
        <div style={{
          background: '#dcfce7',
          border: '1.5px solid #86efac',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'hi' ? 'सही निर्णय (अनुशंसित मंडी)' : 'Recommended Market'}
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#14532d', marginTop: '2px' }}>
              🏆 {winnerName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '4px', fontWeight: 600 }}>
              ⚖️ {lang === 'hi' ? 'भाव अंतर' : 'Price Delta'}: ₹{Math.abs(priceDiffPerQtl)}/qtl • 📍 {lang === 'hi' ? 'दूरी अंतर' : 'Distance Delta'}: ~{distDiff} km
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'hi' ? 'अतिरिक्त शुद्ध मुनाफ़ा' : 'Net Take-Home Gain'}
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803d', lineHeight: 1.1 }}>
              +₹{Math.abs(netGain).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Share & Close Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleShareWhatsApp}
            style={{
              padding: '12px 22px',
              borderRadius: 'var(--radius-full)',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
            }}
          >
            💬 {lang === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px 22px',
              borderRadius: 'var(--radius-full)',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
