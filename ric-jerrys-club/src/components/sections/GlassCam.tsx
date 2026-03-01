"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function GlassCam() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useScrollReveal<HTMLDivElement>();
  const rightRef = useScrollReveal<HTMLDivElement>();
  const [camTime, setCamTime] = useState("06:14:22");
  const [flatness, setFlatness] = useState("9.8");
  const [wind, setWind] = useState("0.3 mph");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = canvas.offsetWidth || 600;
    let H = canvas.offsetHeight || 340;
    let t = 0;

    const resize = () => {
      W = canvas.offsetWidth || 600;
      H = canvas.offsetHeight || 340;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    const draw = () => {
      t += 0.01;
      ctx.fillStyle = "#071A18";
      ctx.fillRect(0, 0, W, H);

      const sg = ctx.createLinearGradient(0, 0, 0, H * 0.35);
      sg.addColorStop(0, "#03100F");
      sg.addColorStop(1, "#0D3B38");
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H * 0.35);

      const horiz = H * 0.38;
      ctx.beginPath();
      ctx.moveTo(0, horiz);
      ctx.lineTo(W, horiz);
      ctx.strokeStyle = "rgba(78,201,192,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const y =
          horiz + (i / 8) * (H - horiz) + Math.sin(t * 1.5 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.strokeStyle = `rgba(46,139,132,${0.06 + i * 0.015})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      const buoys = [0.12, 0.25, 0.38, 0.51, 0.64, 0.77];
      buoys.forEach((bx, i) => {
        const by = horiz + (H - horiz) * (0.2 + i * 0.05);
        const pulse = Math.sin(t * 3 + i) * 3;
        ctx.beginPath();
        ctx.arc(bx * W, by + pulse, 6, 0, Math.PI * 2);
        ctx.fillStyle =
          i < 3 ? "rgba(255,80,80,0.8)" : "rgba(255,200,50,0.8)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx * W, by + pulse, 10, 0, Math.PI * 2);
        ctx.strokeStyle =
          i < 3 ? "rgba(255,80,80,0.3)" : "rgba(255,200,50,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(245,242,238,0.5)";
        ctx.font = "9px DM Sans";
        ctx.fillText(String(i + 1), bx * W - 3, by + pulse - 14);
      });

      const bx2 = W * 0.15 + Math.sin(t * 0.3) * W * 0.15;
      const by2 = horiz + (H - horiz) * 0.15;
      ctx.save();
      ctx.translate(bx2, by2);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(6, 0, 5, 8);
      ctx.lineTo(-5, 8);
      ctx.quadraticCurveTo(-6, 0, 0, -8);
      ctx.fillStyle = "#D4D0C8";
      ctx.fill();
      ctx.restore();

      for (let w = 1; w <= 4; w++) {
        ctx.beginPath();
        ctx.moveTo(bx2, by2 + 8);
        ctx.bezierCurveTo(
          bx2 - w * 20,
          by2 + 20,
          bx2 - w * 30,
          by2 + 40,
          bx2 - w * 25 + Math.sin(t) * 5,
          by2 + 60
        );
        ctx.strokeStyle = `rgba(78,201,192,${0.15 - w * 0.03})`;
        ctx.lineWidth = 2 - w * 0.3;
        ctx.stroke();
      }

      const imgData = ctx.getImageData(0, 0, W, H);
      for (let i = 0; i < imgData.data.length; i += 20) {
        const noise = (Math.random() - 0.5) * 8;
        imgData.data[i] = Math.min(
          255,
          Math.max(0, imgData.data[i] + noise)
        );
      }
      ctx.putImageData(imgData, 0, 0);

      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const tick = () =>
      setCamTime(
        new Date().toLocaleTimeString("en-US", { hour12: false })
      );
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFlatness((9.5 + Math.random() * 0.5).toFixed(1));
      setWind((0.1 + Math.random() * 0.4).toFixed(1) + " mph");
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="glass-cam"
      className="relative border-t border-teal-glow/10 bg-[#060F0E] px-12 py-20 max-md:px-6"
    >
      <div className="cam-inner mx-auto grid max-w-[1300px] grid-cols-1 items-center gap-16 md:grid-cols-[1.5fr_1fr]">
        <div
          ref={leftRef}
          className="reveal-left cam-feed relative aspect-video overflow-hidden border border-teal-glow/20 bg-[#0A1F1D]"
        >
          <canvas
            ref={canvasRef}
            id="cam-canvas"
            className="block h-full w-full"
          />
          <div
            className="cam-scanline absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)`,
            }}
          />
          <div className="cam-overlay-hud absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            <div className="cam-hud-row flex justify-between items-start">
              <div className="hud-badge rounded border border-teal-glow/30 bg-[rgba(10,15,14,0.8)] px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-[var(--teal-glow)] backdrop-blur-[6px]">
                ● LIVE · Slalom Course
              </div>
              <div className="hud-stat text-right text-[0.65rem] tracking-[0.1em] text-cloud/70">
                <span className="font-display block text-[1.1rem] text-[var(--teal-glow)]">
                  {camTime}
                </span>
                <span>CDT</span>
              </div>
            </div>
            <div className="cam-hud-row flex justify-between items-start">
              <div className="hud-stat text-[0.65rem] tracking-[0.1em] text-cloud/70">
                <span>Buoy 1–6</span>
                <span
                  className="font-display block text-[1.1rem]"
                  style={{ color: "var(--gold)" }}
                >
                  22OFF
                </span>
              </div>
              <div className="hud-stat text-right text-[0.65rem] tracking-[0.1em] text-cloud/70">
                <span>Zero-Off</span>
                <span className="font-display block text-[1.1rem] text-[var(--teal-glow)]">
                  36 MPH
                </span>
              </div>
            </div>
          </div>
        </div>
        <div ref={rightRef} className="reveal-right cam-metrics flex flex-col gap-5">
          <div className="section-label text-[0.65rem] uppercase tracking-[0.3em] text-[var(--teal-glow)]">
            § 02 — Glass Cam
          </div>
          <h3 className="font-serif text-[2.2rem] font-light leading-[1.2] text-[var(--cloud)] mb-7">
            AI-Powered
            <br />
            <em className="italic">Live Conditions</em>
          </h3>
          <div className="metric-row flex justify-between items-center border-b border-cloud/10 py-4">
            <span className="metric-name text-[0.7rem] uppercase tracking-[0.15em] text-cloud/45">
              Water Flatness
            </span>
            <span
              className="metric-val good font-display text-2xl leading-none text-[var(--teal-glow)]"
              id="flatness-val"
            >
              {flatness}
            </span>
          </div>
          <div className="metric-row flex justify-between items-center border-b border-cloud/10 py-4">
            <span className="metric-name text-[0.7rem] uppercase tracking-[0.15em] text-cloud/45">
              Wind Speed
            </span>
            <span
              className="metric-val good font-display text-2xl leading-none text-[var(--teal-glow)]"
              id="wind-val"
            >
              {wind}
            </span>
          </div>
          <div className="metric-row flex justify-between items-center border-b border-cloud/10 py-4">
            <span className="metric-name text-[0.7rem] uppercase tracking-[0.15em] text-cloud/45">
              Water Temperature
            </span>
            <span className="metric-val good font-display text-2xl leading-none text-[var(--teal-glow)]">
              72.4°F
            </span>
          </div>
          <div className="metric-row flex justify-between items-center border-b border-cloud/10 py-4">
            <span className="metric-name text-[0.7rem] uppercase tracking-[0.15em] text-cloud/45">
              AI Conditions Score
            </span>
            <span className="metric-val good font-display text-2xl leading-none text-[var(--teal-glow)]">
              PRIME
            </span>
          </div>
          <div className="metric-row flex justify-between items-center border-b border-cloud/10 py-4">
            <span className="metric-name text-[0.7rem] uppercase tracking-[0.15em] text-cloud/45">
              Next Predicted Glass
            </span>
            <span className="metric-val warn font-display text-2xl leading-none text-[var(--gold)]">
              06:45 AM
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
