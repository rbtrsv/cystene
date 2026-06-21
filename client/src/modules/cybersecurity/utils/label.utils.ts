/**
 * Label formatting utilities.
 *
 * Turns raw snake_case / lowercase token values (free-string enums coming straight from the
 * backend) into human-readable labels for the UI — so users see "No Rate Limit" instead of
 * "no_rate_limit". For FIXED enums prefer an explicit label map (correct acronym casing);
 * use this only for open-ended string fields that can't be enumerated.
 */

/**
 * Convert a snake_case / lowercase token to "Title Case".
 *
 * @param value Raw token (e.g. "no_rate_limit", "remote_agent", "success")
 * @returns Human label (e.g. "No Rate Limit", "Remote Agent", "Success")
 */
export const humanizeToken = (value: string): string =>
  value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
