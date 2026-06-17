export type ThemeName = "dark" | "light";

export interface ThemeTokens {
  bg: string;
  text: string;
  accent: string;
  bgElevated: string;
  border: string;
}

/** Base tokens from spec section 4.1 — do not derive these, they're fixed design decisions. */
export const BASE_TOKENS: Record<
  ThemeName,
  { bg: string; text: string; accent: string }
> = {
  dark: { bg: "#15161A", text: "#FFFAF3", accent: "#E95420" },
  light: { bg: "#FFFAF3", text: "#080616", accent: "#E95420" },
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Mixes `bg` toward `text` by `ratio` (0..1) — used to derive surface/border tokens. */
function mix(bg: string, text: string, ratio: number): string {
  const [br, bgC, bb] = hexToRgb(bg);
  const [tr, tg, tb] = hexToRgb(text);
  return rgbToHex(
    br + (tr - br) * ratio,
    bgC + (tg - bgC) * ratio,
    bb + (tb - bb) * ratio,
  );
}

/**
 * Derives `bgElevated` and `border` from the two base tokens by mixing
 * `bg` toward `text` by a small ratio — never introduces a new hue. This
 * naturally lightens surfaces in dark mode (bg dark, text light) and
 * darkens them in light mode (bg light, text dark), giving the sidebar
 * and cards visual separation from the page background in both themes.
 */
export function deriveSurfaceTokens(
  bg: string,
  text: string,
): { bgElevated: string; border: string } {
  return {
    bgElevated: mix(bg, text, 0.06),
    border: mix(bg, text, 0.16),
  };
}

export function getThemeTokens(theme: ThemeName): ThemeTokens {
  const base = BASE_TOKENS[theme];
  const surface = deriveSurfaceTokens(base.bg, base.text);
  return { ...base, ...surface };
}
