import React, { useState, useEffect } from 'react';
import MandiCard from './components/MandiCard.jsx';
import { CROP_DICTIONARY, findCropByQuery } from './data/cropDictionary.js';
import { fetchLiveGovPrices } from './services/govPriceService.js';
import { detectUserLocation, calculateDistanceKm, DISTRICT_COORDINATES } from './services/locationService.js';
import { saveSyncedData, getCachedStateData, getLastSyncTime, getRelativeTimeString } from './services/syncService.js';

const STATES = [
  'Madhya Pradesh',
  'Rajasthan',
  'Uttar Pradesh',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Gujarat'
];

export default function App() {
  const [lang, setLang] = useState('hi'); // 'hi' or 'en'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [dataMeta, setDataMeta] = useState(null);
  const [selectedState, setSelectedState] = useState('Madhya Pradesh');
  const [dataSourceMode, setDataSourceMode] = useState('live'); // 'live' or 'offline'
  const [liveStatusText, setLiveStatusText] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [lastSyncString, setLastSyncString] = useState('');

  // Update relative sync time periodically
  useEffect(() => {
    const updateSyncLabel = () => {
      const last = getLastSyncTime();
      setLastSyncString(getRelativeTimeString(last, lang));
    };
    updateSyncLabel();
    const interval = setInterval(updateSyncLabel, 30000);
    return () => clearInterval(interval);
  }, [lang]);

  // Handle Location Detection
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const loc = await detectUserLocation();
      setUserLocation(loc);
      if (loc.state && STATES.includes(loc.state)) {
        setSelectedState(loc.state);
      }
    } catch (err) {
      console.warn('Geolocation permission denied or timed out:', err.message);
      alert(lang === 'hi' 
        ? 'स्थान अनुमति प्राप्त नहीं हुई। कृपया सूची से अपना राज्य चुनें।' 
        : 'Location access denied or unavailable. Please select your state manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  // Fetch prices based on mode with auto-caching
  const loadPrices = async (mode = dataSourceMode, state = selectedState) => {
    setLoading(true);
    setSyncing(true);

    if (mode === 'live') {
      const result = await fetchLiveGovPrices({ state, limit: 80 });
      if (result.success && result.records.length > 0) {
        // Compute distance dynamically if user location is available
        const enhancedRecords = result.records.map(r => {
          if (userLocation && r.district) {
            const distKey = r.district.toLowerCase();
            const coord = DISTRICT_COORDINATES[distKey];
            if (coord) {
              const d = calculateDistanceKm(userLocation.latitude, userLocation.longitude, coord.lat, coord.lon);
              return { ...r, distance_km: d };
            }
          }
          return r;
        });

        // Save to offline storage
        saveSyncedData(state, enhancedRecords, result.totalLive);
        setRecords(enhancedRecords);
        setDataMeta({
          isLive: true,
          total: result.totalLive,
          source: result.source,
          updatedDate: result.updatedDate
        });
        setLiveStatusText(lang === 'hi' ? `सरकारी पोर्टल पर कुल ${result.totalLive} रिकॉर्ड उपलब्ध` : `${result.totalLive} live records on data.gov.in`);
        setLastSyncString(getRelativeTimeString(new Date().toISOString(), lang));
        setLoading(false);
        setSyncing(false);
        return;
      }
    }

    // Check local cached state data first
    const cached = getCachedStateData(state);
    if (cached && cached.records && cached.records.length > 0) {
      setRecords(cached.records);
      setDataMeta({
        isLive: false,
        source: 'स्थानीय कैश्ड सरकारी डेटा (Local Cache)',
        updatedDate: cached.timestamp
      });
      setLiveStatusText(lang === 'hi' ? 'ऑफ़लाइन लोकल कैश्ड डेटा लोड हुआ' : 'Loaded from offline synced cache');
      setLoading(false);
      setSyncing(false);
      return;
    }

    // Fallback to static snapshot
    fetch('/data/mandi_snapshot.json')
      .then(res => res.json())
      .then(data => {
        setRecords(data.records || []);
        setDataMeta({
          isLive: false,
          source: data.source_name,
          updatedDate: data.last_updated
        });
        setLoading(false);
        setSyncing(false);
      })
      .catch(err => {
        console.error('Failed to load mandi snapshot:', err);
        setLoading(false);
        setSyncing(false);
      });
  };

  useEffect(() => {
    loadPrices(dataSourceMode, selectedState);
  }, [dataSourceMode, selectedState]);

  const t = {
    hi: {
      appName: 'सही भाव',
      tagline: 'किसान-प्रथम मंडी भाव और सही मुनाफ़ा मार्गदर्शक',
      searchPlaceholder: 'फसल खोजें (उदा. गेहूं, सरसों, सोयाबीन, चना, प्याज़)...',
      allCrops: 'सभी फसलें',
      verifiedTag: 'सत्यापित सुबह की नीलामी',
      showingResults: 'उपलब्ध भाव रिकॉर्ड',
      noResults: 'इस राज्य/फसल में कोई रिकॉर्ड नहीं मिला। कृपया अन्य फसल या राज्य चुनें।',
      compareBanner: 'मंडी तुलना पैनल',
      clearCompare: 'तुलना हटाएं',
      lastUpdated: 'अंतिम अपडेट',
      liveBadge: '🟢 लाइव सरकारी डेटा (data.gov.in)',
      offlineBadge: '📶 ऑफ़लाइन बैकअप स्नैपशॉट',
      refresh: 'सिंक करें',
      detectLoc: '📍 मेरी लोकेशन पहचानें',
      detecting: 'लोकेशन पहचानी जा रही है...',
      nearestMandi: 'निकटतम मंडी',
      syncedLabel: 'डेटा सिंक'
    },
    en: {
      appName: 'SahiBhav',
      tagline: 'Farmer-First Mandi Price Transparency & Profit Guide',
      searchPlaceholder: 'Search crop (e.g. Wheat, Mustard, Soybean, Gram, Onion)...',
      allCrops: 'All Crops',
      verifiedTag: 'Verified Morning Auctions',
      showingResults: 'Available Price Records',
      noResults: 'No records found for this crop/state. Please try another selection.',
      compareBanner: 'Mandi Comparison Panel',
      clearCompare: 'Clear Selection',
      lastUpdated: 'Last Updated',
      liveBadge: '🟢 Live Gov Feed (data.gov.in)',
      offlineBadge: '📶 Offline Snapshot Backup',
      refresh: 'Sync Live',
      detectLoc: '📍 Auto Detect Location',
      detecting: 'Detecting Location...',
      nearestMandi: 'Nearest Mandis',
      syncedLabel: 'Data Sync'
    }
  }[lang];

  // Filter records
  const filteredRecords = records.filter(record => {
    if (selectedCropId !== 'all' && record.commodity_id !== selectedCropId) {
      return false;
    }

    if (searchQuery.trim()) {
      const match = findCropByQuery(searchQuery);
      if (match && record.commodity_id === match.id) {
        return true;
      }
      const q = searchQuery.toLowerCase();
      const inHi = (record.commodity_hi || '').toLowerCase().includes(q) || (record.market_hi || '').toLowerCase().includes(q);
      const inEn = (record.commodity_en || '').toLowerCase().includes(q) || (record.market_en || '').toLowerCase().includes(q);
      const inVariety = (record.variety || '').toLowerCase().includes(q);
      return inHi || inEn || inVariety;
    }

    return true;
  });

  const handleToggleCompare = (record) => {
    if (selectedForCompare.some(r => r.id === record.id)) {
      setSelectedForCompare(selectedForCompare.filter(r => r.id !== record.id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], record]);
      } else {
        setSelectedForCompare([...selectedForCompare, record]);
      }
    }
  };

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{
        background: 'linear-gradient(180deg, #102219 0%, #09130e 100%)',
        borderBottom: '1px solid var(--color-card-border)',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/logo.jpeg" 
              alt="SahiBhav Logo" 
              style={{ width: '42px', height: '42px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)', letterSpacing: '-0.02em', margin: 0 }}>
                  {t.appName}
                </h1>
                
                {/* Live vs Offline Tag */}
                <span style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: dataMeta?.isLive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: dataMeta?.isLive ? 'var(--color-primary-light)' : 'var(--color-accent)',
                  fontWeight: 700,
                  border: dataMeta?.isLive ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  {dataMeta?.isLive ? t.liveBadge : t.offlineBadge}
                </span>

                {/* Last Synced Pill */}
                {lastSyncString && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--color-text-dim)',
                    border: '1px solid var(--color-card-border)'
                  }}>
                    ⚡ {lastSyncString}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', margin: 0 }}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Right Header Controls: Feed Mode & Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mode switch */}
            <button
              onClick={() => setDataSourceMode(dataSourceMode === 'live' ? 'offline' : 'live')}
              title={lang === 'hi' ? 'लाइव या ऑफ़लाइन मोड बदलें' : 'Toggle Live/Offline feed'}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: dataSourceMode === 'live' ? '#14532d' : 'var(--color-surface)',
                border: '1px solid var(--color-card-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              {dataSourceMode === 'live' ? '🟢 Live' : '📶 Offline'}
            </button>

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
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ padding: '20px 16px', flex: 1 }}>
        {/* Controls Bar: Search, Auto Location, State Select */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '10px',
          marginBottom: '16px'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-card-border)',
                color: 'var(--color-text-main)',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-dim)',
                  fontSize: '0.9rem',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Auto Detect Location Button */}
          <button
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            style={{
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              background: userLocation ? 'rgba(34, 197, 94, 0.15)' : 'var(--color-surface)',
              border: userLocation ? '1px solid var(--color-primary)' : '1px solid var(--color-card-border)',
              color: userLocation ? 'var(--color-primary-light)' : 'var(--color-text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            {detectingLocation ? t.detecting : userLocation ? `📍 ${userLocation.district || userLocation.state}` : t.detectLoc}
          </button>

          {/* State Dropdown Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-card-border)',
              color: 'var(--color-text-main)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {STATES.map(s => (
              <option key={s} value={s} style={{ background: '#102219', color: '#fff' }}>
                📍 {s}
              </option>
            ))}
          </select>
        </div>

        {/* Crop Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => { setSelectedCropId('all'); setSearchQuery(''); }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: selectedCropId === 'all' && !searchQuery ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedCropId === 'all' && !searchQuery ? '#052e16' : 'var(--color-text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              border: '1px solid var(--color-card-border)'
            }}
          >
            🌱 {t.allCrops}
          </button>
          {CROP_DICTIONARY.map(crop => (
            <button
              key={crop.id}
              onClick={() => { setSelectedCropId(crop.id); setSearchQuery(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: selectedCropId === crop.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: selectedCropId === crop.id ? '#052e16' : 'var(--color-text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                border: '1px solid var(--color-card-border)'
              }}
            >
              {crop.icon} {lang === 'hi' ? crop.name_hi : crop.name_en}
            </button>
          ))}
        </div>

        {/* Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px',
          fontSize: '0.85rem',
          color: 'var(--color-text-dim)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div>
            {t.showingResults}: <strong style={{ color: 'var(--color-primary-light)' }}>{filteredRecords.length}</strong>
            {liveStatusText && <span style={{ marginLeft: '10px', color: 'var(--color-primary)' }}>• {liveStatusText}</span>}
          </div>
          
          <button
            onClick={() => loadPrices(dataSourceMode, selectedState)}
            disabled={syncing}
            style={{
              color: 'var(--color-primary-light)',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🔄 {syncing ? 'सिंक हो रहा है...' : t.refresh}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-primary-light)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🌾</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {lang === 'hi' ? 'data.gov.in से लाइव सरकारी मंडी भाव लोड हो रहे हैं...' : 'Fetching live government mandi prices from data.gov.in...'}
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{
            background: 'var(--color-card)',
            border: '1px dashed var(--color-card-border)',
            borderRadius: 'var(--radius-md)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--color-text-dim)'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>🌾 {t.noResults}</p>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {filteredRecords.map(record => (
              <MandiCard
                key={record.id}
                record={record}
                lang={lang}
                isSelectedForCompare={selectedForCompare.some(r => r.id === record.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Comparison Drawer if 1 or 2 mandis selected */}
      {selectedForCompare.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '800px',
          background: 'linear-gradient(180deg, #162f22 0%, #0d1b13 100%)',
          border: '2px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
              ⚖️ {t.compareBanner} ({selectedForCompare.length}/2)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-main)', marginTop: '2px' }}>
              {selectedForCompare.map(r => lang === 'hi' ? r.market_hi : r.market_en).join('  vs  ')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedForCompare([])}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--color-text-dim)',
                fontSize: '0.75rem'
              }}
            >
              ✕ {t.clearCompare}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-card-border)',
        padding: '16px 0',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--color-text-dim)',
        background: 'var(--color-surface)'
      }}>
        <div className="container">
          SahiBhav 🌾 • {lang === 'hi' ? 'कृषि मंत्रालय, भारत सरकार के आधिकारिक ओपन डेटा पर आधारित' : 'Powered by Open Government Data (data.gov.in) • Ministry of Agriculture'}
        </div>
      </footer>
    </div>
  );
}
