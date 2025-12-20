const HSL_VAR_RE = /^hsl\(var\((--[^)]+)\)\)$/;

export function withHslAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));

  // Expecting: hsl(var(--token))
  const match = color.match(HSL_VAR_RE);
  if (match) {
    return `hsl(var(${match[1]}) / ${clamped})`;
  }

  return color;
}
