const KNOWN_BRANDS: Record<string, string> = {
  '麥當勞': '麥當勞',
  'mcdonald': '麥當勞',
  'kfc': 'KFC',
  '美心mx': '美心MX',
  '美心': '美心MX',
  '大家樂': '大家樂',
  '大快活': '大快活',
  '太興': '太興',
  '譚仔': '譚仔',
  '吉野家': '吉野家',
  'mos burger': 'MOS Burger',
  'godiva': 'GODIVA',
  'häagen-dazs': 'Häagen-Dazs',
  'haagen-dazs': 'Häagen-Dazs',
  'starbucks': 'Starbucks',
  '星巴克': 'Starbucks',
  '天仁茗茶': '天仁茗茶',
  '聖安娜': '聖安娜餅屋',
  '蛋撻王': '蛋撻王',
  '東海堂': '東海堂',
  'chateraise': 'Chateraise',
  '元氣壽司': '元氣壽司',
  '一粥麵': '一粥麵',
  '意粉屋': '意粉屋',
  'the spaghetti house': '意粉屋',
  'ikea': 'IKEA',
  '宜家': 'IKEA',
  '銀杏館': '銀杏館',
  '海港飲食': '海港飲食',
  '稻香': '稻香',
  // Supermarket & Convenience
  '百佳': '百佳',
  'parknshop': '百佳',
  '7-eleven': '7-Eleven',
  '7 eleven': '7-Eleven',
  'ok便利店': 'OK便利店',
  'circle k': 'OK便利店',
  'ok 便利店': 'OK便利店',
  '759': '759阿信屋',
  '阿信屋': '759阿信屋',
  '萬寧': '萬寧',
  'mannings': '萬寧',
  '屈臣氏': '屈臣氏',
  'watsons': '屈臣氏',
  'aeon': 'AEON',
  '優品360': '優品360',
  '佳宝': '佳寶',
  '一田': '一田',
  'bigc': 'BigC',
  'fresh 新鮮生活': 'FRESH新鮮生活',
  'fresh新鮮生活': 'FRESH新鮮生活',
  'u士多': 'U士多',
  '龍豐': '龍豐',
  '樓上': '樓上',
  // Fashion
  'uniqlo': 'Uniqlo',
  'gu': 'GU',
  'baleno': 'Baleno',
  'dr. kong': 'Dr. Kong',
  'h&m': 'H&M',
  'zara': 'ZARA',
  'michael kors': 'Michael Kors',
  // Hotels
  '帝苑酒店': '帝苑酒店',
  '帝逸酒店': '帝逸酒店',
  '萬麗海景酒店': '萬麗海景酒店',
  'w 酒店': 'W Hotel',
  'w酒店': 'W Hotel',
  'w hotel': 'W Hotel',
  '半島酒店': '半島酒店',
  '四季酒店': '四季酒店',
  '文華東方': '文華東方',
  '香格里拉': '香格里拉',
  '麗思卡爾頓': '麗思卡爾頓',
  'ritz-carlton': '麗思卡爾頓',
  '洲際酒店': '洲際酒店',
  'intercontinental': '洲際酒店',
  '君悅酒店': '君悅酒店',
  'grand hyatt': '君悅酒店',
  '凱悅酒店': '凱悅酒店',
  'hyatt': '凱悅酒店',
  '瑰麗酒店': '瑰麗酒店',
  'rosewood': '瑰麗酒店',
  '朗廷酒店': '朗廷酒店',
  'langham': '朗廷酒店',
  '富麗敦': '富麗敦酒店',
  '帝京酒店': '帝京酒店',
  '黃金海岸酒店': '黃金海岸酒店',
  '海洋公園酒店': '海洋公園酒店',
  '迪士尼': '迪士尼',
  'disney': '迪士尼',
  '喜來登': '喜來登',
  'sheraton': '喜來登',
  '萬豪': '萬豪酒店',
  'marriott': '萬豪酒店',
  '港麗酒店': '港麗酒店',
  'conrad': '港麗酒店',
  '嘉里酒店': '嘉里酒店',
  'kerry hotel': '嘉里酒店',
  '美利酒店': '美利酒店',
  '奕居': '奕居',
  'upper house': '奕居',
  // Travel
  'klook': 'Klook',
  'kkday': 'KKDay',
  'hk express': 'HK Express',
  '國泰': '國泰航空',
  'cathay': '國泰航空',
  // Others
  '八達通': '八達通',
  'mtr': '港鐵',
  '港鐵': '港鐵',
  'alipay': 'AlipayHK',
  'alipayhk': 'AlipayHK',
};

export interface BrandResult {
  brand: string | null;
  cleanTitle: string;
}

export function extractBrand(title: string): BrandResult {
  const colonIdx = title.indexOf('：');
  if (colonIdx > 0 && colonIdx < 30) {
    const candidate = title.slice(0, colonIdx).trim();
    if (candidate.length >= 2 && candidate.length <= 25) {
      const known = matchKnownBrand(candidate);
      if (known) {
        return { brand: known, cleanTitle: title.slice(colonIdx + 1).trim() };
      }
    }
  }

  const halfColonIdx = title.indexOf(':');
  if (halfColonIdx > 0 && halfColonIdx < 30) {
    const candidate = title.slice(0, halfColonIdx).trim();
    if (candidate.length >= 2 && candidate.length <= 25) {
      const known = matchKnownBrand(candidate);
      if (known) {
        return { brand: known, cleanTitle: title.slice(halfColonIdx + 1).trim() };
      }
    }
  }

  const lower = title.toLowerCase();
  for (const [key, brand] of Object.entries(KNOWN_BRANDS)) {
    if (lower.includes(key)) {
      const idx = lower.indexOf(key);
      let cleaned = title;
      if (idx === 0) {
        cleaned = title.slice(key.length).replace(/^[\s\-–—|:：·]+/, '').trim();
      }
      return { brand, cleanTitle: cleaned || title };
    }
  }

  return { brand: null, cleanTitle: title };
}

function matchKnownBrand(candidate: string): string | null {
  const lower = candidate.toLowerCase();
  for (const [key, brand] of Object.entries(KNOWN_BRANDS)) {
    if (lower === key || lower.includes(key)) return brand;
  }
  return null;
}

