"use client";

import { useEffect, useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export function TheLake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useScrollReveal<HTMLDivElement>();
  const rightRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ripples: Ripple[] = [];
    let t = 0;
    let W = 0;
    let H = 0;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        r: 0,
        alpha: 0.8,
      });
      if (ripples.length > 20) ripples.shift();
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    let rafId = 0;
    const draw = () => {
      t += 0.02;
      ctx.fillStyle = "#0A2523";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 20; i++) {
        const y = (i / 20) * H + Math.sin(t + i * 0.4) * 6;
        const lw = 0.5 + Math.sin(t * 2 + i) * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          W * 0.3,
          y + Math.sin(t + i) * 8,
          W * 0.7,
          y - Math.sin(t + i) * 8,
          W,
          y
        );
        ctx.strokeStyle = `rgba(46,139,132,${0.15 + lw * 0.1})`;
        ctx.lineWidth = lw;
        ctx.stroke();
      }

      ripples.forEach((rip) => {
        rip.r += 2;
        rip.alpha *= 0.96;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(78,201,192,${rip.alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      if (Math.random() < 0.03) {
        ripples.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0,
          alpha: 0.4,
        });
        if (ripples.length > 20) ripples.shift();
      }

      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section
      id="the-lake"
      className="flex min-h-screen items-center overflow-hidden px-12 py-[120px] max-md:px-6 max-md:py-20"
      style={{
        background:
          "linear-gradient(180deg, var(--ink) 0%, #0A2523 50%, var(--teal-deep) 100%)",
      }}
    >
      <div className="lake-grid mx-auto grid w-full max-w-[1300px] grid-cols-1 items-center gap-20 md:grid-cols-2 md:gap-20">
        <div ref={leftRef} className="reveal-left lake-text">
          <div className="section-label mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--teal-glow)]">
            § 01 — The Lake
          </div>
          <h2 className="font-serif mb-8 font-light leading-[1.05] text-[var(--cloud)] max-md:text-3xl md:text-[clamp(3rem,6vw,5.5rem)]">
            Where <em className="italic text-[var(--teal-glow)]">silence</em>
            <br />
            becomes
            <br />
            performance.
          </h2>
          <p className="lake-text mb-6 max-w-[480px] text-[1.05rem] font-light leading-[1.85] text-cloud/65">
            Lake Geneva at dawn is not a backdrop — it&apos;s a collaborator.
            Glass-flat water, a mirror of alpenglow, and the quiet hum of a
            550HP Zero-Off system waiting.
          </p>
          <p className="lake-text max-w-[480px] text-[1.05rem] font-light leading-[1.85] text-cloud/65">
            We&apos;ve been waking up for 5 AM pulls since &apos;87. The
            difference is, now we do it in a 2026 Nautique G23 with Bose
            underwater speakers.
          </p>
        </div>
        <div ref={rightRef} className="reveal-right lake-visual relative aspect-[4/3]">
          <canvas
            ref={canvasRef}
            className="water-ripple-canvas h-full w-full border border-teal-glow/15"
          />
          <div
            className="lake-overlay-text absolute -bottom-5 -left-5 font-display text-7xl leading-none text-transparent pointer-events-none select-none"
            style={{ WebkitTextStroke: "1px rgba(78,201,192,0.12)" }}
          >
            GLASS
          </div>
        </div>
      </div>
    </section>
  );
}
