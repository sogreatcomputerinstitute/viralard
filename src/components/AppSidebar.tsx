"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LANGUAGES, PERSONAS, findPersona, type Persona } from "@/lib/engine/personas";

const NAV = [
  {
    id: "analyze",
    label: "Analyze",
    icon: (
      <path d="M3 12.5 8 7l3.5 3.5L17 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    id: "persona",
    label: "Persona",
    icon: (
      <>
        <circle cx="9" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M3.5 17c.6-2.9 2.8-4.4 5.5-4.4s4.9 1.5 5.5 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    id: "thumbnail",
    label: "Thumbnail",
    icon: (
      <>
        <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M2.5 12.5 6.5 9l3 2.6L13 8l4.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  {
    id: "translate",
    label: "Translate",
    icon: (
      <>
        <path d="M2.5 5h8M6.5 5v-.8M4.8 5c.4 3.2 2.3 5.4 5 6.3M7.5 7.2c-.5 2.4-2.1 4.2-4.3 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M11 17l3.2-7.5L17.5 17M12.4 14.6h3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  {
    id: "scout",
    label: "Scout",
    icon: (
      <>
        <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M12.4 12.4 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <>
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M9 5v4.2l2.8 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
];

function rulesFor(personaId: string): string {
  return findPersona(personaId)?.rules.summary ?? "No audience lock. Writes for a general short-form viewer.";
}

export function AppSidebar({
  signedIn,
  plan,
  onOpenPersona,
  onOpenThumbnailHelp,
  onOpenTranslateHelp,
  onOpenScout,
  onOpenHistory,
  currentLanguage,
  currentPersona,
  onPickPersona,
  onPickLanguage,
}: {
  signedIn: boolean;
  plan: "free" | "pro";
  onOpenPersona: () => void;
  onOpenThumbnailHelp: () => void;
  onOpenTranslateHelp: () => void;
  onOpenScout: () => void;
  onOpenHistory: () => void;
  currentLanguage: string;
  currentPersona: string;
  onPickPersona: (id: string) => void;
  onPickLanguage: (id: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const pro = plan === "pro";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="glass-chrome fixed left-4 top-4 z-40 grid size-10 place-items-center rounded-xl lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      ) : null}

      <aside
        className={`glass-chrome fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-y-0 border-l-0 p-5 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" onClick={() => setOpen(false)} className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={30} height={30} className="size-7" />
            <span className="text-sm font-semibold tracking-tight text-ink">Viralard</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid size-8 place-items-center rounded-lg border border-white/10 text-ink-muted lg:hidden"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 1 11 11M11 1 1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="mt-7 space-y-1">
          {NAV.map((item) => (
            <SidebarLink
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={pathname === `/app/${item.id}`}
onClick={() => {
              if (item.id === "persona") onOpenPersona();
              if (item.id === "translate") onOpenTranslateHelp();
              if (item.id === "scout") onOpenScout();
              if (item.id === "history") onOpenHistory();
              if (item.id === "thumbnail") onOpenThumbnailHelp();
              setOpen(false);
            }}
            />
          ))}
        </nav>

        <div className="mt-7 border-t border-white/8 pt-6">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Audience persona</p>
          <div className="mt-3 space-y-1">
            {PERSONAS.map((persona: Persona) => {
              const locked = persona.tier === "pro" && !pro;
              return (
                <button
                  key={persona.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onPickPersona(persona.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    currentPersona === persona.id
                      ? "bg-accent/20 text-ink"
                      : locked
                        ? "cursor-not-allowed text-ink-muted/40"
                        : "text-ink-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{persona.label}</span>
                  {locked ? <span className="text-[9px] uppercase text-accent-2">Pro</span> : null}
                </button>
              );
            })}
          </div>

          {currentPersona !== "none" ? (
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted/70">
              {rulesFor(currentPersona)}
            </p>
          ) : null}
        </div>

        <div className="mt-6 border-t border-white/8 pt-6">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Output language</p>
          <select
            value={currentLanguage}
            onChange={(event) => onPickLanguage(event.target.value)}
            className="focus-ring mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-ink outline-none"
          >
            {LANGUAGES.map((language) => (
              <option key={language.id} value={language.id} className="bg-haze text-ink">
                {language.id === "none" ? language.label : `${language.label}${!pro ? " Â· Pro" : ""}`}
              </option>
            ))}
          </select>
          {!pro && currentLanguage !== "none" ? (
            <p className="mt-2 text-[11px] text-accent-2">
              Translation needs Creator Pro.{" "}
              <button type="button" onClick={onOpenTranslateHelp} className="underline underline-offset-4">
                Why?
              </button>
            </p>
          ) : null}
        </div>

        <div className="mt-auto space-y-2 pt-7">
          <SidebarLink
            label="How scoring works"
            icon={<path d="M9 1.8a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4Zm0 4.4v3.4l2.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />}
            onClick={onOpenThumbnailHelp}
          />
          <SidebarLink
            label="Account"
            icon={
              <>
                <circle cx="9" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                <path d="M3.5 17c.6-2.9 2.8-4.4 5.5-4.4s4.9 1.5 5.5 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              </>
            }
            onClick={() => router.push("/account")}
          />
          {!signedIn ? (
            <Link href="/login" className="btn-primary mt-2 block px-4 py-2.5 text-center text-xs">
              Sign in to save history
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpenScout}
              className="btn-ghost w-full px-4 py-2.5 text-xs"
            >
              Reverse-engineer a competitor
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
        active ? "bg-accent/20 text-ink" : "text-ink-muted hover:bg-white/5 hover:text-ink"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        {icon}
      </svg>
      {label}
    </button>
  );
}