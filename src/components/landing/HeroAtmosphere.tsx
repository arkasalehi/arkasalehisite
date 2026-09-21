import { resolveHeroWeather, type HeroWeatherId } from "@/lib/cms/heroWeather";

export function HeroAtmosphere({ weather }: { weather: HeroWeatherId | string }) {
  const id = resolveHeroWeather(weather);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {id === "sunny" ? <Sun /> : null}
      {id === "sunset" ? <Sun className="hero-sun-set" /> : null}
      {id === "rainbow" ? <Rainbow /> : null}
      {id === "night" ? <Stars /> : null}
      {id === "storm" ? <Lightning /> : null}
      <Clouds weather={id} />
      {id === "rainy" || id === "storm" ? <div className="hero-precip-rain absolute inset-0" /> : null}
      {id === "snowy" ? <div className="hero-precip-snow absolute inset-0" /> : null}
      {id === "autumn" ? <Leaves /> : null}
      {id === "fog" ? <Fog /> : null}
    </div>
  );
}

function Sun({ className = "" }: { className?: string }) {
  return <div className={`hero-sun absolute ${className}`} />;
}

function Rainbow() {
  return <div className="hero-rainbow absolute left-1/2 top-[18%] h-[70vw] w-[110vw] max-w-none -translate-x-1/2" />;
}

function Lightning() {
  return <div className="hero-lightning absolute inset-0" />;
}

function Fog() {
  return (
    <>
      <div className="hero-fog absolute inset-x-[-10%] top-[18%] h-40" />
      <div className="hero-fog hero-fog-b absolute inset-x-[-16%] top-[36%] h-48" />
      <div className="hero-fog absolute inset-x-[-8%] bottom-[12%] h-36" />
    </>
  );
}

function Stars() {
  return <div className="hero-stars absolute inset-0" />;
}

function Leaves() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className={`hero-leaf hero-leaf-${(i % 4) + 1}`} style={{ left: `${6 + i * 6.5}%`, animationDelay: `${i * 0.45}s` }} />
      ))}
    </div>
  );
}

function Clouds({ weather }: { weather: HeroWeatherId }) {
  const heavy = weather === "cloudy" || weather === "rainy" || weather === "storm" || weather === "snowy";
  const tint =
    weather === "storm"
      ? "bg-slate-400/45"
      : weather === "cloudy" || weather === "rainy"
        ? "bg-slate-200/55"
        : weather === "autumn"
          ? "bg-orange-100/45"
          : weather === "sunset"
            ? "bg-pink-100/40"
            : weather === "night"
              ? "bg-indigo-200/20"
              : weather === "sunny"
                ? "bg-white/25"
                : "bg-white/35";

  return (
    <>
      <div className="hero-cloud-layer absolute inset-0">
        <div className={`absolute left-[-12%] top-[12%] h-52 w-[50%] rounded-full blur-3xl ${tint}`} />
        <div className={`absolute right-[-14%] top-[4%] h-56 w-[48%] rounded-full blur-3xl ${heavy ? tint : "bg-white/30"}`} />
        <div className={`absolute left-[8%] top-[22%] h-16 w-40 rounded-full blur-xl ${heavy ? tint : "bg-white/40"}`} />
      </div>
      <div className="hero-cloud-layer-b absolute inset-0">
        <div className={`absolute bottom-[30%] left-[6%] h-40 w-[42%] rounded-full blur-[64px] ${heavy ? tint : "bg-white/50"}`} />
        <div className={`absolute bottom-[24%] right-[4%] h-44 w-[40%] rounded-full blur-[70px] ${heavy ? tint : "bg-white/55"}`} />
        {heavy ? <div className={`absolute left-[22%] top-[8%] h-36 w-[58%] rounded-full blur-3xl ${tint}`} /> : null}
        <div className="absolute left-[28%] top-[42%] h-28 w-72 rounded-full bg-white/25 blur-2xl" />
        <div className="absolute right-[12%] top-[26%] h-14 w-48 rounded-full bg-white/35 blur-xl" />
      </div>
    </>
  );
}
