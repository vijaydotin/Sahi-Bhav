// AI Mandi Advisor Service using Gemini 3.5 Flash Lite (lightweight, ultra-fast model)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-3.5-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

export async function getGeminiComparisonExplanation({
  mandiA,
  mandiB,
  commodity,
  priceA,
  priceB,
  distA,
  distB,
  quantityQtl,
  netGain,
  recommendedMandiName,
  lang = 'hi'
}) {
  // Deterministic fallback if API key is not configured
  const fallbackText = lang === 'hi'
    ? `${recommendedMandiName} में फसल बेचना सबसे बेहतर विकल्प है। परिवहन खर्च काटने के बाद भी आपको ₹${Math.abs(netGain).toLocaleString('en-IN')} का शुद्ध अतिरिक्त मुनाफ़ा मिलेगा।`
    : `Selling at ${recommendedMandiName} is the recommended choice. After factoring transit costs, you will retain an extra net ₹${Math.abs(netGain).toLocaleString('en-IN')}.`;

  if (!GEMINI_API_KEY) {
    return { success: false, text: fallbackText };
  }

  const prompt = lang === 'hi'
    ? `आप एक ईमानदार भारतीय कृषि विशेषज्ञ (किसान सलाहकार) हैं।
नीचे दी गई वास्तविक मंडी तुलना के आधार पर किसान को केवल 2 छोटे वाक्यों में सरल हिंदी में स्पष्ट सलाह दें:
- फसल: ${commodity}
- मंडी 1: ${mandiA} (भाव: ₹${priceA}/क्विंटल, दूरी: ~${distA} किमी)
- मंडी 2: ${mandiB} (भाव: ₹${priceB}/क्विंटल, दूरी: ~${distB} किमी)
- कुल फसल मात्रा: ${quantityQtl} क्विंटल
- परिवहन खर्च काटने के बाद शुद्ध अतिरिक्त मुनाफ़ा: ₹${Math.abs(netGain)}
- अनुशंसित मंडी: ${recommendedMandiName}

नियम: कोई नए आंकड़े या भाव न बनाएं। केवल ऊपर दिए गए तथ्यों पर किसान को 2 वाक्यों में सीधा और स्पष्ट मार्गदर्शन दें।`
    : `You are an honest Indian agricultural market advisor.
Give a brief 2-sentence farmer-friendly recommendation based on these verified facts:
- Crop: ${commodity}
- Mandi 1: ${mandiA} (Rate: ₹${priceA}/qtl, Distance: ~${distA} km)
- Mandi 2: ${mandiB} (Rate: ₹${priceB}/qtl, Distance: ~${distB} km)
- Harvest Quantity: ${quantityQtl} Quintals
- Net Profit Gain after transport costs: ₹${Math.abs(netGain)}
- Best choice: ${recommendedMandiName}

Rules: Do not invent numbers. Summarize in 2 sentences.`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 120
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return { success: true, text: reply.trim() };
    }
    throw new Error('Empty response from Gemini');
  } catch (err) {
    console.warn('Gemini explanation fallback:', err.message);
    return { success: false, text: fallbackText };
  }
}
