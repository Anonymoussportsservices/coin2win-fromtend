export type CasinoCategory = {
  id: string
  label: string
  slug?: string
  description?: string
}

export type CasinoGame = {
  id: string
  name: string
  provider: string
  image: string
  thumbnail?: string
  href?: string
  live?: boolean
  comingSoon?: boolean
  categories: string[]
  badge?: string
}

export const casinoCategories: CasinoCategory[] = [
  {
    id: "originals",
    label: "Originals",
    slug: "/casino/originals",
    description: "In-house games built for fast crypto play.",
  },
  {
    id: "slots",
    label: "Slots",
    slug: "/casino/slots",
    description: "Top slot shelves and future provider expansion.",
  },
  {
    id: "hot",
    label: "Hot Games",
    description: "Most pushed and most visible games in the lobby.",
  },
  {
    id: "live",
    label: "Live Casino",
    slug: "/casino/live",
    description: "Live dealer and real-time table action.",
  },
  {
    id: "game-show",
    label: "Game Show",
    description: "Show-style live content and featured entertainment tables.",
  },
  {
    id: "new-releases",
    label: "New Releases",
    description: "Fresh games and newly surfaced content.",
  },
  {
    id: "blackjack",
    label: "Blackjack",
    description: "Blackjack-focused shelf for quick browsing.",
  },
  {
    id: "roulette",
    label: "Roulette",
    description: "Roulette-focused shelf for quick browsing.",
  },
  {
    id: "table",
    label: "Table Games",
    slug: "/casino/table-games",
    description: "Classic casino tables and broader table content.",
  },
]

export const casinoGames: CasinoGame[] = [
  {
    id: "crash",
    name: "Crash",
    provider: "Coin2Win Originals",
    image: "🚀",
    href: "/crash",
    live: true,
    categories: ["originals", "hot"],
    badge: "Live",
  },
  {
    id: "dice",
    name: "Dice",
    provider: "Coin2Win Originals",
    image: "🎲",
    href: "/dice",
    live: true,
    categories: ["originals", "hot"],
    badge: "Live",
  },
  {
    id: "mines",
    name: "Mines",
    provider: "Coin2Win Originals",
    image: "💣",
    href: "/mines",
    live: true,
    categories: ["originals", "hot", "new-releases"],
    badge: "Live",
  },
  {
    id: "hilo",
    name: "Hi-Lo",
    provider: "Coin2Win Originals",
    image: "🃏",
    href: "/hilo",
    live: true,
    categories: ["originals", "hot", "new-releases"],
    badge: "Live",
  },
  {
    id: "coinflip",
    name: "Coinflip",
    provider: "Coin2Win Originals",
    image: "🪙",
    href: "/coinflip",
    live: true,
    categories: ["originals", "hot", "new-releases"],
    badge: "Live",
  },
  {
    id: "plinko",
    name: "Plinko",
    provider: "Coin2Win Originals",
    image: "🟣",
    comingSoon: true,
    categories: ["originals", "new-releases"],
    badge: "Soon",
  },
  {
    id: "limbo",
    name: "Limbo",
    provider: "Coin2Win Originals",
    image: "⚡",
    comingSoon: true,
    categories: ["originals", "hot"],
    badge: "Soon",
  },

  {
    id: "sweet-bonanza",
    name: "Sweet Bonanza",
    provider: "Pragmatic Play",
    image: "🍬",
    comingSoon: true,
    categories: ["slots", "hot", "new-releases"],
    badge: "Hot",
  },
  {
    id: "gates-of-olympus",
    name: "Gates of Olympus",
    provider: "Pragmatic Play",
    image: "⚡",
    comingSoon: true,
    categories: ["slots", "hot"],
    badge: "Hot",
  },
  {
    id: "big-bass-bonanza",
    name: "Big Bass Bonanza",
    provider: "Pragmatic Play",
    image: "🐟",
    comingSoon: true,
    categories: ["slots", "new-releases"],
    badge: "Soon",
  },
  {
    id: "wanted-dead-or-a-wild",
    name: "Wanted Dead or a Wild",
    provider: "Hacksaw",
    image: "🤠",
    comingSoon: true,
    categories: ["slots", "hot"],
    badge: "Soon",
  },

  {
    id: "blackjack-live",
    name: "Blackjack Live",
    provider: "Evolution",
    image: "🃏",
    comingSoon: true,
    categories: ["live", "blackjack", "game-show"],
    badge: "Soon",
  },
  {
    id: "lightning-roulette",
    name: "Lightning Roulette",
    provider: "Evolution",
    image: "🎡",
    comingSoon: true,
    categories: ["live", "roulette", "game-show", "hot"],
    badge: "Hot",
  },
  {
    id: "bac-bo",
    name: "Bac Bo",
    provider: "Evolution",
    image: "🎲",
    comingSoon: true,
    categories: ["live", "game-show", "new-releases"],
    badge: "Soon",
  },

  {
    id: "roulette",
    name: "Roulette",
    provider: "Table Games",
    image: "🔴",
    comingSoon: true,
    categories: ["table", "roulette"],
    badge: "Soon",
  },
  {
    id: "blackjack",
    name: "Blackjack",
    provider: "Table Games",
    image: "♠️",
    comingSoon: true,
    categories: ["table", "blackjack"],
    badge: "Soon",
  },
  {
    id: "baccarat",
    name: "Baccarat",
    provider: "Table Games",
    image: "♦️",
    comingSoon: true,
    categories: ["table", "new-releases"],
    badge: "Soon",
  },
]

export const casinoHero = {
  badge: "Coin2Win Originals",
  title: "Casino Lobby",
  description:
    "Fast crypto-native play, cleaner browsing, and expandable shelves for Originals, Slots, Live Casino, and table content.",
  primaryCta: { label: "Play Crash", href: "/crash" },
  secondaryCta: { label: "Play Dice", href: "/dice" },
  image: "🚀",
}

export function getGamesByCategory(categoryId: string) {
  return casinoGames.filter((game) => game.categories.includes(categoryId))
}

export function getCategoryById(categoryId: string) {
  return casinoCategories.find((category) => category.id === categoryId)
}
