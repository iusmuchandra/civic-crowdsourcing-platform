"use client";

import { useEffect, useRef, useCallback } from "react";

const COLS = 60;
const ROWS = 30;

function drawBoat(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  angle: number
) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
  grad.addColorStop(0, "rgba(78,201,192,0.25)");
  grad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.ellipse(0, 20, 20, 60, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.quadraticCurveTo(14, -10, 12, 18);
  ctx.lineTo(-12, 18);
  ctx.quadraticCurveTo(-14, -10, 0, -28);
  ctx.fillStyle = "#e8e0d4";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-7, -10);
  ctx.lineTo(7, -10);
  ctx.lineTo(5, 0);
  ctx.lineTo(-5, 0);
  ctx.fillStyle = "rgba(78,201,192,0.5)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.lineTo(12, 8);
  ctx.strokeStyle = "#4EC9C0";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function getWaveHeight(
  x: number,
  y: number,
  t: number,
  mouseX: number,
  mouseY: number,
  canvasW: number,
  canvasH: number
): number {
  const mx = (mouseX / canvasW) * COLS;
  const my = (mouseY / canvasH) * ROWS;
  const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
  const mousWave =
    Math.sin(dist * 0.8 - t * 3) * Math.exp(-dist * 0.12) * 18;
  const baseWave =
    Math.sin(x * 0.3 + t) * 4 +
    Math.sin(y * 0.4 - t * 0.7) * 3 +
    Math.sin((x + y) * 0.2 + t * 1.3) * 2;
  return baseWave + mousWave;
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const time = useRef(0);
  const boatPathT = useRef(0);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resize();
    window.addEventListener("resize", resize);

    mouseX.current = canvas.width / 2;
    mouseY.current = canvas.height / 2;
    targetX.current = canvas.width / 2;
    targetY.current = canvas.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetX.current = e.clientX;
      targetY.current = e.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove);

    let rafId = 0;
    const draw = () => {
      time.current += 0.016;
      boatPathT.current += 0.004;
      mouseX.current += (targetX.current - mouseX.current) * 0.05;
      mouseY.current += (targetY.current - mouseY.current) * 0.05;

      const W = canvas.width;
      const H = canvas.height;
      const horiz = H * 0.42;

      ctx.clearRect(0, 0, W, H);

      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      sky.addColorStop(0, "#040E0D");
      sky.addColorStop(1, "#0D3B38");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      if (time.current < 5) {
        ctx.fillStyle = "rgba(245,242,238,0.6)";
        for (let i = 0; i < 80; i++) {
          const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * W;
          const sy = (Math.cos(i * 97.3) * 0.5 + 0.5) * H * 0.4;
          const r = Math.sin(time.current * 2 + i) * 0.5 + 1;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const hg = ctx.createLinearGradient(0, horiz - 40, 0, horiz + 60);
      hg.addColorStop(0, "transparent");
      hg.addColorStop(0.5, "rgba(78,201,192,0.07)");
      hg.addColorStop(1, "transparent");
      ctx.fillStyle = hg;
      ctx.fillRect(0, horiz - 40, W, 100);

      const cellW = W / COLS;
      const cellH = (H - horiz) / ROWS;

      for (let ry = 0; ry < ROWS; ry++) {
        for (let rx = 0; rx < COLS; rx++) {
          const h = getWaveHeight(
            rx,
            ry,
            time.current,
            mouseX.current,
            mouseY.current,
            W,
            H
          );
          const worldX = rx * cellW;
          const worldY = horiz + ry * cellH + h;
          const t2 = (h + 20) / 40;
          const r = Math.round(13 + t2 * 10);
          const g = Math.round(59 + t2 * 80);
          const b = Math.round(56 + t2 * 100);
          const alpha = 0.3 + (ry / ROWS) * 0.5;
          ctx.beginPath();
          ctx.rect(worldX, worldY, cellW + 1, cellH + 1);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
        }
      }

      for (let i = 0; i < 12; i++) {
        const lineY = horiz + (i / 12) * (H - horiz) * 0.8;
        const w2 = 40 + Math.sin(time.current * 2 + i * 0.7) * 30;
        const lineX =
          W * 0.5 + Math.sin(time.current * 0.5 + i * 0.4) * W * 0.3;
        ctx.beginPath();
        ctx.moveTo(lineX - w2, lineY);
        ctx.lineTo(lineX + w2, lineY);
        ctx.strokeStyle = `rgba(78,201,192,${0.1 + Math.sin(time.current * 3 + i) * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const bx =
        W * 0.3 + Math.sin(boatPathT.current) * W * 0.25;
      const by =
        horiz +
        (H - horiz) * 0.18 +
        Math.cos(boatPathT.current * 2) * 8;
      const angle = Math.cos(boatPathT.current) * 0.15;
      drawBoat(ctx, bx, by, angle);

      const skierX =
        bx +
        Math.sin(boatPathT.current + 0.1) * 60 +
        Math.sin(time.current * 4) * 12;
      const skierY = by + 60;
      ctx.beginPath();
      ctx.moveTo(bx, by + 18);
      ctx.lineTo(skierX, skierY);
      ctx.strokeStyle = "rgba(245,242,238,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(skierX, skierY);
      ctx.rotate(Math.sin(time.current * 4) * 0.3);
      ctx.beginPath();
      ctx.arc(0, -8, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#e8e0d4";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(-14, 8);
      ctx.moveTo(6, -3);
      ctx.lineTo(14, 8);
      ctx.strokeStyle = "#e8e0d4";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [resize]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        content.style.transform = `translateY(${y * 0.35}px)`;
        content.style.opacity = String(1 - y / (window.innerHeight * 0.7));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        id="hero-canvas"
        className="absolute inset-0 h-full w-full"
        style={{ display: "block" }}
      />

      <div
        className="absolute right-12 top-[100px] flex items-center gap-2 rounded border border-teal-glow/30 bg-ink/80 px-4 py-2 backdrop-blur-[10px] opacity-0 animate-fadeIn"
        style={{ animationDelay: "2.2s", animationFillMode: "forwards" }}
      >
        <div className="h-[7px] w-[7px] animate-livePulse rounded-full bg-[#FF4444]" />
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--cloud)]">
          Glass Cam · Live
        </span>
      </div>

      <div
        ref={contentRef}
        className="hero-content relative z-10 pointer-events-none text-center"
      >
        <div
          className="mb-5 text-[0.7rem] uppercase tracking-[0.35em] text-[var(--teal-glow)] opacity-0 animate-fadeUp"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          Est. 1987 · Private Club · Lake Geneva
        </div>
        <h1
          className="font-display text-[var(--cloud)] opacity-0 animate-fadeUp leading-[0.88] tracking-[0.02em]"
          style={{
            fontSize: "clamp(5rem, 13vw, 14rem)",
            animationDelay: "0.7s",
            animationFillMode: "forwards",
            animationDuration: "1.2s",
          }}
        >
          <span>RIC &</span>
          <span className="block text-[var(--teal-glow)]">JERRY&apos;S</span>
          <span
            className="block text-transparent"
            style={{ WebkitTextStroke: "1px rgba(245,242,238,0.5)" }}
          >
            WATER
          </span>
        </h1>
        <p
          className="font-serif mt-6 text-[1.3rem] font-light italic tracking-[0.08em] text-cloud/75 opacity-0 animate-fadeUp"
          style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}
        >
          Precision on the Water. Luxury on the Dock.
        </p>
      </div>

      <div
        className="absolute bottom-16 right-12 flex flex-col gap-4 text-right opacity-0 animate-fadeIn"
        style={{ animationDelay: "1.8s", animationFillMode: "forwards" }}
      >
        <div>
          <div className="font-display text-3xl leading-none text-[var(--teal-glow)]">
            72°
          </div>
          <div className="text-[0.6rem] uppercase tracking-[0.2em] text-cloud/40">
            Water Temp
          </div>
        </div>
        <div>
          <div className="font-display text-3xl leading-none text-[var(--teal-glow)]">
            0.2
          </div>
          <div className="text-[0.6rem] uppercase tracking-[0.2em] text-cloud/40">
            Wind mph
          </div>
        </div>
        <div>
          <div className="font-display text-3xl leading-none text-[var(--teal-glow)]">
            9.8
          </div>
          <div className="text-[0.6rem] uppercase tracking-[0.2em] text-cloud/40">
            Flatness
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-0 animate-fadeIn"
        style={{ animationDelay: "2s", animationFillMode: "forwards" }}
      >
        <span className="text-[0.65rem] uppercase tracking-[0.25em] text-cloud/40">
          Discover
        </span>
        <div
          className="h-[60px] w-px bg-gradient-to-b from-teal-glow/80 to-transparent animate-scrollPulse"
          style={{ background: "linear-gradient(to bottom, rgba(78,201,192,0.8), transparent)" }}
        />
      </div>
    </section>
  );
}
