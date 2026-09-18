export function HeroNameplate() {
  return (
    <h1 dir="ltr" className="hero-nameplate mx-auto mt-8 flex h-[4.75rem] items-stretch justify-center sm:h-24 md:mt-10 md:h-[7.25rem]">
      <span className="hero-nameplate-en-clip flex items-end overflow-hidden pb-1 md:pb-2">
        <span className="hero-nameplate-en whitespace-nowrap pe-4 text-[28px] font-semibold tracking-tight text-white sm:text-[40px] md:pe-6 md:text-[52px]">
          Arka Salehi
        </span>
      </span>
      <span className="hero-nameplate-rule w-1.5 self-stretch rounded-[1px] bg-white sm:w-2" />
      <span className="hero-nameplate-fa-clip flex items-start overflow-hidden pt-1 md:pt-2">
        <span className="hero-nameplate-fa whitespace-nowrap ps-4 text-[28px] font-extrabold text-white sm:text-[40px] md:ps-6 md:text-[52px]">
          آرکا صالحی
        </span>
      </span>
    </h1>
  );
}
