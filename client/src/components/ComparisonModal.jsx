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

  const winnerName = lang === 'hi' ? recommendedMandi.market_hi : recommendedMandi.market_en;

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
    const text = lang === 'hi' 
      ? `🌾 *सही भाव (SahiBhav) मंडी तुलना रिपोर्ट*\n\n` +
        `📍 *मंडी 1:* ${mandiA.market_hi} - ₹${priceA}/क्विंटल (~${distA} km)\n` +
        `📍 *मंडी 2:* ${mandiB.market_hi} - ₹${priceB}/क्विंटल (~${distB} km)\n\n` +
        `⚖️ *भाव अंतर:* ₹${Math.abs(priceDiffPerQtl)}/क्विंटल\n` +
        `🚚 *कुल मात्रा:* ${quantityQtl} क्विंटल\n` +
        `💰 *अनुमानित शुद्ध मुनाफ़ा:* ₹${Math.abs(netGain).toLocaleString('en-IN')}\n\n` +
        `🤖 *जेमिनी एआई सलाह:* ${aiAdvice || winnerName + ' जाना अधिक फायदेमंद रहेगा।'}\n\n` +
        `_सत्यापित स्रोत: data.gov.in (कृषि मंत्रालय, भारत सरकार)_`
      : `🌾 *SahiBhav Mandi Comparison Report*\n\n` +
        `📍 *Market 1:* ${mandiA.market_en} - ₹${priceA}/qtl (~${distA} km)\n` +
        `📍 *Market 2:* ${mandiB.market_en} - ₹${priceB}/qtl (~${distB} km)\n\n` +
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
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: '18px' }}>
          {lang === 'hi' 
            ? 'परिवहन लागत व फसल मात्रा को जोड़कर वास्तविक जेब में आने वाले मुनाफ़े की गणना' 
            : 'Deterministic take-home profit calculated after transit distance and fuel expenses'}
        </p>

        {/* Side-by-side Mandi Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '18px'
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
          marginBottom: '18px',
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

        {/* ✨ Gemini AI Advisor Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--color-primary-light)',
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
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: isSpeaking ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              {isSpeaking ? '⏹️ ' + (lang === 'hi' ? 'रोकें' : 'Stop') : '🔊 ' + (lang === 'hi' ? 'सुनो' : 'Listen')}
            </button>
          </div>

          <p style={{
            fontSize: '0.92rem',
            color: '#f0fdf4',
            margin: 0,
            lineHeight: 1.5,
            fontStyle: isAiLoading ? 'italic' : 'normal'
          }}>
            {isAiLoading 
              ? (lang === 'hi' ? '✨ जेमिनी एआई सलाह तैयार कर रहा है...' : '✨ Gemini AI is generating guidance...') 
              : `"${aiAdvice}"`}
          </p>
        </div>

        {/* Decision & Financial Breakdown */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              {lang === 'hi' ? 'अनुशंसित मंडी' : 'Recommended Market'}
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
              {winnerName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              ⚖️ {lang === 'hi' ? 'भाव अंतर' : 'Price Delta'}: ₹{Math.abs(priceDiffPerQtl)}/qtl • 📍 {lang === 'hi' ? 'दूरी अंतर' : 'Distance Delta'}: ~{distDiff} km
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              {lang === 'hi' ? 'शुद्ध मुनाफ़ा अंतर' : 'Net Take-Home Gain'}
            </span>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
              +₹{Math.abs(netGain).toLocaleString('en-IN')}
            </div>
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
