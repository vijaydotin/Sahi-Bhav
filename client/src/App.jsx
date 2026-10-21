import React, { useState } from 'react';

export default function App() {
  const [lang, setLang] = useState('hi'); // 'hi' or 'en'

  const t = {
    hi: {
      appName: 'सही भाव',
      tagline: 'किसान-प्रथम मंडी भाव और सही मुनाफ़ा मार्गदर्शक',
      searchPlaceholder: 'फसल का नाम खोजें (उदा. गेहूं, सरसों, चना)...',
      verified: 'सत्यापित मंडी डेटा',
      offlineReady: 'ऑफ़लाइन सक्षम',
      compare: 'मंडी तुलना',
      recentArrivals: 'आज की प्रमुख आवक'
    },
    en: {
      appName: 'SahiBhav',
      tagline: 'Farmer-First Mandi Price Transparency & Profit Guide',
      searchPlaceholder: 'Search crop (e.g. Wheat, Mustard, Gram)...',
      verified: 'Verified Mandi Data',
      offlineReady: 'Offline Ready',
      compare: 'Compare Mandis',
      recentArrivals: "Today's Key Arrivals"
    }
  }[lang];

  return (
    <div className="app-layout">
      {/* Top Header */}
      <header style={{
        background: 'linear-gradient(180deg, #102219 0%, #09130e 100%)',
        borderBottom: '1px solid var(--color-card-border)',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/logo.jpeg" 
              alt="SahiBhav Logo" 
              style={{ width: '42px', height: '42px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)', letterSpacing: '-0.02em' }}>
                  {t.appName}
                </h1>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  🌾 {t.verified}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', margin: 0 }}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-card-border)',
              color: 'var(--color-text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🌐 {lang === 'hi' ? 'English' : 'हिंदी'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container" style={{ padding: '24px 16px' }}>
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-accent)' }}>
            🌱 {t.recentArrivals}
          </h2>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
            {lang === 'hi' 
              ? 'मंडी भाव व तुलना प्रणाली प्रारंभिक सेटअप में है। अगला चरण: वास्तविक डेटा लोड करना।' 
              : 'Mandi prices & comparison engine in setup. Next milestone: verified snapshot loading.'}
          </p>
        </div>
      </main>
    </div>
  );
}
