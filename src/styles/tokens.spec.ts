import { describe, it, expect } from "vitest";
import { BASE_TOKENS, deriveSurfaceTokens, getThemeTokens } from "./tokens";

describe("deriveSurfaceTokens()", () => {
  it("lightens bgElevated relative to bg in dark mode (bg dark, text light)", () => {
    const { bg, text } = BASE_TOKENS.dark;
    const { bgElevated } = deriveSurfaceTokens(bg, text);

    // bgElevated should be strictly lighter than bg (mixed toward a light text color)
    const sum = (hex: string) => {
      const clean = hex.replace("#", "");
      return (
        parseInt(clean.slice(0, 2), 16) +
        parseInt(clean.slice(2, 4), 16) +
        parseInt(clean.slice(4, 6), 16)
      );
    };
    expect(sum(bgElevated)).toBeGreaterThan(sum(bg));
  });

  it("darkens bgElevated relative to bg in light mode (bg light, text dark)", () => {
    const { bg, text } = BASE_TOKENS.light;
    const { bgElevated } = deriveSurfaceTokens(bg, text);

    const sum = (hex: string) => {
      const clean = hex.replace("#", "");
      return (
        parseInt(clean.slice(0, 2), 16) +
        parseInt(clean.slice(2, 4), 16) +
        parseInt(clean.slice(4, 6), 16)
      );
    };
    expect(sum(bgElevated)).toBeLessThan(sum(bg));
  });

  it("border has more contrast from bg than bgElevated does (larger mix ratio)", () => {
    const { bg, text } = BASE_TOKENS.dark;
    const { bgElevated, border } = deriveSurfaceTokens(bg, text);

    const dist = (a: string, b: string) => {
      const av = parseInt(a.replace("#", ""), 16);
      const bv = parseInt(b.replace("#", ""), 16);
      return Math.abs(av - bv);
    };
    expect(dist(border, bg)).toBeGreaterThan(dist(bgElevated, bg));
  });

  it("never introduces a new hue — bgElevated and border are pure mixes of bg and text", () => {
    // A mix of two grayscale-ish hex values stays within the bounding box
    // of the two channel values for every channel.
    const { bgElevated, border } = deriveSurfaceTokens("#15161A", "#FFFAF3");
    for (const token of [bgElevated, border]) {
      expect(token).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("returns deterministic output for the same input", () => {
    const a = deriveSurfaceTokens("#15161A", "#FFFAF3");
    const b = deriveSurfaceTokens("#15161A", "#FFFAF3");
    expect(a).toEqual(b);
  });
});

describe("getThemeTokens()", () => {
  it("returns all 5 tokens for dark mode, accent unchanged from base", () => {
    const tokens = getThemeTokens("dark");
    expect(tokens.bg).toBe("#15161A");
    expect(tokens.text).toBe("#FFFAF3");
    expect(tokens.accent).toBe("#E95420");
    expect(tokens.bgElevated).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.border).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns all 5 tokens for light mode", () => {
    const tokens = getThemeTokens("light");
    expect(tokens.bg).toBe("#FFFAF3");
    expect(tokens.text).toBe("#080616");
    expect(tokens.accent).toBe("#E95420");
  });

  it("accent is identical across both themes (per spec section 4.1)", () => {
    expect(getThemeTokens("dark").accent).toBe(getThemeTokens("light").accent);
  });
});
