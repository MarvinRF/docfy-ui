// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { applyTheme } from "./apply-theme";

describe("applyTheme()", () => {
  it("sets data-theme on the root element", () => {
    const root = document.createElement("html");
    applyTheme("dark", root);
    expect(root.dataset.theme).toBe("dark");
  });

  it("sets all 5 CSS custom properties", () => {
    const root = document.createElement("html");
    applyTheme("dark", root);

    expect(root.style.getPropertyValue("--color-bg")).toBe("#4b4b4b");
    expect(root.style.getPropertyValue("--color-text")).toBe("#FFFAF3");
    expect(root.style.getPropertyValue("--color-accent")).toBe("#E95420");
    expect(root.style.getPropertyValue("--color-bg-elevated")).toMatch(
      /^#[0-9a-f]{6}$/i,
    );
    expect(root.style.getPropertyValue("--color-border")).toMatch(
      /^#[0-9a-f]{6}$/i,
    );
  });

  it("switching theme updates data-theme and variable values without recreating the element", () => {
    const root = document.createElement("html");
    applyTheme("dark", root);
    const darkBg = root.style.getPropertyValue("--color-bg");

    applyTheme("light", root);
    expect(root.dataset.theme).toBe("light");
    expect(root.style.getPropertyValue("--color-bg")).toBe("#FFFAF3");
    expect(root.style.getPropertyValue("--color-bg")).not.toBe(darkBg);
  });
});
