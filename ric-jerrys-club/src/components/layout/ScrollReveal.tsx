"use client";

import { useEffect, useRef } from "react";

export function ScrollReveal() {
  const observedRef = useRef<Element[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    const nodes = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right"
    );
    observedRef.current = Array.from(nodes);
    observedRef.current.forEach((el) => observer.observe(el));
    return () => {
      observedRef.current.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return null;
}
