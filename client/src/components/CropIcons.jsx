import React from 'react';

export const LogoSprout = ({ size = 36, color = '#143d22' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M24 44C24 33 22 25 15 18C10 13 4 10 4 10C4 10 7 19 12 24C17 29 20 36 24 44Z" 
      fill={color} 
    />
    <path 
      d="M24 44C24 34 27 26 35 20C40 16 44 14 44 14C44 14 41 22 36 27C31 32 27 38 24 44Z" 
      fill="#1e5c33" 
    />
    <path 
      d="M24 44V22" 
      stroke={color} 
      strokeWidth="3.5" 
      strokeLinecap="round" 
    />
  </svg>
);

export const WheatIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stem */}
    <path d="M18 54C26 44 36 30 46 12" stroke="#d97706" strokeWidth="3" strokeLinecap="round"/>
    {/* Grains */}
    <ellipse cx="44" cy="16" rx="6" ry="10" transform="rotate(35 44 16)" fill="#f59e0b"/>
    <ellipse cx="38" cy="22" rx="5.5" ry="9" transform="rotate(-35 38 22)" fill="#fbbf24"/>
    <ellipse cx="38" cy="26" rx="5.5" ry="9.5" transform="rotate(35 38 26)" fill="#f59e0b"/>
    <ellipse cx="32" cy="32" rx="5" ry="9" transform="rotate(-35 32 32)" fill="#fbbf24"/>
    <ellipse cx="32" cy="36" rx="5" ry="9" transform="rotate(35 32 36)" fill="#f59e0b"/>
    <ellipse cx="26" cy="42" rx="4.5" ry="8.5" transform="rotate(-35 26 42)" fill="#fbbf24"/>
    {/* Awns / Whiskers */}
    <path d="M48 10L56 4" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 16L54 10" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M36 22L24 16" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M36 28L48 22" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M30 34L18 28" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const PaddyIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stalks */}
    <path d="M22 54C24 38 30 26 44 18" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 54C28 40 38 32 50 28" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Hanging Rice Grains */}
    <ellipse cx="44" cy="20" rx="3.5" ry="7" transform="rotate(25 44 20)" fill="#fbbf24"/>
    <ellipse cx="40" cy="24" rx="3.5" ry="7" transform="rotate(15 40 24)" fill="#f59e0b"/>
    <ellipse cx="48" cy="24" rx="3.5" ry="7" transform="rotate(35 48 24)" fill="#fbbf24"/>
    <ellipse cx="36" cy="30" rx="3.5" ry="6.5" transform="rotate(10 36 30)" fill="#f59e0b"/>
    <ellipse cx="46" cy="31" rx="3.5" ry="6.5" transform="rotate(40 46 31)" fill="#fbbf24"/>
    <ellipse cx="33" cy="37" rx="3.5" ry="6.5" transform="rotate(5 33 37)" fill="#f59e0b"/>
    {/* Foliage Leaf */}
    <path d="M22 54C20 42 16 32 8 26C16 30 20 38 22 54Z" fill="#22c55e"/>
  </svg>
);

export const TomatoIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Tomato Body */}
    <circle cx="32" cy="36" r="20" fill="#dc2626"/>
    <path d="M22 22C26 20 38 20 42 22C49 26 52 35 49 44C46 53 38 56 32 56C26 56 18 53 15 44C12 35 15 26 22 22Z" fill="#ef4444"/>
    {/* Highlight shine */}
    <ellipse cx="24" cy="30" rx="5" ry="3" transform="rotate(-30 24 30)" fill="#fca5a5" opacity="0.6"/>
    {/* Stem & Calyx */}
    <path d="M32 10V18" stroke="#15803d" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 18L24 16M32 18L40 16M32 18L26 24M32 18L38 24M32 18L32 12" stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
);

export const OnionIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Green sprout top */}
    <path d="M32 8C30 14 31 18 32 22" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
    <path d="M35 10C35 14 34 18 33 22" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Onion Bulb */}
    <path d="M32 18C20 24 14 34 16 44C18 52 24 56 32 56C40 56 46 52 48 44C50 34 44 24 32 18Z" fill="#9333ea"/>
    <path d="M32 20C23 25 18 34 20 42C22 49 27 53 32 53C37 53 42 49 44 42C46 34 41 25 32 20Z" fill="#a855f7"/>
    {/* Onion striping lines */}
    <path d="M32 20V53" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M26 26C24 33 24 41 27 48" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M38 26C40 33 40 41 37 48" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Roots */}
    <path d="M30 56L28 60M32 56V61M34 56L36 60" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PotatoIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Organic Potato Body */}
    <path d="M20 22C28 17 40 18 48 25C54 31 55 40 50 47C45 54 32 56 22 52C14 48 12 37 15 29C16 26 18 23 20 22Z" fill="#d97706"/>
    <path d="M21 24C28 20 38 21 45 27C50 32 51 39 47 45C43 51 32 53 23 49C16 46 15 36 17 30C18 27 19 25 21 24Z" fill="#f59e0b"/>
    {/* Potato eyes / specks */}
    <ellipse cx="28" cy="27" rx="2.5" ry="1.5" transform="rotate(-15 28 27)" fill="#b45309"/>
    <ellipse cx="40" cy="33" rx="3" ry="1.8" transform="rotate(20 40 33)" fill="#b45309"/>
    <ellipse cx="24" cy="40" rx="2.5" ry="1.5" transform="rotate(-30 24 40)" fill="#b45309"/>
    <ellipse cx="36" cy="45" rx="3.2" ry="1.6" transform="rotate(10 36 45)" fill="#b45309"/>
  </svg>
);

export const MustardIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stem */}
    <path d="M32 56V26" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 40C24 38 20 32 18 28" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 35C40 34 44 28 46 24" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
    {/* Center Top Flower (4-Petal Mustard) */}
    <circle cx="32" cy="18" r="4.5" fill="#f59e0b"/>
    <ellipse cx="32" cy="11" rx="4" ry="5" fill="#facc15"/>
    <ellipse cx="32" cy="25" rx="4" ry="5" fill="#facc15"/>
    <ellipse cx="25" cy="18" rx="5" ry="4" fill="#facc15"/>
    <ellipse cx="39" cy="18" rx="5" ry="4" fill="#facc15"/>
    {/* Side Bloom Left */}
    <circle cx="18" cy="27" r="3" fill="#f59e0b"/>
    <ellipse cx="18" cy="23" rx="2.5" ry="3.5" fill="#fde047"/>
    <ellipse cx="14" cy="27" rx="3.5" ry="2.5" fill="#fde047"/>
    <ellipse cx="22" cy="27" rx="3.5" ry="2.5" fill="#fde047"/>
    {/* Side Bloom Right */}
    <circle cx="46" cy="23" r="3" fill="#f59e0b"/>
    <ellipse cx="46" cy="19" rx="2.5" ry="3.5" fill="#fde047"/>
    <ellipse cx="42" cy="23" rx="3.5" ry="2.5" fill="#fde047"/>
    <ellipse cx="50" cy="23" rx="3.5" ry="2.5" fill="#fde047"/>
  </svg>
);

export const SoybeanIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Trio of Soybeans */}
    <g transform="translate(14, 16)">
      {/* Bean 1 (Bottom Left) */}
      <path d="M12 26C6 26 2 20 4 14C6 8 14 6 20 8C26 10 27 18 24 23C21 27 16 26 12 26Z" fill="#b45309"/>
      <path d="M13 24C8 24 4 19 6 14C8 9 14 8 19 10C24 12 25 18 22 22C19 25 16 24 13 24Z" fill="#d97706"/>
      <ellipse cx="12" cy="16" rx="2.5" ry="1.2" transform="rotate(-20 12 16)" fill="#78350f"/>

      {/* Bean 2 (Bottom Right) */}
      <path d="M26 28C20 28 17 22 19 16C21 10 28 8 33 10C38 12 40 19 37 24C34 29 30 28 26 28Z" fill="#b45309"/>
      <path d="M26 26C21 26 18 21 20 16C22 11 28 9 32 11C36 13 38 19 35 23C32 27 29 26 26 26Z" fill="#f59e0b"/>
      <ellipse cx="27" cy="18" rx="2.5" ry="1.2" transform="rotate(20 27 18)" fill="#78350f"/>

      {/* Bean 3 (Top Center) */}
      <path d="M20 16C14 16 11 10 13 5C15 0 22 -1 27 1C32 3 33 9 31 13C29 17 24 16 20 16Z" fill="#b45309"/>
      <path d="M20 14C15 14 12 9 14 5C16 1 22 0 26 2C30 4 31 9 29 12C27 15 23 14 20 14Z" fill="#fbbf24"/>
      <ellipse cx="21" cy="7" rx="2.2" ry="1.2" transform="rotate(10 21 7)" fill="#78350f"/>
    </g>
  </svg>
);

export const MaizeIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Yellow Corn Cob */}
    <path d="M24 44C22 30 25 18 32 10C39 18 42 30 40 44C38 50 26 50 24 44Z" fill="#f59e0b"/>
    {/* Kernels grid representation */}
    <ellipse cx="32" cy="18" rx="3.5" ry="2.5" fill="#fde047"/>
    <ellipse cx="28" cy="24" rx="3" ry="2.5" fill="#facc15"/>
    <ellipse cx="36" cy="24" rx="3" ry="2.5" fill="#facc15"/>
    <ellipse cx="28" cy="30" rx="3" ry="2.5" fill="#fde047"/>
    <ellipse cx="36" cy="30" rx="3" ry="2.5" fill="#fde047"/>
    <ellipse cx="32" cy="34" rx="3" ry="2.5" fill="#facc15"/>
    <ellipse cx="28" cy="38" rx="3" ry="2.5" fill="#fde047"/>
    <ellipse cx="36" cy="38" rx="3" ry="2.5" fill="#fde047"/>
    {/* Green Husk Leaves */}
    <path d="M20 50C18 36 22 28 26 22C24 32 24 42 28 50Z" fill="#15803d"/>
    <path d="M44 50C46 36 42 28 38 22C40 32 40 42 36 50Z" fill="#16a34a"/>
    <path d="M32 50V56" stroke="#15803d" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export const ChanaIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cluster of Chickpea / Bengal Gram Seeds */}
    <g transform="translate(15, 16)">
      {/* Seed 1 */}
      <path d="M10 26C5 25 2 20 3 14C4 9 9 7 14 8C16 8 18 7 19 5C19 8 18 11 19 14C20 19 16 27 10 26Z" fill="#d97706"/>
      <path d="M10 24C6 23 3 19 4 14C5 10 9 8 13 9C15 9 17 8 18 6C18 9 17 11 18 14C19 18 15 25 10 24Z" fill="#f59e0b"/>
      
      {/* Seed 2 */}
      <path d="M24 28C19 28 16 23 17 17C18 12 23 10 28 11C30 11 32 10 33 8C33 11 32 14 33 17C34 22 30 29 24 28Z" fill="#b45309"/>
      <path d="M24 26C20 26 17 22 18 17C19 13 23 11 27 12C29 12 31 11 32 9C32 12 31 14 32 17C33 21 29 27 24 26Z" fill="#fbbf24"/>
    </g>
  </svg>
);

export const MoreCropsIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="32" r="5" fill="#1e293b"/>
    <circle cx="32" cy="32" r="5" fill="#1e293b"/>
    <circle cx="48" cy="32" r="5" fill="#1e293b"/>
  </svg>
);

export const LocationPin = ({ size = 18, color = '#15803d' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 2C7.58 2 4 5.58 4 10C4 15.25 12 22 12 22C12 22 20 15.25 20 10C20 5.58 16.42 2 12 2ZM12 13.5C10.07 13.5 8.5 11.93 8.5 10C8.5 8.07 10.07 6.5 12 6.5C13.93 6.5 15.5 8.07 15.5 10C15.5 11.93 13.93 13.5 12 13.5Z" 
      fill={color}
    />
  </svg>
);

export const SpeakerWaveIcon = ({ size = 26, color = '#143d22' }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M13 5L7 10H3V18H7L13 23V5Z" 
      fill={color}
    />
    <path 
      d="M17.5 9.5C18.7 10.7 19.5 12.3 19.5 14C19.5 15.7 18.7 17.3 17.5 18.5" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="M21 6C23.1 8.1 24.5 10.9 24.5 14C24.5 17.1 23.1 19.9 21 22" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
  </svg>
);
