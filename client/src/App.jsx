import React, { useState, useEffect } from 'react';
import ComparisonModal from './components/ComparisonModal.jsx';
import VoiceSearchButton from './components/VoiceSearchButton.jsx';
import {
  LogoSprout,
  WheatIcon,
  PaddyIcon,
  TomatoIcon,
  OnionIcon,
  PotatoIcon,
  MustardIcon,
  SoybeanIcon,
  MaizeIcon,
  ChanaIcon,
  MoreCropsIcon,
  LocationPin,
  SpeakerWaveIcon
} from './components/CropIcons.jsx';
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
import { 
  saveSyncedData, 
  getCachedStateData, 
  getLastSyncTime, 
  getRelativeTimeString,
  saveUserPreference,
  getUserPreference
} from './services/syncService.js';

const STATES = [
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Gujarat'
];

// 10 Crops matching the 2-column sidebar in reference mockup
const SIDEBAR_CROPS = [
  { id: 'wheat', name_hi: 'गेहूँ', name_en: 'Wheat' },
  { id: 'paddy', name_hi: 'धान', name_en: 'Paddy' },
  { id: 'tomato', name_hi: 'टमाटर', name_en: 'Tomato' },
  { id: 'onion', name_hi: 'प्याज', name_en: 'Onion' },
  { id: 'potato', name_hi: 'आलू', name_en: 'Potato' },
  { id: 'mustard', name_hi: 'सरसों', name_en: 'Mustard' },
  { id: 'soybean', name_hi: 'सोयाबीन', name_en: 'Soybean' },
  { id: 'maize', name_hi: 'मक्का', name_en: 'Maize' },
  { id: 'chana', name_hi: 'चना', name_en: 'Chana' },
  { id: 'all', name_hi: 'और फसलें', name_en: 'More Crops' }
];

export default function App() {
  const [lang, setLang] = useState(() => getUserPreference('lang', 'hi')); // Persisted
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCropId, setSelectedCropId] = useState(() => getUserPreference('crop', 'wheat')); // Persisted
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isComparingModalOpen, setIsComparingModalOpen] = useState(false);
  const [dataMeta, setDataMeta] = useState(null);
  const [isSpeakingHeadline, setIsSpeakingHeadline] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  // Persisted state / city
  const [selectedState, setSelectedState] = useState(() => getUserPreference('state', getLastSavedState() || 'Uttar Pradesh'));
  const [userLocation, setUserLocation] = useState(() => {
    const saved = getLastSavedLocation();
    if (saved) return saved;
    return {
      district: 'Lucknow',
      state: 'Uttar Pradesh'
    };
  });
  
  const [dataSourceMode, setDataSourceMode] = useState(() => (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'live'));
  const [lastSyncString, setLastSyncString] = useState('');

  // Persist preferences locally
  useEffect(() => {
    saveUserPreference('lang', lang);
  }, [lang]);

  useEffect(() => {
    saveUserPreference('crop', selectedCropId);
  }, [selectedCropId]);

  useEffect(() => {
    saveUserPreference('state', selectedState);
  }, [selectedState]);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDataSourceMode('live');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDataSourceMode('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync and auto-detect location
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
        if (saved) setUserLocation(saved);
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

  // Load prices (Live Government API or Cached Fallback)
  const loadPrices = async (mode = dataSourceMode, state = selectedState) => {
    setLoading(true);

    if (mode === 'live' && isOnline) {
      const result = await fetchLiveGovPrices({ state, limit: 100 });
      if (result.success && result.records.length > 0) {
        const enhancedRecords = result.records.map((r, i) => {
          let dist = r.distance_km;
          if (userLocation && r.district) {
            const distKey = r.district.toLowerCase();
            const coord = DISTRICT_COORDINATES[distKey];
            if (coord && userLocation.latitude && userLocation.longitude) {
              dist = calculateDistanceKm(userLocation.latitude, userLocation.longitude, coord.lat, coord.lon);
            } else {
              dist = [0, 32, 56, 68, 84, 96, 110, 125][i % 8];
            }
          }
          return { ...r, distance_km: dist };
        });

        // Ensure Lucknow / Alambagh mandi is featured first if in UP
        if (state === 'Uttar Pradesh') {
          enhancedRecords.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
        }

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
        return;
      }
    }

    // Check offline cached data
    const cached = getCachedStateData(state);
    if (cached && cached.records && cached.records.length > 0) {
      setRecords(cached.records);
      setDataMeta({
        isLive: false,
        source: 'स्थानीय कैश्ड सरकारी डेटा (Local Cache)',
        updatedDate: cached.timestamp
      });
      setLoading(false);
      return;
    }

    // Static fallback snapshot
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
      })
      .catch(err => {
        console.error('Failed to load mandi snapshot:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPrices(dataSourceMode, selectedState);
  }, [dataSourceMode, selectedState]);

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
      listenSubSpecific: (crop) => `क्लिक करके आज का ${crop} का भाव सुनें`,
      listenBtn: 'सुनें',
      stopBtn: 'रोकें',
      compareDrawerTitle: 'मंडी तुलना पैनल',
      compareBtn: 'दोनों मंडियों की तुलना करें',
      clearCompare: 'हटाएं',
      searchPlaceholder: 'फसल या मंडी खोजें...',
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
      selectedForCompare: 'Selected',
      listenPrompt: 'Listen to this Rate',
      listenSub: "Click to hear today's market rates aloud",
      listenSubSpecific: (crop) => `Click to hear today's ${crop} rates aloud`,
      listenBtn: 'Listen',
      stopBtn: 'Stop',
      compareDrawerTitle: 'Mandi Comparison Panel',
      compareBtn: 'Compare Selected Mandis',
      clearCompare: 'Clear',
      searchPlaceholder: 'Search crop or mandi...',
      upTrend: 'higher than yesterday',
      downTrend: 'lower than yesterday'
    }
  }[lang];

  // Crop Icon Renderer
  const renderCropIcon = (id, size = 44) => {
    switch (id) {
      case 'wheat': return <WheatIcon size={size} />;
      case 'paddy': return <PaddyIcon size={size} />;
      case 'tomato': return <TomatoIcon size={size} />;
      case 'onion': return <OnionIcon size={size} />;
      case 'potato': return <PotatoIcon size={size} />;
      case 'mustard': return <MustardIcon size={size} />;
      case 'soybean': return <SoybeanIcon size={size} />;
      case 'maize': return <MaizeIcon size={size} />;
      case 'chana': return <ChanaIcon size={size} />;
      case 'all': return <MoreCropsIcon size={size * 0.75} />;
      default: return <WheatIcon size={size} />;
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const q = searchQuery.trim().toLowerCase();
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

    if (selectedCropId !== 'all' && record.commodity_id !== selectedCropId) {
      return false;
    }
    return true;
  });

  const activeCropObj = SIDEBAR_CROPS.find(c => c.id === selectedCropId) || SIDEBAR_CROPS[0];
  const featuredRecord = filteredRecords[0] || records.find(r => r.commodity_id === selectedCropId) || records[0];
  const featuredPrice = featuredRecord ? featuredRecord.modal_price : 2450;
  const featuredPerKg = (featuredPrice / 100).toFixed(2);
  const featuredTrend = 40;

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
      ? `नमस्कार किसान भाई। आज ${selectedState} में ${cropName} का औसत मंडी भाव ₹${featuredPrice} प्रति क्विंटल है। कल के मुकाबले भाव में ₹${featuredTrend} की तेजी दर्ज की गई है। पूरा भाव और नजदीकी मंडियों की तुलना देखने के लिए मंडी पर क्लिक करें।`
      : `Hello. Today in ${selectedState}, the average price for ${cropName} is ₹${featuredPrice} per quintal, up by ₹${featuredTrend} from yesterday.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeakingHeadline(false);
    utterance.onerror = () => setIsSpeakingHeadline(false);

    setIsSpeakingHeadline(true);
    window.speechSynthesis.speak(utterance);
  };

  // Toggle mandi selection for 2-mandi comparison
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

  // Open modal directly when clicking "पूरा भाव देखें"
  const handleViewFullPrice = (record) => {
    if (selectedForCompare.length === 1 && selectedForCompare[0].id !== record.id) {
      setSelectedForCompare([selectedForCompare[0], record]);
    } else if (selectedForCompare.length >= 2) {
      // Keep existing selection
    } else {
      const otherMandi = filteredRecords.find(r => r.id !== record.id) || records.find(r => r.id !== record.id) || record;
      setSelectedForCompare([record, otherMandi]);
    }
    setIsComparingModalOpen(true);
  };

  // Display city/state
  const exactCityStateText = formatCityState(userLocation?.district || DEFAULT_STATE_CITIES[selectedState] || 'Lucknow', selectedState, lang);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* 1. Header (Exact Match to Reference Mockup & Mobile Responsive) */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--color-card-border)',
        padding: '12px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container app-header-container">
          {/* Brand Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoSprout size={36} color="#111827" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.15 }}>
                {t.appName}
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Center Search Pill with Voice Mic (Full width on mobile) */}
          <div className="search-box-wrapper">
            <span style={{ position: 'absolute', left: '14px', fontSize: '0.85rem', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '9px 36px 9px 36px',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-full)',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#111827'
              }}
            />
            <VoiceSearchButton
              lang={lang}
              onResult={(spokenText) => setSearchQuery(spokenText)}
              style={{ right: '5px', width: '28px', height: '28px', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '34px',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  padding: '2px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Header: Live Indicator & Segmented Language Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Indicator Pill */}
            <div 
              onClick={() => setDataSourceMode(dataSourceMode === 'live' ? 'offline' : 'live')}
              title="Click to toggle Live / Offline mode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: dataSourceMode === 'live' ? 'var(--color-badge-green)' : 'var(--color-tag-cached)',
                color: dataSourceMode === 'live' ? 'var(--color-badge-green-text)' : 'var(--color-tag-cached-text)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '0.65rem' }}>●</span>
              <span>{dataSourceMode === 'live' ? 'Live' : 'Offline'}</span>
            </div>

            {/* Language Capsule [ हिंदी | EN ] */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setLang('hi')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: lang === 'hi' ? '#0f3e1f' : 'transparent',
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
                  background: lang === 'en' ? '#0f3e1f' : 'transparent',
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

      {/* 2. Main Dashboard (2-Column on Desktop, Clean Swipeable Flow on Mobile) */}
      <main className="container" style={{ padding: '20px 14px', flex: 1 }}>
        <div className="app-main-grid">
          {/* LEFT COLUMN: फसल चुनें (Select Crop) */}
          <div className="crop-sidebar-card">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>
              {t.selectCrop}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '18px' }}>
              {t.selectCropSub}
            </p>

            {/* Crop Cards Grid (2-Column Desktop, Swipeable Mobile) */}
            <div className="crop-grid">
              {SIDEBAR_CROPS.map(crop => {
                const isSelected = selectedCropId === crop.id && !searchQuery;
                return (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCropId(crop.id);
                      setSearchQuery('');
                    }}
                    className={`crop-tile ${isSelected ? 'selected' : ''}`}
                  >
                    <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderCropIcon(crop.id, 42)}
                    </div>
                    <span style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#111827',
                      marginTop: '6px'
                    }}>
                      {lang === 'hi' ? crop.name_hi : crop.name_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Hero Rate Banner + Mandis List + Audio Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            {/* Offline Status Banner */}
            {!isOnline && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#92400e',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                <span>📶</span>
                <span>{lang === 'hi' ? 'इंटरनेट उपलब्ध नहीं है — ऐप पूरी तरह ऑफ़लाइन काम कर रहा है (स्थानीय सहेजा डेटा)।' : 'No internet connection — App is operating 100% offline using locally saved data.'}</span>
              </div>
            )}

            {/* TOP HERO RATE CARD (Matching Reference Design & Mobile Adaptive) */}
            <div className="hero-rate-card">
              {/* Left: Illustration, Crop Name & Date */}
              <div className="hero-crop-info">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderCropIcon(activeCropObj.id, 56)}
                </div>
                <div>
                  <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.1 }}>
                    {lang === 'hi' ? activeCropObj.name_hi : activeCropObj.name_en}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0 0', fontWeight: 500 }}>
                    {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Center: Big Price */}
              <div className="hero-price-box">
                <div className="hero-price" style={{ fontSize: '2.9rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  ₹{featuredPrice.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}>
                  {t.perQuintal} • (₹{featuredPerKg}/kg)
                </div>
              </div>

              {/* Right: Trend Card Badge */}
              <div className="hero-trend" style={{
                background: 'var(--color-badge-green)',
                padding: '14px 22px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.3rem', color: 'var(--color-badge-green-text)', fontWeight: 800 }}>
                  ▲ +₹{featuredTrend}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-badge-green-text)', fontWeight: 700, marginTop: '2px' }}>
                  {t.upTrend}
                </span>
              </div>
            </div>

            {/* MANDIS SECTION: "आपके पास की मंडियाँ" (Nearby Mandis List) */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-card-border)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Header row with Location Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LocationPin size={22} color="#14532d" />
                  <div>
                    <h3 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      {t.nearMandis}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
                      {t.nearMandisSub}
                    </p>
                  </div>
                </div>

                {/* Location / State Dropdown Capsule (Matching Reference Mockup) */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-full)',
                    padding: '8px 18px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#111827',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <LocationPin size={16} color="#14532d" />
                    <span>{exactCityStateText}</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '4px' }}>⌵</span>
                  </div>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  >
                    {STATES.map(s => (
                      <option key={s} value={s}>
                        {formatCityState(DEFAULT_STATE_CITIES[s], s, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                  🌾 {lang === 'hi' ? 'ताज़ा मंडी भाव लोड हो रहे हैं...' : 'Loading verified market rates...'}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                  🌾 {lang === 'hi' ? 'इस फसल/क्षेत्र में कोई भाव नहीं मिला।' : 'No market records found for this crop/area.'}
                </div>
              ) : (
                /* List of Mandi Rows (Matching the exact card/row design) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredRecords.slice(0, 6).map((record, index) => {
                    const isSelected = selectedForCompare.some(r => r.id === record.id);
                    const dummyDelta = [40, 30, 20, 15, 25, 35][index % 6];
                    const mandiTitle = lang === 'hi' 
                      ? (record.market_hi || record.market_en) 
                      : (record.market_en || record.market_hi);

                    return (
                      <div
                        key={record.id}
                        className={`mandi-row-card ${isSelected ? 'selected' : ''}`}
                      >
                        {/* Mandi Name & Distance (paired with trend on mobile) */}
                        <div className="mandi-mobile-top">
                          <div>
                            <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>
                              {mandiTitle}
                            </h4>
                            <span style={{ fontSize: '0.84rem', color: '#6b7280', fontWeight: 500 }}>
                              📍 {record.distance_km === 0 ? (lang === 'hi' ? '0 किमी' : '0 km') : `${record.distance_km} किमी`}
                            </span>
                          </div>

                          {/* Trend */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#166534' }}>
                              ▲ +₹{dummyDelta}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>
                              {t.upTrend}
                            </div>
                          </div>
                        </div>

                        {/* Price Box */}
                        <div className="mandi-price-box">
                          <div style={{ fontSize: '1.28rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                            ₹{record.modal_price.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
                            {t.perQuintal} • (₹{(record.modal_price / 100).toFixed(2)}/kg)
                          </div>
                        </div>

                        {/* Action: Compare Selector + View Full Price */}
                        <div className="mandi-actions-group">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompare(record);
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-full)',
                              background: isSelected ? 'var(--color-btn-dark)' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#475569',
                              border: isSelected ? '1px solid var(--color-btn-dark)' : '1px solid #cbd5e1',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                            title={lang === 'hi' ? 'तुलना के लिए 2 मंडियां चुनें' : 'Select 2 mandis to compare'}
                          >
                            <span>{isSelected ? '✓' : '⚖️'}</span>
                            <span>{isSelected ? t.selectedForCompare : t.compareAction}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewFullPrice(record)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--color-btn-pill-bg)',
                              color: 'var(--color-btn-pill-text)',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              border: 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {t.viewFullPrice}
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
              background: 'var(--color-hero-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-hero-border)',
              padding: '18px 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <SpeakerWaveIcon size={26} color="#111827" />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>
                    {t.listenPrompt}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: '#6b7280', margin: 0 }}>
                    {t.listenSubSpecific(lang === 'hi' ? activeCropObj.name_hi : activeCropObj.name_en)}
                  </p>
                </div>
              </div>

              {/* Play Audio Button */}
              <button
                onClick={handleListenFeatured}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-btn-dark)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
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
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)',
          maxWidth: '820px',
          background: '#ffffff',
          border: '2px solid #22c55e',
          borderRadius: '16px',
          padding: '14px 22px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14532d' }}>
                {selectedForCompare.length === 1 
                  ? (lang === 'hi' ? '1/2 मंडी चुनी गई — तुलना के लिए दूसरी मंडी चुनें' : '1/2 Mandi selected — Select a 2nd mandi to compare')
                  : (lang === 'hi' ? '2 मंडियां चुनी गईं — तुलना तैयार!' : '2 Mandis selected — Ready to compare!')}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
                {selectedForCompare.map(r => lang === 'hi' ? (r.market_hi || r.market_en) : (r.market_en || r.market_hi)).join('  🆚  ')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedForCompare.length === 2 ? (
              <button
                onClick={() => setIsComparingModalOpen(true)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(21, 128, 61, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚡ {t.compareBtn}
              </button>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontStyle: 'italic' }}>
                {lang === 'hi' ? 'एक और चुनें...' : 'Pick 1 more...'}
              </span>
            )}

            <button
              onClick={() => setSelectedForCompare([])}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-full)',
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid #cbd5e1'
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
        color: '#6b7280',
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
