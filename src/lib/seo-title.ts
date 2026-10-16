/** Page title for the root template, plus the branded string used in social tags. */
export function resolveDocumentTitle(title: string, siteName: string, path: string) {
  const clean = title.trim();
  const branded =
    path === "/" || clean === siteName || clean.includes(`| ${siteName}`) ? clean : `${clean} | ${siteName}`;
  const absolute = branded === clean;
  return {
    title: absolute ? ({ absolute: branded } as const) : clean,
    social: branded,
  };
}
