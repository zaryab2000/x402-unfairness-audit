/**
 * Service name quality scoring, vendored for reproduction.
 *
 * Verbatim copy of `src/lib/analytics/service-name-quality.ts` at commit
 * eca0195. Dependency-free in production already; copied unchanged.
 *
 * The July formula added a flat +0.5 for any non-empty service name. This one
 * grades the name, so a generic "API" scores 0.1 where "Weather Forecast API"
 * scores 1.0.
 */


const GENERIC_NAMES = new Set([
  "api", "service", "endpoint", "tool", "test", "default", "app",
  "data", "blog", "site", "server", "main", "index", "demo",
]);

export function computeServiceNameQuality(serviceName: string | null): number {
  if (!serviceName) return 0;
  const name = serviceName.trim();
  if (name.length === 0) return 0;

  const lower = name.toLowerCase();

  // Exact match against generic-name list — always low-score
  if (GENERIC_NAMES.has(lower)) return 0.1;

  // Compound names made entirely of generic words (e.g., "api-service", "test tool")
  const parts = lower.split(/[-_\s]+/).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => GENERIC_NAMES.has(p))) return 0.2;

  // Too short to be meaningful
  if (name.length < 3) return 0.1;

  // Multi-word names with capitalization (e.g., "Weather Forecast API") are specific
  if (name.length >= 10 && /[A-Z]/.test(name) && /\s/.test(name)) {
    return 1.0;
  }

  // Hyphenated or multi-word names without capitalization (e.g., "basescout-feed")
  if (name.length >= 5 && (/[-_]/.test(name) || /\s/.test(name))) {
    return 0.8;
  }

  // Single-word names with capitalization (e.g., "StableEnrich") — decent
  if (name.length >= 5 && /[A-Z]/.test(name)) {
    return 0.7;
  }

  // Single lowercase word 5+ chars (e.g., "scoop", "feeler") — borderline
  if (name.length >= 5) {
    return 0.5;
  }

  // 3-4 char names — usually abbreviated, marginal
  return 0.3;
}
