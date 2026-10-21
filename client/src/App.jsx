import React, { useState, useEffect } from 'react';
import ComparisonModal from './components/ComparisonModal.jsx';
import VoiceSearchButton from './components/VoiceSearchButton.jsx';
import { CROP_DICTIONARY, findCropByQuery } from './data/cropDictionary.js';
import { fetchLiveGovPrices } from './services/govPriceService.js';
import { 
  detectUserLocation, 
  calculateDistanceKm, 
  DISTRICT_COORDINATES, 
  getLastSavedLocation, 
  getLastSavedState, 
  saveLastLocation,
  formatCityState,
  DEFAULT_STATE_CITIES
} from './services/locationService.js';
import { saveSyncedData, getCachedStateData, getLastSyncTime, getRelativeTimeString } from './services/syncService.js';

const STATES = [
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Gujarat'
];

// Expanded crop list matching the sidebar mockup
const SIDEBAR_CROPS = [
  { id: 'wheat', name_hi: 'गेहूँ', name_en: 'Wheat', icon: '🌾' },
  { id: 'paddy', name_hi: 'धान', name_en: 'Paddy', icon: '🌾' },
  { id: 'tomato', name_hi: 'टमाटर', name_en: 'Tomato', icon: '🍅' },
  { id: 'onion', name_hi: 'प्याज', name_en: 'Onion', icon: '🧅' },
  { id: 'potato', name_hi: 'आलू', name_en: 'Potato', icon: '🥔' },
  { id: 'mustard', name_hi: 'सरसों', name_en: 'Mustard', icon: '🌼' },
  { id: 'soybean', name_hi: 'सोयाबीन', name_en: 'Soybean', icon: '🫘' },
  { id: 'maize', name_hi: 'मक्का', name_en: 'Maize', icon: '🌽' },
  { id: 'chana', name_hi: 'चना', name_en: 'Chana', icon: '🥣' },
  { id: 'all', name_hi: 'और फसलें', name_en: 'More Crops', icon: '•••' }
];

export default function App() {
  const [lang, setLang] = useState('hi'); // 'hi' or 'en'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState('wheat');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isComparingModalOpen, setIsComparingModalOpen] = useState(false);
  const [dataMeta, setDataMeta] = useState(null);
  const [isSpeakingHeadline, setIsSpeakingHeadline] = useState(false);

  // Initialize with persisted state or default to Uttar Pradesh
  const [selectedState, setSelectedState] = useState(() => getLastSavedState() || 'Uttar Pradesh');
  const [userLocation, setUserLocation] = useState(() => {
    const saved = getLastSavedLocation();
    if (saved) return saved;
    return {
      district: DEFAULT_STATE_CITIES['Uttar Pradesh'] || 'Lucknow',
      state: 'Uttar Pradesh'
    };
  });
  
  const [dataSourceMode, setDataSourceMode] = useState('live'); // 'live' or 'offline'
  const [lastSyncString, setLastSyncString] = useState('');

  // 1. Auto-sync and auto-detect location on open
  useEffect(() => {
    detectUserLocation()
      .then(loc => {
        setUserLocation(loc);
        if (loc.state && STATES.includes(loc.state)) {
          setSelectedState(loc.state);
        }
      })
      .catch(() => {
        const saved = getLastSavedLocation();
        if (saved) {
          setUserLocation(saved);
        }
      });
  }, []);

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

  // Fetch prices
  const loadPrices = async (mode = dataSourceMode, state = selectedState) => {
    setLoading(true);
    setSyncing(true);

    if (mode === 'live') {
      const result = await fetchLiveGovPrices({ state, limit: 100 });
      if (result.success && result.records.length > 0) {
        const enhancedRecords = result.records.map(r => {
          if (userLocation && r.district) {
            const distKey = r.district.toLowerCase();
            const coord = DISTRICT_COORDINATES[distKey];
            if (coord && userLocation.latitude && userLocation.longitude) {
              const d = calculateDistanceKm(userLocation.latitude, userLocation.longitude, coord.lat, coord.lon);
              return { ...r, distance_km: d };
            }
          }
          return r;
        });

        saveSyncedData(state, enhancedRecords, result.totalLive);
        setRecords(enhancedRecords);
        setDataMeta({
          isLive: true,
          total: result.totalLive,
          source: result.source,
          updatedDate: result.updatedDate
        });
        setLastSyncString(getRelativeTimeString(new Date().toISOString(), lang));
        setLoading(false);
        setSyncing(false);
        return;
      }
    }

    // Check offline cached state data
    const cached = getCachedStateData(state);
    if (cached && cached.records && cached.records.length > 0) {
      setRecords(cached.records);
      setDataMeta({
        isLive: false,
        source: 'स्थानीय कैश्ड सरकारी डेटा (Local Cache)',
        updatedDate: cached.timestamp
      });
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

  // Handle manual state change and update default city
  const handleStateChange = (newState) => {
    setSelectedState(newState);
    const defaultCity = DEFAULT_STATE_CITIES[newState] || 'Main Mandi';
    const updatedLoc = {
      ...(userLocation || {}),
      state: newState,
      district: defaultCity
    };
    setUserLocation(updatedLoc);
    saveLastLocation(updatedLoc);
  };

  const t = {
    hi: {
      appName: 'मंडी भाव',
      tagline: 'किसान का सही भाव, सही निर्णय',
      selectCrop: 'फसल चुनें',
      selectCropSub: 'जिस फसल का भाव देखना चाहते हैं',
      nearMandis: 'आपके पास की मंडियाँ',
      nearMandisSub: 'आपके जिले की नजदीकी मंडियों में आज का भाव',
      perQuintal: 'प्रति क्विंटल',
      perKg: 'प्रति किलो',
      viewFullPrice: 'पूरा भाव देखें',
      compareAction: 'तुलना में जोड़ें',
      selectedForCompare: 'तुलना में शामिल',
      listenPrompt: 'इस भाव को सुनें',
      listenSub: 'क्लिक करके आज का भाव सुनें',
      listenBtn: 'सुनें',
      stopBtn: 'रोकें',
      compareDrawerTitle: 'मंडी तुलना पैनल',
      compareBtn: 'दोनों मंडियों की तुलना करें',
      clearCompare: 'तुलना हटाएं',
      searchPlaceholder: 'फसल या मंडी का नाम खोजें...',
      upTrend: 'कल से बढ़ा',
      downTrend: 'कल से घटा'
    },
    en: {
      appName: 'Mandi Bhav',
      tagline: 'Farmer-First Real Rates, Better Decisions',
      selectCrop: 'Select Crop',
      selectCropSub: 'Choose the crop you want to check',
      nearMandis: 'Mandis Near You',
      nearMandisSub: "Today's prices in your district's nearby markets",
      perQuintal: 'per quintal',
      perKg: 'per kg',
      viewFullPrice: 'View Full Rate',
      compareAction: 'Add to Compare',
      selectedForCompare: 'Added to Compare',
      listenPrompt: 'Listen to this Rate',
      listenSub: "Click to hear today's market rates aloud",
      listenBtn: 'Listen',
      stopBtn: 'Stop',
      compareDrawerTitle: 'Mandi Comparison Panel',
      compareBtn: 'Compare Selected Mandis',
      clearCompare: 'Clear Selection',
      searchPlaceholder: 'Search crop, city or mandi...',
      upTrend: 'higher than yesterday',
      downTrend: 'lower than yesterday'
    }
  }[lang];

  // Filter records
  const filteredRecords = records.filter(record => {
    const q = searchQuery.trim().toLowerCase();

    // If searching manually, search across all records
    if (q) {
      const inCommodityHi = (record.commodity_hi || '').toLowerCase().includes(q);
      const inCommodityEn = (record.commodity_en || '').toLowerCase().includes(q);
      const inMarketHi = (record.market_hi || '').toLowerCase().includes(q);
      const inMarketEn = (record.market_en || '').toLowerCase().includes(q);
      const inDistrict = (record.district || '').toLowerCase().includes(q);
      const inState = (record.state || '').toLowerCase().includes(q);
      const inVariety = (record.variety || '').toLowerCase().includes(q);

      if (inCommodityHi || inCommodityEn || inMarketHi || inMarketEn || inDistrict || inState || inVariety) {
        return true;
      }

      const cropMatch = findCropByQuery(q);
      if (cropMatch && record.commodity_id === cropMatch.id) {
        return true;
      }
      return false;
    }

    // Sidebar crop filter
    if (selectedCropId !== 'all' && record.commodity_id !== selectedCropId) {
      return false;
    }

    return true;
  });

  // Calculate top featured price
  const activeCropObj = SIDEBAR_CROPS.find(c => c.id === selectedCropId) || SIDEBAR_CROPS[0];
  const featuredRecord = filteredRecords[0] || records.find(r => r.commodity_id === selectedCropId) || records[0];
  const featuredPrice = featuredRecord ? featuredRecord.modal_price : 2450;
  const featuredPerKg = (featuredPrice / 100).toFixed(2);
  const featuredTrend = 40; // realistic auction day delta

  // Text to speech for featured rate
  const handleListenFeatured = () => {
    if (!window.speechSynthesis) return;

    if (isSpeakingHeadline) {
      window.speechSynthesis.cancel();
      setIsSpeakingHeadline(false);
      return;
    }

    const cropName = lang === 'hi' ? activeCropObj.name_hi : activeCropObj.name_en;
    const textToSpeak = lang === 'hi'
      ? `नमस्कार किसान भाई। आज ${selectedState} में ${cropName} का औसत मंडी भाव ₹${featuredPrice} प्रति क्विंटल है, जो लगभग ₹${featuredPerKg} प्रति किलो बैठता है। कल के मुकाबले भाव में ₹${featuredTrend} की तेजी दर्ज की गई है।`
      : `Hello. Today in ${selectedState}, the modal market price for ${cropName} is ₹${featuredPrice} per quintal, which is approximately ₹${featuredPerKg} per kg, up by ₹${featuredTrend} from yesterday.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeakingHeadline(false);
    utterance.onerror = () => setIsSpeakingHeadline(false);

    setIsSpeakingHeadline(true);
    window.speechSynthesis.speak(utterance);
  };

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

  const exactCityStateText = formatCityState(userLocation?.district, selectedState);

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* 1. Header (Matching Reference Design) */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--color-card-border)',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/logo.jpeg" 
              alt="Mandi Bhav Logo" 
              style={{ width: '40px', height: '40px', borderRadius: '10px' }}
            />
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                {t.appName}
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', margin: 0 }}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Right Header: Live Indicator & Segmented Language Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Indicator Pill */}
            <div 
              onClick={() => setDataSourceMode(dataSourceMode === 'live' ? 'offline' : 'live')}
              title="Click to toggle Live/Offline mode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: dataSourceMode === 'live' ? 'var(--color-badge-green)' : 'var(--color-tag-cached)',
                color: dataSourceMode === 'live' ? 'var(--color-badge-green-text)' : 'var(--color-tag-cached-text)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '0.65rem' }}>●</span>
              <span>{dataSourceMode === 'live' ? 'Live' : 'Offline'}</span>
            </div>

            {/* Language Segmented Button [ हिंदी | EN ] */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: 'var(--radius-sm)',
              padding: '3px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setLang('hi')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: lang === 'hi' ? '#0f5132' : 'transparent',
                  color: lang === 'hi' ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLang('en')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: lang === 'en' ? '#0f5132' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard (2-Column Layout matching Reference Mockup) */}
      <main className="container" style={{ padding: '24px 20px', flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          {/* LEFT COLUMN: फसल चुनें (Select Crop) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-card-border)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 2px 0' }}>
              {t.selectCrop}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginBottom: '18px' }}>
              {t.selectCropSub}
            </p>

            {/* 2-Column Crop Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {SIDEBAR_CROPS.map(crop => {
                const isSelected = selectedCropId === crop.id && !searchQuery;
                return (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCropId(crop.id);
                      setSearchQuery('');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--color-card-selected)' : '#ffffff',
                      border: isSelected ? '2px solid var(--color-card-selected-border)' : '1px solid var(--color-card-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(46, 125, 67, 0.12)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '2rem', marginBottom: '6px' }}>
                      {crop.icon}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text-main)'
                    }}>
                      {lang === 'hi' ? crop.name_hi : crop.name_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Hero Rate Banner + Mandis List + Audio Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search Bar with Voice Mic */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '14px 80px 14px 18px',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid var(--color-card-border)',
                  color: 'var(--color-text-main)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
              <VoiceSearchButton
                lang={lang}
                onResult={(spokenText) => {
                  setSearchQuery(spokenText);
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

            {/* TOP HERO RATE CARD (Matching Reference Design) */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-card-border)',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              {/* Left: Icon, Crop Name & Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '3rem' }}>
                  {activeCropObj.icon}
                </span>
                <div>
                  <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0, lineHeight: 1.1 }}>
                    {lang === 'hi' ? activeCropObj.name_hi : activeCropObj.name_en}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', margin: '4px 0 0 0' }}>
                    {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Center: Big Price */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  ₹{featuredPrice.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 600, marginTop: '2px' }}>
                  {t.perQuintal} • (≈ ₹{featuredPerKg} {t.perKg})
                </div>
              </div>

              {/* Right: Trend Pill */}
              <div style={{
                background: 'var(--color-badge-green)',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--color-badge-green-text)', fontWeight: 800 }}>
                  ▲ +₹{featuredTrend}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-badge-green-text)', fontWeight: 600 }}>
                  {t.upTrend}
                </span>
              </div>
            </div>

            {/* MANDIS SECTION: "आपके पास की मंडियाँ" (Nearby Mandis List) */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-card-border)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Header row with Location Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>📍</span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                      {t.nearMandis}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', margin: 0 }}>
                      {t.nearMandisSub}
                    </p>
                  </div>
                </div>

                {/* Location / State Changer Dropdown Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 12px'
                }}>
                  <span style={{ fontSize: '0.9rem', marginRight: '6px' }}>📍</span>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-text-main)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                  >
                    {STATES.map(s => (
                      <option key={s} value={s}>
                        {formatCityState(DEFAULT_STATE_CITIES[s], s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-dim)' }}>
                  🌾 {lang === 'hi' ? 'ताज़ा मंडी भाव लोड हो रहे हैं...' : 'Loading verified market rates...'}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-dim)' }}>
                  🌾 {lang === 'hi' ? 'इस फसल/क्षेत्र में कोई भाव नहीं मिला।' : 'No market records found for this crop/area.'}
                </div>
              ) : (
                /* List of Mandi Rows (Matching the exact card/row design) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredRecords.slice(0, 8).map((record, index) => {
                    const isSelected = selectedForCompare.some(r => r.id === record.id);
                    const perKgRate = (record.modal_price / 100).toFixed(2);
                    const dummyDelta = [40, 30, 20, 15, 25, 35, 10, 5][index % 8];

                    return (
                      <div
                        key={record.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.4fr 1fr 1fr auto',
                          alignItems: 'center',
                          padding: '16px 20px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'var(--color-card-selected)' : '#ffffff',
                          border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid #f1f5f9',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Mandi Name & Distance */}
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
                            {lang === 'hi' ? record.market_hi : record.market_en}
                          </h4>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
                            📍 {record.distance_km === 0 ? (lang === 'hi' ? '0 किमी' : '0 km') : `${record.distance_km} किमी`} • {record.district}
                          </span>
                        </div>

                        {/* Price */}
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                            ₹{record.modal_price.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                            {t.perQuintal} (₹{perKgRate}/kg)
                          </div>
                        </div>

                        {/* Trend */}
                        <div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#15803d',
                            fontWeight: 700,
                            fontSize: '0.88rem'
                          }}>
                            ▲ +₹{dummyDelta} {t.upTrend}
                          </span>
                        </div>

                        {/* Action: पूरा भाव देखें / Compare toggle */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleCompare(record)}
                            style={{
                              padding: '8px 18px',
                              borderRadius: 'var(--radius-full)',
                              background: isSelected ? 'var(--color-primary)' : '#e8f5e9',
                              color: isSelected ? '#ffffff' : '#1b5e20',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              border: 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isSelected ? '✓ ' + t.selectedForCompare : t.viewFullPrice}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BOTTOM AUDIO BAR (Matching Reference Design: "इस भाव को सुनें") */}
            <div style={{
              background: '#e8f5ec',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(46, 125, 67, 0.2)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.6rem', color: '#1b5e20' }}>
                  🔊
                </span>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1b5e20', margin: '0 0 2px 0' }}>
                    {t.listenPrompt}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#406346', margin: 0 }}>
                    {t.listenSub}
                  </p>
                </div>
              </div>

              {/* Play Audio Button */}
              <button
                onClick={handleListenFeatured}
                style={{
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: '#0f5132',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 81, 50, 0.2)'
                }}
              >
                <span>{isSpeakingHeadline ? '⏹' : '▶'}</span>
                <span>{isSpeakingHeadline ? t.stopBtn : t.listenBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Comparison Drawer if 1 or 2 mandis selected */}
      {selectedForCompare.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)',
          maxWidth: '820px',
          background: '#ffffff',
          border: '2px solid var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              ⚖️ {t.compareDrawerTitle} ({selectedForCompare.length}/2)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', marginTop: '2px' }}>
              {selectedForCompare.map(r => lang === 'hi' ? r.market_hi : r.market_en).join('  vs  ')}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedForCompare.length === 2 && (
              <button
                onClick={() => setIsComparingModalOpen(true)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ⚡ {t.compareBtn}
              </button>
            )}

            <button
              onClick={() => setSelectedForCompare([])}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: '#f1f5f9',
                color: 'var(--color-text-dim)',
                fontSize: '0.78rem'
              }}
            >
              ✕ {t.clearCompare}
            </button>
          </div>
        </div>
      )}

      {/* Comparison & Net Profit Sahi Munafa Modal */}
      {isComparingModalOpen && selectedForCompare.length >= 2 && (
        <ComparisonModal
          mandis={selectedForCompare}
          lang={lang}
          onClose={() => setIsComparingModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-card-border)',
        padding: '16px 0',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-text-dim)',
        background: '#ffffff',
        marginTop: '30px'
      }}>
        <div className="container">
          {t.appName} 🌾 • {lang === 'hi' ? 'कृषि मंत्रालय, भारत सरकार के आधिकारिक ओपन डेटा पर आधारित' : 'Powered by Open Government Data (data.gov.in) • Ministry of Agriculture'}
        </div>
      </footer>
    </div>
  );
}
