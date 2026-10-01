export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(hexToRgb(foreground));
  const l2 = relativeLuminance(hexToRgb(background));

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export type VideoTheme = {
  id: string;
  label: string;
  /** Representative background colour for contrast maths. */
  surface: string;
  kind: "bright" | "mid" | "dark";
};

/**
 * Representative brightness of short-form video frames. Calibrated against the
 * three failure cases that actually happen: a blown-out white studio, a flat
 * mid-tone talking head, and a night/dark edit. A caption has to survive all
 * three, not just the flattering one.
 */
export const VIDEO_THEMES: VideoTheme[] = [
  { id: "studio-white", label: "Studio white wall", surface: "#f2f1ee", kind: "bright" },
  { id: "window-daylight", label: "Daylight by a window", surface: "#e8eef2", kind: "bright" },
  { id: "product-flatlay", label: "Product flatlay", surface: "#ded9d0", kind: "bright" },
  { id: "skin-mid", label: "Mid-tone talking head", surface: "#b08d76", kind: "mid" },
  { id: "outdoor-haze", label: "Outdoor haze", surface: "#9fa8a4", kind: "mid" },
  { id: "beach-sand", label: "Beach / sand", surface: "#cbb79c", kind: "mid" },
  { id: "night-street", label: "Night street", surface: "#181c22", kind: "dark" },
  { id: "studio-dark", label: "Dark studio", surface: "#101014", kind: "dark" },
  { id: "colour-wall", label: "Saturated colour wall", surface: "#2a1c3d", kind: "dark" },
];

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export type ContrastReport = {
  theme: VideoTheme;
  ratio: number;
  passes: boolean;
};

/**
 * Contrast is checked against the composite the viewer actually sees: caption
 * text sits over the video, and real captions carry a shadow or scrim. Scoring
 * the bare hex against the frame is the wrong comparison.
 */
export function contrastWithShadow(
  textColor: string,
  background: string,
  shadowStrength = 0.55,
): number {
  const text = hexToRgb(textColor);
  const bg = hexToRgb(background);
  const shadow = { r: 0, g: 0, b: 0 };

  const blended: Rgb = {
    r: text.r * (1 - shadowStrength) + shadow.r * shadowStrength,
    g: text.g * (1 - shadowStrength) + shadow.g * shadowStrength,
    b: text.b * (1 - shadowStrength) + shadow.b * shadowStrength,
  };

  return contrastRatio(
    `rgb(${Math.round(blended.r)},${Math.round(blended.g)},${Math.round(blended.b)})`,
    `rgb(${bg.r},${bg.g},${bg.b})`,
  );
}

export function reportContrast(textColor: string): ContrastReport[] {
  return VIDEO_THEMES.map((theme) => {
    const ratio = contrastWithShadow(textColor, theme.surface);
    return { theme, ratio: Math.round(ratio * 100) / 100, passes: ratio >= WCAG_AA_LARGE };
  });
}

export function summariseContrast(textColor: string): {
  passRate: number;
  weakest: ContrastReport;
  needsShadow: boolean;
} {
  const reports = reportContrast(textColor);
  const passes = reports.filter((report) => report.passes).length;
  const weakest = reports.reduce((a, b) => (a.ratio <= b.ratio ? a : b));

  return {
    passRate: Math.round((passes / reports.length) * 100),
    weakest,
    needsShadow: passes / reports.length < 1,
  };
}