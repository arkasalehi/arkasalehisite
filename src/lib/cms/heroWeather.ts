export const HERO_WEATHERS = [
  { id: "partly-cloudy", label: "نیمه‌ابری", hint: "آسمان فعلی", swatch: "linear-gradient(180deg,#4aa0de,#d4edf9)" },
  { id: "sunny", label: "آفتابی", hint: "آسمان روشن و خورشید", swatch: "linear-gradient(180deg,#3db4f5,#fff3c4)" },
  { id: "cloudy", label: "ابری", hint: "ابرهای خاکستری", swatch: "linear-gradient(180deg,#7a8fa3,#cfd6dc)" },
  { id: "rainy", label: "بارانی", hint: "بارش باران", swatch: "linear-gradient(180deg,#4d6780,#9bb0c2)" },
  { id: "storm", label: "رعد و برق", hint: "آسمان تیره و برق", swatch: "linear-gradient(180deg,#243044,#5b6b7c)" },
  { id: "snowy", label: "برفی", hint: "بارش برف", swatch: "linear-gradient(180deg,#8eb4d4,#f4f8fb)" },
  { id: "autumn", label: "پاییزی", hint: "برگ‌های نارنجی", swatch: "linear-gradient(180deg,#e07a3d,#f6d59a)" },
  { id: "rainbow", label: "رنگین‌کمان", hint: "بعد از باران", swatch: "linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6)" },
  { id: "sunset", label: "غروب", hint: "صورتی و نارنجی", swatch: "linear-gradient(180deg,#f97316,#f9a8d4)" },
  { id: "fog", label: "مه", hint: "مه نرم", swatch: "linear-gradient(180deg,#9aa7b2,#e6eaed)" },
  { id: "night", label: "شب", hint: "ستاره‌ها", swatch: "linear-gradient(180deg,#0b1020,#3b4a7a)" },
] as const;

export const HERO_WEATHER_IDS = [
  "partly-cloudy",
  "sunny",
  "cloudy",
  "rainy",
  "storm",
  "snowy",
  "autumn",
  "rainbow",
  "sunset",
  "fog",
  "night",
] as const;

export type HeroWeatherId = (typeof HERO_WEATHER_IDS)[number];

export const DEFAULT_HERO_WEATHER: HeroWeatherId = "partly-cloudy";

export function isHeroWeather(value: unknown): value is HeroWeatherId {
  return HERO_WEATHERS.some((item) => item.id === value);
}

export function resolveHeroWeather(value: unknown): HeroWeatherId {
  return isHeroWeather(value) ? value : DEFAULT_HERO_WEATHER;
}
