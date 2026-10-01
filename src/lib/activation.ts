import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Pro activation by code.
 *
 * This exists so paid seats can be granted before Stripe Checkout is wired up -
 * founding users, support fixes, tests, and your own account. Stripe replaces
 * it once billing is live; it is not meant to coexist as the primary path.
 *
 * Codes are compared in constant time and only their SHA-256 is held in
 * memory, so a rejected guess leaks nothing about the real values.
 */

function digest(value: string): Buffer {
  return createHash("sha256").update(value.trim().toLowerCase()).digest();
}

function configuredCodes(): Buffer[] {
  const raw = process.env.PRO_ACTIVATION_CODES ?? "";
  return raw
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => digest(code));
}

export function isActivationConfigured(): boolean {
  return configuredCodes().length > 0;
}

/**
 * Read from the server for client components. Never ship the raw codes - only
 * the boolean, so the UI knows whether to show the code field.
 */
export function activationEnabledFlag(): boolean {
  return isActivationConfigured();
}

export type ActivationResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "invalid" };

export function verifyActivationCode(candidate: string): ActivationResult {
  const codes = configuredCodes();

  if (codes.length === 0) return { ok: false, reason: "not_configured" };

  const supplied = digest(candidate ?? "");

  const matched = codes.some((known) => {
    if (known.length !== supplied.length) return false;
    return timingSafeEqual(known, supplied);
  });

  return matched ? { ok: true } : { ok: false, reason: "invalid" };
}