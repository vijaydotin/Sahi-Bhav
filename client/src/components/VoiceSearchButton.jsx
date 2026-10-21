import React, { useState, useEffect, useRef } from 'react';

export default function VoiceSearchButton({ onResult, lang = 'hi', disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && onResult) {
          // Clean spoken query (strip phrases like "ka bhav", "ka rate")
          const clean = transcript
            .replace(/का भाव/gi, '')
            .replace(/का रेट/gi, '')
            .replace(/price/gi, '')
            .replace(/rate/gi, '')
            .trim();
          onResult(clean || transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  // Update speech language when app language toggles
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [lang]);

  const toggleListen = () => {
    if (!isSupported) {
      alert(lang === 'hi' 
        ? 'आपके ब्राउज़र में वॉइस सर्च उपलब्ध नहीं है। कृपया टाइप करके खोजें।' 
        : 'Voice search is not supported in this browser. Please type to search.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListen}
      disabled={disabled}
      title={lang === 'hi' ? 'बोलकर खोजें (उदा. गेहूं, सरसों)' : 'Search by voice'}
      style={{
        position: 'absolute',
        right: '42px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: isListening ? '#ef4444' : 'rgba(34, 197, 94, 0.15)',
        border: isListening ? '1px solid #f87171' : '1px solid rgba(34, 197, 94, 0.35)',
        color: isListening ? '#ffffff' : 'var(--color-primary-light)',
        borderRadius: 'var(--radius-full)',
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        cursor: 'pointer',
        boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.8)' : 'none',
        animation: isListening ? 'pulse 1.2s infinite' : 'none',
        transition: 'var(--transition)',
        zIndex: 10
      }}
    >
      {isListening ? '🎙️' : '🎤'}
    </button>
  );
}
