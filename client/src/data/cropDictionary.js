// Hindi and English crop dictionary with phonetic aliases for voice & typed search

export const CROP_DICTIONARY = [
  {
    id: 'wheat',
    name_hi: 'गेहूं',
    name_en: 'Wheat',
    icon: '🌾',
    msp: 2275,
    aliases: ['gehu', 'gehun', 'gehoon', 'gehun', 'wheat', 'गेहूं', 'गेहू', 'गेहु']
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
    aliases: ['chana', 'gram', 'channa', 'चना', 'चना दाल', 'छोला']
  },
  {
    id: 'onion',
    name_hi: 'प्याज़',
    name_en: 'Onion',
    icon: '🧅',
    msp: null,
    aliases: ['pyaz', 'pyaj', 'kanda', 'onion', 'प्याज़', 'प्याज', 'कांदा']
  }
];

export function findCropByQuery(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();
  
  return CROP_DICTIONARY.find(crop => 
    crop.name_hi.toLowerCase().includes(clean) ||
    crop.name_en.toLowerCase().includes(clean) ||
    crop.aliases.some(alias => clean.includes(alias) || alias.includes(clean))
  ) || null;
}
