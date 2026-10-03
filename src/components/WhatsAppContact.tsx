"use client";

import { CONTACT, copyNumber, whatsappLink } from "@/lib/contact";

export function WhatsAppContact({
  email,
  label = "Get an activation code",
  size = "md",
}: {
  email?: string | null;
  label?: string;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";

  return (
    <div className="space-y-2">
      <a
        href={whatsappLink(email)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary flex w-full items-center justify-center gap-2.5 px-5 py-2.5 text-sm"
      >
        <svg width={compact ? 16 : 18} height={compact ? 16 : 18} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.13-1.93 11.77 11.77 0 0 1-1.08-1.38c-.11-.19 0-.29.08-.38l.45-.52c.13-.15.17-.25.25-.41.09-.17.05-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31s-.85.83-.85 2.02.87 2.35.99 2.51c.12.16 1.7 2.6 4.14 3.65.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z"
            fill="currentColor"
          />
        </svg>
        {label}
      </a>

      <button
        type="button"
        onClick={async () => {
          const copied = await copyNumber();
          if (copied) {
            const button = document.getElementById("hookcraft-contact");
            if (button) button.textContent = "Number copied";
          }
        }}
        className="w-full text-center text-[11px] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <span id="hookcraft-contact">or message {CONTACT.display} directly</span>
      </button>
    </div>
  );
}