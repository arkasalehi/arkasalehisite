/** Jalali calendar helpers (civil calendar). */

export type JalaliDate = { jy: number; jm: number; jd: number };

function div(a: number, b: number) {
  return ~~(a / b);
}

export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
  const gyMinus = gm > 2 ? gy2 + 1 : gy2;
  let days = 365 * gy2 + div(gyMinus + 3, 4) - div(gyMinus + 99, 100) + div(gyMinus + 399, 400) - 80 + gd + g_d_m[gm - 1]!;
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function toGregorian(jy: number, jm: number, jd: number) {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  const days =
    365 * jy +
    div(jy, 33) * 8 +
    div((jy % 33) + 3, 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * div(days, 146097);
  let rem = days % 146097;
  if (rem >= 36525) {
    rem--;
    gy += 100 * div(rem, 36524);
    rem %= 36524;
    if (rem >= 365) rem++;
  }
  gy += 4 * div(rem, 1461);
  rem %= 1461;
  if (rem >= 366) {
    rem--;
    gy += div(rem, 365);
    rem %= 365;
  }
  const gd = rem + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let walk = 0;
  for (let i = 0; i < sal_a.length; i += 1) {
    const v = sal_a[i]!;
    if (walk + v >= gd) {
      gm = i;
      break;
    }
    walk += v;
  }
  return { gy, gm, gd: gd - walk };
}

export function jalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const leap = (((((jy - 474) % 2820) + 474 + 38) * 682) % 2816) < 682;
  return leap ? 30 : 29;
}

const FA_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const EN_MONTHS = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];

export function jalaliMonthName(jm: number, locale: "fa" | "en") {
  return (locale === "fa" ? FA_MONTHS : EN_MONTHS)[jm - 1] ?? "";
}

export function dateToJalali(date: Date) {
  return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function jalaliToDate(jy: number, jm: number, jd: number, hour = 12, minute = 0) {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd, hour, minute, 0);
}
