export function frontendOrigins() {
  const configured = (process.env.PRELUDE_FRONTEND_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  const development = process.env.NODE_ENV !== "production"
    ? ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].flatMap(host => [5500, 8080, 8081].map(port => `http://${host}:${port}`))
    : [];
  return [...new Set([...configured, ...development])];
}
