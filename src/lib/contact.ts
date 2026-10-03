/**
 * Sales contact.
 *
 * Activation codes are fulfilled manually over WhatsApp, which is the normal
 * pattern for this market and beats card checkout while Stripe is unwired.
 *
 * Kept in one place so the number is not hardcoded in several components.
 */

const WHATSAPP_NUMBER = "2348154896286";

/** E.164 without the plus. wa.me requires the bare number. */
export const CONTACT = {
  whatsapp: WHATSAPP_NUMBER,
  display: "+234 815 489 6286",
  href: `https://wa.me/${WHATSAPP_NUMBER}`,
} as const;

/**
 * Prefills the message with who is asking. Without the email you end up
 * matching a code to an account by guesswork, which is exactly the kind of
 * manual step that goes wrong.
 */
export function whatsappLink(email?: string | null, plan = "Creator Pro"): string {
  const lines = [
    "Hi, I would like to activate the Creator Pro plan on Viralard.",
    email ? `Account email: ${email}` : null,
    `Plan: ${plan}`,
    `Price: ${CONTACT.display}`,
  ].filter(Boolean);

  return `${CONTACT.href}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export async function copyNumber(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(CONTACT.display);
    return true;
  } catch {
    return false;
  }
}