"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AnimatedHero({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(node.children);

    const context = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.11,
          ease: "power3.out",
        },
      );
    }, node);

    return () => context.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function AnimatedSection({
  children,
  className = "",
  id,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        node,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 88%", once: true },
        },
      );
    }, node);

    return () => context.revert();
  }, [delay, y]);

  return (
    <div ref={ref} id={id} className={className}>
      {children}
    </div>
  );
}

export function AnimatedStagger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = node.children;
    if (items.length === 0) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: { trigger: node, start: "top 85%", once: true },
        },
      );
    }, node);

    return () => context.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Counts a number up when it scrolls into view. Used for the score so the
 * number feels earned rather than printed.
 */
export function CountUp({
  value,
  className = "",
  duration = 0.9,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || played.current) return;
    played.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.textContent = String(value);
      return;
    }

    const counter = { n: 0 };
    node.textContent = "0";

    const tween = gsap.to(counter, {
      n: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        node.textContent = String(Math.round(counter.n));
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return <span ref={ref} className={className} />;
}

/** Gentle parallax on the aurora orbs as the user scrolls. */
export function useAuroraParallax(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const orbs = Array.from(document.querySelectorAll<HTMLElement>(".aurora span"));
    if (orbs.length === 0) return;

    const context = gsap.context(() => {
      orbs.forEach((orb, index) => {
        gsap.to(orb, {
          yPercent: (index + 1) * 18 - 18,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      });
    });

    return () => context.revert();
  }, [pathname]);
}