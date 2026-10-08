/**
 * Safe Space — Illustrated Avatars Collection
 * 18 Illustrated Animals & Cute Characters for student profile avatars
 * Zero external dependencies, offline compatible image assets
 */

const DEFAULT_AVATAR = 'assets/avatars/default-avatar.png';

const AVATARS = [
  // ── Animals (12) ──────────────────────────────────────────────────────────
  {
    id: 'playful-cat',
    shortId: 'cat',
    name: 'Playful Cat',
    category: 'animals',
    image: 'assets/avatars/playful-cat.png',
    svgImage: 'assets/avatars/playful-cat.svg',
    emoji: '🐱',
    badge: '🐱',
    bg: '#FFE5EC',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFE5EC"/>
      <polygon points="24,36 14,14 38,24" fill="#FFAAA6"/>
      <polygon points="24,33 18,17 35,24" fill="#FF85A2"/>
      <polygon points="76,36 86,14 62,24" fill="#FFAAA6"/>
      <polygon points="76,33 82,17 65,24" fill="#FF85A2"/>
      <ellipse cx="50" cy="56" rx="34" ry="29" fill="#FFFFFF"/>
      <circle cx="30" cy="63" r="6" fill="#FFB7B2" opacity="0.65"/>
      <circle cx="70" cy="63" r="6" fill="#FFB7B2" opacity="0.65"/>
      <circle cx="36" cy="52" r="4.2" fill="#2E2938"/>
      <circle cx="37.5" cy="50.2" r="1.6" fill="#FFFFFF"/>
      <circle cx="64" cy="52" r="4.2" fill="#2E2938"/>
      <circle cx="65.5" cy="50.2" r="1.6" fill="#FFFFFF"/>
      <polygon points="47,59 53,59 50,62.5" fill="#FF85A2"/>
      <path d="M46 63.5 Q50 67.5 50 63.5 Q50 67.5 54 63.5" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M21 56 L12 55 M21 61 L12 63 M79 56 L88 55 M79 61 L88 63" stroke="#2E2938" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'happy-dog',
    shortId: 'dog',
    name: 'Happy Dog',
    category: 'animals',
    image: 'assets/avatars/happy-dog.png',
    svgImage: 'assets/avatars/happy-dog.svg',
    emoji: '🐶',
    badge: '🐶',
    bg: '#FFF0D9',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFF0D9"/>
      <ellipse cx="18" cy="48" rx="10" ry="20" fill="#C68B59" transform="rotate(-15 18 48)"/>
      <ellipse cx="82" cy="48" rx="10" ry="20" fill="#C68B59" transform="rotate(15 82 48)"/>
      <ellipse cx="50" cy="55" rx="33" ry="29" fill="#FCE1C5"/>
      <ellipse cx="50" cy="62" rx="16" ry="13" fill="#FFFFFF"/>
      <circle cx="28" cy="63" r="5.5" fill="#FFAAA6" opacity="0.6"/>
      <circle cx="72" cy="63" r="5.5" fill="#FFAAA6" opacity="0.6"/>
      <circle cx="36" cy="51" r="4.2" fill="#2E2938"/>
      <circle cx="37.5" cy="49.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="64" cy="51" r="4.2" fill="#2E2938"/>
      <circle cx="65.5" cy="49.5" r="1.6" fill="#FFFFFF"/>
      <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#2E2938"/>
      <path d="M46 63 Q50 67 50 63 Q50 67 54 63" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M50 66 Q50 72 53 71 Q56 70 54 65" fill="#FF85A2"/>
    </svg>`
  },
  {
    id: 'fluffy-bunny',
    shortId: 'bunny',
    name: 'Fluffy Bunny',
    category: 'animals',
    image: 'assets/avatars/fluffy-bunny.png',
    svgImage: 'assets/avatars/fluffy-bunny.svg',
    emoji: '🐰',
    badge: '🐰',
    bg: '#F5EEFF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#F5EEFF"/>
      <ellipse cx="36" cy="24" rx="8" ry="22" fill="#FFFFFF"/>
      <ellipse cx="36" cy="25" rx="4.5" ry="16" fill="#FFC6D9"/>
      <ellipse cx="64" cy="24" rx="8" ry="22" fill="#FFFFFF"/>
      <ellipse cx="64" cy="25" rx="4.5" ry="16" fill="#FFC6D9"/>
      <ellipse cx="50" cy="60" rx="33" ry="27" fill="#FFFFFF"/>
      <circle cx="28" cy="66" r="6" fill="#FFB7B2" opacity="0.65"/>
      <circle cx="72" cy="66" r="6" fill="#FFB7B2" opacity="0.65"/>
      <circle cx="36" cy="56" r="4.2" fill="#2E2938"/>
      <circle cx="37.5" cy="54.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="64" cy="56" r="4.2" fill="#2E2938"/>
      <circle cx="65.5" cy="54.5" r="1.6" fill="#FFFFFF"/>
      <polygon points="47,62 53,62 50,65" fill="#FF85A2"/>
      <path d="M46 66 Q50 69 50 66 Q50 69 54 66" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'cozy-bear',
    shortId: 'bear',
    name: 'Cozy Bear',
    category: 'animals',
    image: 'assets/avatars/cozy-bear.png',
    svgImage: 'assets/avatars/cozy-bear.svg',
    emoji: '🐻',
    badge: '🐻',
    bg: '#FDF1E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FDF1E6"/>
      <circle cx="24" cy="30" r="12" fill="#A77448"/>
      <circle cx="24" cy="30" r="6.5" fill="#E6C4A2"/>
      <circle cx="76" cy="30" r="12" fill="#A77448"/>
      <circle cx="76" cy="30" r="6.5" fill="#E6C4A2"/>
      <circle cx="50" cy="56" r="32" fill="#A77448"/>
      <ellipse cx="50" cy="64" rx="16" ry="12" fill="#E6C4A2"/>
      <circle cx="26" cy="63" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="74" cy="63" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="36" cy="52" r="4.2" fill="#2E2938"/>
      <circle cx="37.5" cy="50.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="64" cy="52" r="4.2" fill="#2E2938"/>
      <circle cx="65.5" cy="50.5" r="1.6" fill="#FFFFFF"/>
      <ellipse cx="50" cy="61" rx="5" ry="3.5" fill="#2E2938"/>
      <path d="M47 65 Q50 68 53 65" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'sweet-panda',
    shortId: 'panda',
    name: 'Sweet Panda',
    category: 'animals',
    image: 'assets/avatars/sweet-panda.png',
    svgImage: 'assets/avatars/sweet-panda.svg',
    emoji: '🐼',
    badge: '🐼',
    bg: '#EAF7EE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#EAF7EE"/>
      <circle cx="22" cy="28" r="12" fill="#2E2938"/>
      <circle cx="78" cy="28" r="12" fill="#2E2938"/>
      <circle cx="50" cy="56" r="32" fill="#FFFFFF"/>
      <ellipse cx="34" cy="51" rx="9" ry="11" fill="#2E2938" transform="rotate(-15 34 51)"/>
      <ellipse cx="66" cy="51" rx="9" ry="11" fill="#2E2938" transform="rotate(15 66 51)"/>
      <circle cx="35" cy="51" r="3.6" fill="#FFFFFF"/>
      <circle cx="65" cy="51" r="3.6" fill="#FFFFFF"/>
      <circle cx="36" cy="51" r="2.2" fill="#2E2938"/>
      <circle cx="66" cy="51" r="2.2" fill="#2E2938"/>
      <circle cx="24" cy="64" r="6" fill="#FFB7B2" opacity="0.65"/>
      <circle cx="76" cy="64" r="6" fill="#FFB7B2" opacity="0.65"/>
      <ellipse cx="50" cy="62" rx="4.5" ry="3.2" fill="#2E2938"/>
      <path d="M47 65.5 Q50 68.5 53 65.5" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'clever-fox',
    shortId: 'fox',
    name: 'Clever Fox',
    category: 'animals',
    image: 'assets/avatars/clever-fox.png',
    svgImage: 'assets/avatars/clever-fox.svg',
    emoji: '🦊',
    badge: '🦊',
    bg: '#FFF2EB',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFF2EB"/>
      <polygon points="26,38 12,12 40,24" fill="#F47C36"/>
      <polygon points="25,34 16,16 36,24" fill="#FFFFFF"/>
      <polygon points="74,38 88,12 60,24" fill="#F47C36"/>
      <polygon points="75,34 84,16 64,24" fill="#FFFFFF"/>
      <ellipse cx="50" cy="56" rx="33" ry="28" fill="#F47C36"/>
      <path d="M22 60 C26 78 50 82 50 82 C50 82 74 78 78 60 C70 54 58 60 50 64 C42 60 30 54 22 60 Z" fill="#FFFFFF"/>
      <circle cx="28" cy="62" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="72" cy="62" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="36" cy="51" r="4.2" fill="#2E2938"/>
      <circle cx="37.5" cy="49.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="64" cy="51" r="4.2" fill="#2E2938"/>
      <circle cx="65.5" cy="49.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="50" cy="73" r="3.8" fill="#2E2938"/>
    </svg>`
  },
  {
    id: 'gentle-koala',
    shortId: 'koala',
    name: 'Gentle Koala',
    category: 'animals',
    image: 'assets/avatars/gentle-koala.png',
    svgImage: 'assets/avatars/gentle-koala.svg',
    emoji: '🐨',
    badge: '🐨',
    bg: '#EFF3FA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#EFF3FA"/>
      <circle cx="20" cy="34" r="14" fill="#A8B4C4"/>
      <circle cx="20" cy="34" r="8" fill="#E4EAF2"/>
      <circle cx="80" cy="34" r="14" fill="#A8B4C4"/>
      <circle cx="80" cy="34" r="8" fill="#E4EAF2"/>
      <ellipse cx="50" cy="58" rx="32" ry="27" fill="#A8B4C4"/>
      <ellipse cx="50" cy="59" rx="7" ry="11" fill="#3D3A45"/>
      <circle cx="26" cy="64" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="74" cy="64" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="34" cy="52" r="3.8" fill="#2E2938"/>
      <circle cx="35.5" cy="50.8" r="1.4" fill="#FFFFFF"/>
      <circle cx="66" cy="52" r="3.8" fill="#2E2938"/>
      <circle cx="67.5" cy="50.8" r="1.4" fill="#FFFFFF"/>
      <path d="M47 72 Q50 74 53 72" fill="none" stroke="#2E2938" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'chubby-hamster',
    shortId: 'hamster',
    name: 'Chubby Hamster',
    category: 'animals',
    image: 'assets/avatars/chubby-hamster.png',
    svgImage: 'assets/avatars/chubby-hamster.svg',
    emoji: '🐹',
    badge: '🐹',
    bg: '#FFF8E8',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFF8E8"/>
      <circle cx="24" cy="30" r="9" fill="#E2A669"/>
      <circle cx="24" cy="30" r="5" fill="#FFC9D9"/>
      <circle cx="76" cy="30" r="9" fill="#E2A669"/>
      <circle cx="76" cy="30" r="5" fill="#FFC9D9"/>
      <ellipse cx="50" cy="58" rx="34" ry="28" fill="#E2A669"/>
      <ellipse cx="50" cy="66" rx="20" ry="16" fill="#FFFFFF"/>
      <circle cx="24" cy="66" r="7" fill="#FFB0B0" opacity="0.7"/>
      <circle cx="76" cy="66" r="7" fill="#FFB0B0" opacity="0.7"/>
      <circle cx="36" cy="53" r="4" fill="#2E2938"/>
      <circle cx="37.5" cy="51.5" r="1.5" fill="#FFFFFF"/>
      <circle cx="64" cy="53" r="4" fill="#2E2938"/>
      <circle cx="65.5" cy="51.5" r="1.5" fill="#FFFFFF"/>
      <polygon points="48,60 52,60 50,62.5" fill="#FF85A2"/>
      <path d="M47 63.5 Q50 66.5 50 63.5 Q50 66.5 53 63.5" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'joyful-frog',
    shortId: 'frog',
    name: 'Joyful Frog',
    category: 'animals',
    image: 'assets/avatars/joyful-frog.png',
    svgImage: 'assets/avatars/joyful-frog.svg',
    emoji: '🐸',
    badge: '🐸',
    bg: '#EAF9E8',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#EAF9E8"/>
      <circle cx="28" cy="36" r="14" fill="#78C850"/>
      <circle cx="28" cy="36" r="8" fill="#FFFFFF"/>
      <circle cx="28" cy="36" r="4.2" fill="#2E2938"/>
      <circle cx="29.5" cy="34.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="72" cy="36" r="14" fill="#78C850"/>
      <circle cx="72" cy="36" r="8" fill="#FFFFFF"/>
      <circle cx="72" cy="36" r="4.2" fill="#2E2938"/>
      <circle cx="73.5" cy="34.5" r="1.6" fill="#FFFFFF"/>
      <ellipse cx="50" cy="60" rx="34" ry="26" fill="#78C850"/>
      <ellipse cx="50" cy="66" rx="20" ry="14" fill="#B2E898"/>
      <circle cx="26" cy="60" r="6" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="74" cy="60" r="6" fill="#FFAAA6" opacity="0.65"/>
      <path d="M38 62 Q50 72 62 62" fill="none" stroke="#2E2938" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'sunny-chick',
    shortId: 'chick',
    name: 'Sunny Chick',
    category: 'animals',
    image: 'assets/avatars/sunny-chick.png',
    svgImage: 'assets/avatars/sunny-chick.svg',
    emoji: '🐥',
    badge: '🐥',
    bg: '#FFFDE5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFFDE5"/>
      <path d="M50 20 Q48 10 44 14 Q48 14 50 22 Q52 14 56 14 Q52 10 50 20 Z" fill="#F8C222"/>
      <circle cx="50" cy="56" r="32" fill="#FFDE59"/>
      <ellipse cx="18" cy="58" rx="6" ry="10" fill="#F8C222" transform="rotate(-15 18 58)"/>
      <ellipse cx="82" cy="58" rx="6" ry="10" fill="#F8C222" transform="rotate(15 82 58)"/>
      <circle cx="34" cy="50" r="4.2" fill="#2E2938"/>
      <circle cx="35.5" cy="48.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="66" cy="50" r="4.2" fill="#2E2938"/>
      <circle cx="67.5" cy="48.5" r="1.6" fill="#FFFFFF"/>
      <circle cx="26" cy="61" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="74" cy="61" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <polygon points="44,56 56,56 50,65" fill="#FF8D29"/>
    </svg>`
  },
  {
    id: 'chilly-penguin',
    shortId: 'penguin',
    name: 'Chilly Penguin',
    category: 'animals',
    image: 'assets/avatars/chilly-penguin.png',
    svgImage: 'assets/avatars/chilly-penguin.svg',
    emoji: '🐧',
    badge: '🐧',
    bg: '#EBF4FA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#EBF4FA"/>
      <ellipse cx="50" cy="54" rx="31" ry="32" fill="#2C3246"/>
      <ellipse cx="50" cy="59" rx="23" ry="24" fill="#FFFFFF"/>
      <ellipse cx="19" cy="60" rx="5" ry="13" fill="#2C3246" transform="rotate(-15 19 60)"/>
      <ellipse cx="81" cy="60" rx="5" ry="13" fill="#2C3246" transform="rotate(15 81 60)"/>
      <circle cx="38" cy="51" r="3.8" fill="#2E2938"/>
      <circle cx="39.5" cy="49.5" r="1.4" fill="#FFFFFF"/>
      <circle cx="62" cy="51" r="3.8" fill="#2E2938"/>
      <circle cx="63.5" cy="49.5" r="1.4" fill="#FFFFFF"/>
      <circle cx="29" cy="61" r="5" fill="#FFB7B2" opacity="0.65"/>
      <circle cx="71" cy="61" r="5" fill="#FFB7B2" opacity="0.65"/>
      <polygon points="45,56 55,56 50,64" fill="#FFA62B"/>
    </svg>`
  },
  {
    id: 'magic-unicorn',
    shortId: 'unicorn',
    name: 'Magic Unicorn',
    category: 'animals',
    image: 'assets/avatars/magic-unicorn.png',
    svgImage: 'assets/avatars/magic-unicorn.svg',
    emoji: '🦄',
    badge: '🦄',
    bg: '#FBF0FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FBF0FF"/>
      <polygon points="47,28 53,28 50,6" fill="#FFDE59"/>
      <path d="M48 20 L52 22 M49 14 L51 16" stroke="#FFA726" stroke-width="1.2"/>
      <polygon points="26,38 18,18 36,28" fill="#FFFFFF"/>
      <polygon points="26,35 21,22 33,28" fill="#FFB6D9"/>
      <polygon points="74,38 82,18 64,28" fill="#FFFFFF"/>
      <polygon points="74,35 79,22 67,28" fill="#FFB6D9"/>
      <path d="M30 28 Q45 20 60 28 Q75 36 68 46" fill="none" stroke="#C785EC" stroke-width="4.5" stroke-linecap="round"/>
      <ellipse cx="50" cy="60" rx="31" ry="27" fill="#FFFFFF"/>
      <ellipse cx="50" cy="69" rx="14" ry="10" fill="#FFE2EC"/>
      <circle cx="26" cy="65" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="74" cy="65" r="5.5" fill="#FFAAA6" opacity="0.65"/>
      <path d="M33 54 Q38 49 43 54" fill="none" stroke="#2E2938" stroke-width="2" stroke-linecap="round"/>
      <path d="M57 54 Q62 49 67 54" fill="none" stroke="#2E2938" stroke-width="2" stroke-linecap="round"/>
      <circle cx="47" cy="67" r="1.5" fill="#FF85A2"/>
      <circle cx="53" cy="67" r="1.5" fill="#FF85A2"/>
    </svg>`
  },

  // ── Characters (6) ──────────────────────────────────────────────────
  {
    id: 'bright-star',
    shortId: 'star',
    name: 'Bright Star',
    category: 'characters',
    image: 'assets/avatars/bright-star.png',
    svgImage: 'assets/avatars/bright-star.svg',
    emoji: '⭐',
    badge: '⭐',
    bg: '#FFFBEA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFFBEA"/>
      <path d="M50 14 L59 36 L83 37 L64 52 L71 75 L50 62 L29 75 L36 52 L17 37 L41 36 Z" fill="#FFD43B" stroke="#FAB005" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="34" cy="53" r="5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="66" cy="53" r="5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="42" cy="46" r="3.5" fill="#2E2938"/>
      <circle cx="43.2" cy="44.8" r="1.4" fill="#FFFFFF"/>
      <circle cx="58" cy="46" r="3.5" fill="#2E2938"/>
      <circle cx="59.2" cy="44.8" r="1.4" fill="#FFFFFF"/>
      <path d="M46 51 Q50 55 54 51" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'dreamy-cloud',
    shortId: 'cloud',
    name: 'Dreamy Cloud',
    category: 'characters',
    image: 'assets/avatars/dreamy-cloud.png',
    svgImage: 'assets/avatars/dreamy-cloud.svg',
    emoji: '☁️',
    badge: '☁️',
    bg: '#EEF6FC',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#EEF6FC"/>
      <g fill="#FFFFFF" stroke="#D0E3F5" stroke-width="2">
        <circle cx="50" cy="40" r="18"/>
        <circle cx="32" cy="52" r="15"/>
        <circle cx="68" cy="52" r="15"/>
        <circle cx="42" cy="62" r="14"/>
        <circle cx="58" cy="62" r="14"/>
      </g>
      <circle cx="50" cy="52" r="20" fill="#FFFFFF"/>
      <circle cx="33" cy="56" r="5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="67" cy="56" r="5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="42" cy="48" r="3.5" fill="#2E2938"/>
      <circle cx="43.2" cy="46.8" r="1.3" fill="#FFFFFF"/>
      <circle cx="58" cy="48" r="3.5" fill="#2E2938"/>
      <circle cx="59.2" cy="46.8" r="1.3" fill="#FFFFFF"/>
      <path d="M46 53 Q50 57 54 53" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'bloom-flower',
    shortId: 'flower',
    name: 'Bloom Flower',
    category: 'characters',
    image: 'assets/avatars/bloom-flower.png',
    svgImage: 'assets/avatars/bloom-flower.svg',
    emoji: '🌸',
    badge: '🌸',
    bg: '#FFF0F5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFF0F5"/>
      <circle cx="50" cy="24" r="13" fill="#FFB6D9"/>
      <circle cx="74" cy="38" r="13" fill="#FFB6D9"/>
      <circle cx="70" cy="68" r="13" fill="#FFB6D9"/>
      <circle cx="30" cy="68" r="13" fill="#FFB6D9"/>
      <circle cx="26" cy="38" r="13" fill="#FFB6D9"/>
      <circle cx="50" cy="50" r="18" fill="#FFE066"/>
      <circle cx="40" cy="56" r="4.5" fill="#FF85A2" opacity="0.6"/>
      <circle cx="60" cy="56" r="4.5" fill="#FF85A2" opacity="0.6"/>
      <circle cx="43" cy="47" r="3.2" fill="#2E2938"/>
      <circle cx="44.2" cy="45.8" r="1.2" fill="#FFFFFF"/>
      <circle cx="57" cy="47" r="3.2" fill="#2E2938"/>
      <circle cx="58.2" cy="45.8" r="1.2" fill="#FFFFFF"/>
      <path d="M47 52 Q50 55 53 52" fill="none" stroke="#2E2938" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'kind-heart',
    shortId: 'heart',
    name: 'Kind Heart',
    category: 'characters',
    image: 'assets/avatars/kind-heart.png',
    svgImage: 'assets/avatars/kind-heart.svg',
    emoji: '💖',
    badge: '💖',
    bg: '#FFF1F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FFF1F3"/>
      <path d="M50 82 C50 82 18 60 18 36 C18 22 29 16 39 20 C46 23 50 30 50 30 C50 30 54 23 61 20 C71 16 82 22 82 36 C82 60 50 82 50 82 Z" fill="#FF6B8B"/>
      <circle cx="34" cy="52" r="5.5" fill="#FFAAA6" opacity="0.75"/>
      <circle cx="66" cy="52" r="5.5" fill="#FFAAA6" opacity="0.75"/>
      <circle cx="40" cy="44" r="3.6" fill="#2E2938"/>
      <circle cx="41.2" cy="42.6" r="1.4" fill="#FFFFFF"/>
      <circle cx="60" cy="44" r="3.6" fill="#2E2938"/>
      <circle cx="61.2" cy="42.6" r="1.4" fill="#FFFFFF"/>
      <path d="M46 50 Q50 54 54 50" fill="none" stroke="#2E2938" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M26 28 Q30 22 36 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    </svg>`
  },
  {
    id: 'cute-sprout',
    shortId: 'mushroom',
    name: 'Cute Sprout',
    category: 'characters',
    image: 'assets/avatars/cute-sprout.png',
    svgImage: 'assets/avatars/cute-sprout.svg',
    emoji: '🍄',
    badge: '🍄',
    bg: '#FDF0EC',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#FDF0EC"/>
      <rect x="38" y="50" width="24" height="28" rx="12" fill="#FFFFFF"/>
      <path d="M18 52 C18 28 32 18 50 18 C68 18 82 28 82 52 Z" fill="#FF5252"/>
      <circle cx="32" cy="34" r="5" fill="#FFFFFF"/>
      <circle cx="68" cy="34" r="5" fill="#FFFFFF"/>
      <circle cx="50" cy="28" r="6" fill="#FFFFFF"/>
      <circle cx="42" cy="46" r="3.5" fill="#FFFFFF"/>
      <circle cx="58" cy="46" r="3.5" fill="#FFFFFF"/>
      <circle cx="34" cy="67" r="4.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="66" cy="67" r="4.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="44" cy="60" r="3" fill="#2E2938"/>
      <circle cx="56" cy="60" r="3" fill="#2E2938"/>
      <path d="M47 64 Q50 67 53 64" fill="none" stroke="#2E2938" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'cosmic-planet',
    shortId: 'planet',
    name: 'Cosmic Planet',
    category: 'characters',
    image: 'assets/avatars/cosmic-planet.png',
    svgImage: 'assets/avatars/cosmic-planet.svg',
    emoji: '🪐',
    badge: '🪐',
    bg: '#F2EDFD',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#F2EDFD"/>
      <ellipse cx="50" cy="52" rx="42" ry="14" fill="none" stroke="#FFD166" stroke-width="4.5" transform="rotate(-18 50 52)"/>
      <circle cx="50" cy="50" r="28" fill="#9D72FF"/>
      <path d="M24 45 Q50 35 76 45" fill="none" stroke="#B897FF" stroke-width="3" opacity="0.6"/>
      <circle cx="36" cy="56" r="4.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="64" cy="56" r="4.5" fill="#FFAAA6" opacity="0.65"/>
      <circle cx="42" cy="48" r="3.5" fill="#FFFFFF"/>
      <circle cx="43.2" cy="46.8" r="1.4" fill="#2E2938"/>
      <circle cx="58" cy="48" r="3.5" fill="#FFFFFF"/>
      <circle cx="59.2" cy="46.8" r="1.4" fill="#2E2938"/>
      <path d="M47 54 Q50 58 53 54" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  }
];

// Helper to convert SVG text to a valid clean Data URL
function svgToDataUrl(svgString) {
  if (!svgString) return '';
  var cleaned = svgString.replace(/\s+/g, ' ').trim();
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(cleaned);
}

// Attach dataUrl to each avatar as fallback
AVATARS.forEach(function(item) {
  item.dataUrl = svgToDataUrl(item.svg);
  // Ensure both category forms match ('animals' and 'animal', 'characters' and 'character')
  item.categoryPlural = item.category;
  item.categorySingular = item.category === 'animals' ? 'animal' : 'character';
});

function isDefaultAvatarValue(val) {
  if (!val) return true;
  var s = String(val).trim().toLowerCase();
  return s === '' || s === 'default' || s === 'null' || s === 'undefined' ||
         s === 'assets/avatars/default-avatar.png' ||
         s === 'assets/avatars/default-avatar.svg' ||
         s.endsWith('/default-avatar.png') ||
         s.endsWith('/default-avatar.svg') ||
         s === 'default-avatar';
}

// Lookup by full id, shortId, filename, or cute: prefix
function getAvatarById(id) {
  if (!id) return null;
  var raw = String(id).trim();
  if (isDefaultAvatarValue(raw)) return null;

  // Strip leading prefixes
  var clean = raw.replace(/^(cute:|avatar:|predefined:)/i, '').trim().toLowerCase();
  // If it's a full path or filename like "assets/avatars/gentle-koala.png", strip directory and extension
  var filename = clean.split('?')[0].split('/').pop().replace(/\.(png|svg|jpg|jpeg|webp)$/i, '');

  return AVATARS.find(function(a) {
    return a.id === clean ||
           a.shortId === clean ||
           a.id === filename ||
           a.shortId === filename ||
           a.image.toLowerCase() === clean ||
           a.image.toLowerCase().endsWith('/' + clean) ||
           a.id.replace(/-/g, '') === filename.replace(/-/g, '') ||
           (a.name && a.name.toLowerCase() === clean);
  }) || null;
}

// Backward compatibility alias
var getCuteAvatarById = getAvatarById;

// ============================================================================
// SINGLE SOURCE OF TRUTH: SafeSpaceAvatars
// ============================================================================
var SafeSpaceAvatars = {
  DEFAULT_AVATAR: DEFAULT_AVATAR,
  DEFAULT_AVATAR_SVG: 'assets/avatars/default-avatar.svg',
  ALL: AVATARS,

  /**
   * Resolves authoritative avatar metadata for any user object, URL, or avatar id.
   * Returns: { type: 'preset'|'photo'|'default', id: string, name: string, image: string, svgImage: string, category: string }
   */
  getAvatar: function(input) {
    var defaultObj = {
      type: 'default',
      id: 'default',
      name: 'Default Safe Space Avatar',
      image: DEFAULT_AVATAR,
      svgImage: 'assets/avatars/default-avatar.svg',
      category: 'default'
    };

    if (!input) return defaultObj;

    // 1. If input is a user/profile object
    if (typeof input === 'object') {
      var aType = input.avatar_type;
      var aVal = input.avatar_value || input.avatar_id;
      var aUrl = input.avatar_url || input.profile_photo || input.avatar;

      // Check if user explicitly set or defaulted to 'default'
      if (isDefaultAvatarValue(aUrl) && (!aVal || isDefaultAvatarValue(aVal))) {
        return defaultObj;
      }

      // Check if avatar_value is a preset
      if (aVal && !isDefaultAvatarValue(aVal)) {
        var foundByVal = getAvatarById(aVal);
        if (foundByVal) {
          return {
            type: 'preset',
            id: foundByVal.id,
            shortId: foundByVal.shortId,
            name: foundByVal.name,
            image: foundByVal.image,
            svgImage: foundByVal.svgImage || 'assets/avatars/default-avatar.svg',
            category: foundByVal.category,
            dataUrl: foundByVal.dataUrl
          };
        }
      }

      // Check if avatar_url is a preset
      if (aUrl && !isDefaultAvatarValue(aUrl)) {
        var foundByUrl = getAvatarById(aUrl);
        if (foundByUrl) {
          return {
            type: 'preset',
            id: foundByUrl.id,
            shortId: foundByUrl.shortId,
            name: foundByUrl.name,
            image: foundByUrl.image,
            svgImage: foundByUrl.svgImage || 'assets/avatars/default-avatar.svg',
            category: foundByUrl.category,
            dataUrl: foundByUrl.dataUrl
          };
        }

        // Custom uploaded photo (URL or base64 data URL)
        var cleanUrl = typeof aUrl === 'string' ? aUrl.trim() : '';
        if (cleanUrl !== '' && !isDefaultAvatarValue(cleanUrl)) {
          return {
            type: 'photo',
            id: 'custom-photo',
            name: 'Profile Photo',
            image: cleanUrl,
            svgImage: 'assets/avatars/default-avatar.svg',
            category: 'custom'
          };
        }
      }

      return defaultObj;
    }

    // 2. If input is a string (id, path, or URL)
    if (typeof input === 'string') {
      var str = input.trim();
      if (isDefaultAvatarValue(str)) return defaultObj;

      var foundPreset = getAvatarById(str);
      if (foundPreset) {
        return {
          type: 'preset',
          id: foundPreset.id,
          shortId: foundPreset.shortId,
          name: foundPreset.name,
          image: foundPreset.image,
          svgImage: foundPreset.svgImage || 'assets/avatars/default-avatar.svg',
          category: foundPreset.category,
          dataUrl: foundPreset.dataUrl
        };
      }

      // If it looks like a remote URL, local path, or data URI
      if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/') || str.startsWith('assets/') || str.startsWith('data:image/')) {
        return {
          type: 'photo',
          id: 'custom-photo',
          name: 'Profile Photo',
          image: str,
          svgImage: 'assets/avatars/default-avatar.svg',
          category: 'custom'
        };
      }
    }

    return defaultObj;
  },

  /**
   * Returns authoritative avatar image URL. Never returns undefined, null, or empty string.
   */
  getUrl: function(input) {
    var meta = SafeSpaceAvatars.getAvatar(input);
    return (meta && meta.image) ? meta.image : DEFAULT_AVATAR;
  },

  /**
   * Generates standard safe HTML <img> for this user's avatar.
   * Guarantees:
   * - Fallback to DEFAULT_AVATAR on error (no broken icons)
   * - Circular styling with object-fit: cover and object-position: center (no distortion)
   * - Anonymity protection when isAnonymous: true
   */
  renderHtml: function(input, options) {
    options = options || {};
    if (options.isAnonymous) {
      return '<i class="fas fa-user-secret" aria-label="Anonymous"></i>';
    }

    var meta = SafeSpaceAvatars.getAvatar(input);
    var url = meta.image || DEFAULT_AVATAR;
    var name = options.alt || (meta.name ? meta.name : 'Avatar');
    var className = options.className ? 'user-avatar ' + options.className : 'user-avatar';
    var extraStyle = options.style ? options.style : 'width:100%; height:100%; object-fit:cover; object-position:center; border-radius:50%; display:block;';

    // Safe escaping
    var cleanUrl = String(url).replace(/"/g, '&quot;');
    var cleanAlt = String(name).replace(/"/g, '&quot;');
    var fallback = (meta.svgImage || 'assets/avatars/default-avatar.svg').replace(/"/g, '&quot;');
    var secondFallback = 'assets/avatars/default-avatar.svg';

    return '<img src="' + cleanUrl + '" alt="' + cleanAlt + '" class="' + className + '" onerror="this.onerror=null; this.src=\'' + fallback + '\';" style="' + extraStyle + '" />';
  }
};

// Backward compatible helper
function resolveAvatarUrl(avatarUrl, avatarType, avatarValue) {
  if (avatarType || avatarValue) {
    return SafeSpaceAvatars.getUrl({ avatar_url: avatarUrl, avatar_type: avatarType, avatar_value: avatarValue });
  }
  return SafeSpaceAvatars.getUrl(avatarUrl);
}

if (typeof window !== 'undefined') {
  window.DEFAULT_AVATAR = DEFAULT_AVATAR;
  window.AVATARS = AVATARS;
  window.CUTE_AVATARS = AVATARS;
  window.getAvatarById = getAvatarById;
  window.getCuteAvatarById = getAvatarById;
  window.SafeSpaceAvatars = SafeSpaceAvatars;
  window.getUserAvatarUrl = SafeSpaceAvatars.getUrl;
  window.renderUserAvatarHtml = SafeSpaceAvatars.renderHtml;
  window.resolveAvatarUrl = resolveAvatarUrl;
  window.svgToDataUrl = svgToDataUrl;
}

