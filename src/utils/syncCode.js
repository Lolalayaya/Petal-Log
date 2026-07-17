// 同步碼：格式為 `主題詞-主題詞-4碼隨機英數-1碼檢查碼`（如 `Radiant-Comet-7K3F-M`）。
//
// 安全性完全由 4 碼隨機區塊負責（用 crypto.getRandomValues，不是 Math.random）；
// 主題詞只負責「好記、有風格」；檢查碼只負責「就地抓打字錯誤」，公式公開、不增加安全性。
// 詳見專案討論定案的設計：5 個主題詞庫彼此完全獨立（150 個詞不重複），
// 每個主題各有 10 個形容詞／名詞／副詞／動詞，隨機組出「形容詞+名詞」或「副詞+動詞」。

export const THEME_BANKS = {
  Cosmos: {
    adjectives: ['Stellar', 'Lunar', 'Radiant', 'Distant', 'Frozen', 'Endless', 'Glowing', 'Hidden', 'Infinite', 'Cosmic'],
    nouns: ['Comet', 'Nova', 'Orbit', 'Nebula', 'Meteor', 'Galaxy', 'Eclipse', 'Aurora', 'Pulsar', 'Horizon'],
    adverbs: ['Silently', 'Swiftly', 'Faintly', 'Softly', 'Steadily', 'Eternally', 'Gently', 'Brightly', 'Boundlessly', 'Quietly'],
    verbs: ['Drift', 'Ignite', 'Shimmer', 'Collide', 'Wander', 'Ascend', 'Vanish', 'Glide', 'Pulse', 'Spiral'],
  },
  Reverie: {
    adjectives: ['Mystic', 'Enchanted', 'Ethereal', 'Velvet', 'Whimsical', 'Luminous', 'Dreamy', 'Magical', 'Fading', 'Secret'],
    nouns: ['Fairy', 'Phoenix', 'Spirit', 'Mirage', 'Feather', 'Lantern', 'Riddle', 'Charm', 'Illusion', 'Enigma'],
    adverbs: ['Mysteriously', 'Dreamily', 'Magically', 'Tenderly', 'Delicately', 'Curiously', 'Playfully', 'Serenely', 'Vividly', 'Subtly'],
    verbs: ['Enchant', 'Conjure', 'Whisper', 'Dream', 'Flutter', 'Transform', 'Sparkle', 'Bewitch', 'Levitate', 'Imagine'],
  },
  Fortress: {
    adjectives: ['Iron', 'Stone', 'Royal', 'Fortified', 'Grand', 'Noble', 'Towering', 'Guarded', 'Marble', 'Sturdy'],
    nouns: ['Tower', 'Rampart', 'Keep', 'Gate', 'Bastion', 'Throne', 'Banner', 'Moat', 'Spire', 'Vault'],
    adverbs: ['Boldly', 'Fiercely', 'Proudly', 'Firmly', 'Sternly', 'Valiantly', 'Resolutely', 'Solemnly', 'Mightily', 'Sharply'],
    verbs: ['Defend', 'Guard', 'Conquer', 'Fortify', 'Command', 'Besiege', 'Shield', 'Rally', 'Forge', 'Stand'],
  },
  Tide: {
    adjectives: ['Tidal', 'Coral', 'Salty', 'Stormy', 'Turquoise', 'Restless', 'Glistening', 'Foaming', 'Rolling', 'Briny'],
    nouns: ['Wave', 'Current', 'Reef', 'Anchor', 'Harbor', 'Shoal', 'Lagoon', 'Shell', 'Whale', 'Compass'],
    adverbs: ['Gracefully', 'Calmly', 'Deeply', 'Freely', 'Wildly', 'Smoothly', 'Rhythmically', 'Vastly', 'Fluidly', 'Timelessly'],
    verbs: ['Flow', 'Surge', 'Ebb', 'Sail', 'Dive', 'Ripple', 'Voyage', 'Emerge', 'Swim', 'Splash'],
  },
  Wildwood: {
    adjectives: ['Woodland', 'Mossy', 'Shaded', 'Rustling', 'Verdant', 'Thorny', 'Blooming', 'Wild', 'Fragrant', 'Emerald'],
    nouns: ['Grove', 'Bramble', 'Canopy', 'Meadow', 'Fern', 'Thicket', 'Sapling', 'Timber', 'Bough', 'Trail'],
    adverbs: ['Naturally', 'Peacefully', 'Richly', 'Densely', 'Lazily', 'Patiently', 'Warmly', 'Humbly', 'Slowly', 'Freshly'],
    verbs: ['Grow', 'Bloom', 'Root', 'Rustle', 'Shelter', 'Nurture', 'Flourish', 'Roam', 'Thrive', 'Sprout'],
  },
}

// 給 UI 顯示用的中文主題名稱，供使用者在啟用同步時選擇風格（或選「隨機」交給系統挑）。
export const THEME_LABELS = {
  Cosmos: '星空',
  Reverie: '夢幻',
  Fortress: '城堡',
  Tide: '海洋',
  Wildwood: '森林',
}

// 排除易混淆字元：0/O、1/I，共 32 個字元（8 數字＋24 字母），4 碼約有 32^4 ≈ 105 萬種組合（~20 bits）。
const RANDOM_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const RANDOM_BLOCK_LENGTH = 4

const CODE_PATTERN = /^[A-Z]+-[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]$/

function pickRandom(list) {
  const index = Math.floor(Math.random() * list.length)
  return list[index]
}

/**
 * 選一個主題、隨機選「形容詞+名詞」或「副詞+動詞」模式，回傳如 `Radiant-Comet`。
 * @param {string} [themeName] 指定主題（THEME_BANKS 的 key）；省略或不是合法主題名稱時隨機挑一個。
 */
export function pickThemeWordPair(themeName) {
  const themeNames = Object.keys(THEME_BANKS)
  const resolvedName = themeName && THEME_BANKS[themeName] ? themeName : pickRandom(themeNames)
  const theme = THEME_BANKS[resolvedName]
  const useVerbPattern = Math.random() < 0.5
  const [first, second] = useVerbPattern
    ? [pickRandom(theme.adverbs), pickRandom(theme.verbs)]
    : [pickRandom(theme.adjectives), pickRandom(theme.nouns)]
  return `${first}-${second}`
}

/** 4 碼隨機英數區塊，是同步碼真正的安全下限，必須用密碼學等級的亂數來源。 */
export function randomAlphanumericBlock(length = RANDOM_BLOCK_LENGTH) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += RANDOM_CHARSET[bytes[i] % RANDOM_CHARSET.length]
  }
  return result
}

/**
 * 對碼本體（主題詞＋隨機區塊）算出一個檢查碼字元，純粹用來偵測打字錯誤，
 * 公式公開、任何人都能算，不作為安全機制。仿身分證字號「固定加權＋取餘數」的算法。
 */
export function computeChecksumChar(codeBody) {
  let sum = 0
  for (let i = 0; i < codeBody.length; i++) {
    const weight = (i % 9) + 1
    sum += codeBody.charCodeAt(i) * weight
  }
  return RANDOM_CHARSET[sum % RANDOM_CHARSET.length]
}

/**
 * 產生一組完整同步碼，如 `Radiant-Comet-7K3F-M`。
 * @param {string} [themeName] 使用者選擇的主題（THEME_BANKS 的 key）；省略時隨機挑一個主題。
 */
export function generateSyncCode(themeName) {
  const themePart = pickThemeWordPair(themeName)
  const randomBlock = randomAlphanumericBlock()
  const body = `${themePart}-${randomBlock}`
  const checksum = computeChecksumChar(normalizeSyncCode(body))
  return `${body}-${checksum}`
}

/** 正規化使用者輸入：去除前後空白、把空白轉成連字號、統一大寫，讓大小寫/空白差異不影響比對結果。 */
export function normalizeSyncCode(raw) {
  return raw.trim().replace(/\s+/g, '-').replace(/-+/g, '-').toUpperCase()
}

/**
 * 驗證同步碼格式與檢查碼是否正確，在呼叫 Supabase 之前先擋掉明顯打錯的輸入。
 * @returns {{ valid: boolean, reason: null | 'bad-format' | 'checksum-mismatch', normalized: string }}
 */
export function validateSyncCodeChecksum(rawCode) {
  const normalized = normalizeSyncCode(rawCode)

  if (!CODE_PATTERN.test(normalized)) {
    return { valid: false, reason: 'bad-format', normalized }
  }

  const lastHyphen = normalized.lastIndexOf('-')
  const body = normalized.slice(0, lastHyphen)
  const checksum = normalized.slice(lastHyphen + 1)

  if (computeChecksumChar(body) !== checksum) {
    return { valid: false, reason: 'checksum-mismatch', normalized }
  }

  return { valid: true, reason: null, normalized }
}
