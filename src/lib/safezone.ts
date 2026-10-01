export type Platform = "tiktok" | "reels" | "shorts";

export type SafeZoneRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type SafeZoneMask = {
  label: string;
  aspectRatio: string;
  /** Blocked regions as percentages of the frame. */
  blocked: {
    top?: SafeZoneRect;
    right?: SafeZoneRect;
    bottom?: SafeZoneRect;
    left?: SafeZoneRect;
  };
};

export const ASPECT_RATIO = "9 / 16";

export const SAFE_ZONES: Record<Platform, SafeZoneMask> = {
  tiktok: {
    label: "TikTok",
    aspectRatio: ASPECT_RATIO,
    blocked: {
      right: { top: 6, right: 0, bottom: 22, left: 80 },
      bottom: { top: 74, right: 0, bottom: 0, left: 0 },
      top: { top: 0, right: 0, bottom: 6, left: 0 },
    },
  },
  reels: {
    label: "Reels",
    aspectRatio: ASPECT_RATIO,
    blocked: {
      right: { top: 10, right: 0, bottom: 30, left: 82 },
      bottom: { top: 78, right: 0, bottom: 0, left: 0 },
      top: { top: 0, right: 0, bottom: 8, left: 0 },
    },
  },
  shorts: {
    label: "Shorts",
    aspectRatio: ASPECT_RATIO,
    blocked: {
      right: { top: 8, right: 0, bottom: 26, left: 84 },
      bottom: { top: 76, right: 0, bottom: 0, left: 0 },
      top: { top: 0, right: 0, bottom: 7, left: 0 },
    },
  },
};

export const PLATFORM_VALUES = Object.keys(SAFE_ZONES) as Platform[];

export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (PLATFORM_VALUES as string[]).includes(value);
}