// Hindi and English crop dictionary with phonetic aliases for voice & typed search

export const CROP_DICTIONARY = [
  {
    id: 'wheat',
    name_hi: 'गेहूं',
    name_en: 'Wheat',
    icon: '🌾',
    msp: 2275,
    aliases: ['gehu', 'gehun', 'gehoon', 'wheat', 'गेहूं', 'गेहू', 'गेहु']
  },
  {
    id: 'mustard',
    name_hi: 'सरसों / राई',
    name_en: 'Mustard / Rapeseed',
    icon: '🌼',
    msp: 5650,
    aliases: ['sarso', 'sarson', 'rai', 'mustard', 'rapeseed', 'सरसों', 'सरसो', 'राई']
  },
  {
    id: 'soybean',
    name_hi: 'सोयाबीन',
    name_en: 'Soybean',
    icon: '🫘',
    msp: 4892,
    aliases: ['soyabean', 'soybean', 'soya', 'सोयाबीन', 'सोया']
  },
  {
    id: 'chana',
    name_hi: 'चना / ग्राम',
    name_en: 'Gram / Chana',
    icon: '🥣',
    msp: 5440,
    aliases: ['chana', 'gram', 'channa', 'चना', 'छोला']
  },
  {
    id: 'onion',
    name_hi: 'प्याज़',
    name_en: 'Onion',
    icon: '🧅',
    msp: null,
    aliases: ['pyaz', 'pyaj', 'kanda', 'onion', 'प्याज़', 'प्याज', 'कांदा']
  },
  {
    id: 'potato',
    name_hi: 'आलू',
    name_en: 'Potato',
    icon: '🥔',
    msp: null,
    aliases: ['alu', 'aloo', 'potato', 'आलू', 'आलु']
  },
  {
    id: 'paddy',
    name_hi: 'धान',
    name_en: 'Paddy',
    icon: '🌾',
    msp: 2183,
    aliases: ['dhan', 'chawal', 'paddy', 'rice', 'धान', 'चावल']
  },
  {
    id: 'tomato',
    name_hi: 'टमाटर',
    name_en: 'Tomato',
    icon: '🍅',
    msp: null,
    aliases: ['tamatar', 'tamater', 'tomato', 'टमाटर']
  },
  {
    id: 'maize',
    name_hi: 'मक्का',
    name_en: 'Maize',
    icon: '🌽',
    msp: 2090,
    aliases: ['makka', 'makai', 'bhutta', 'corn', 'maize', 'मक्का', 'मकाई', 'भुट्टा']
  }
];

export function findCropByQuery(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();
  if (clean.length === 0) return null;

  return CROP_DICTIONARY.find(crop => {
    // 1. Direct name match
    if (crop.name_en.toLowerCase() === clean || crop.name_hi.toLowerCase() === clean) {
      return true;
    }
    // 2. Full word or starts-with match in names
    if (clean.length >= 2 && (crop.name_en.toLowerCase().includes(clean) || crop.name_hi.toLowerCase().includes(clean))) {
      return true;
    }
    // 3. Exact alias match or multi-character alias starts-with
    return crop.aliases.some(alias => {
      if (alias === clean) return true;
      if (clean.length >= 3 && (alias.startsWith(clean) || clean.startsWith(alias))) return true;
      return false;
    });
  }) || null;
}
