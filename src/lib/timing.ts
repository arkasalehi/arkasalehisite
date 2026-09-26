export function routeTimer(route: string) {
  const started = Date.now();
  return () => {
    console.log(`[route] ${route} ${Date.now() - started}ms`);
  };
}
