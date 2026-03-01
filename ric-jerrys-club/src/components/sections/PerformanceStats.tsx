"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

const STATS = [
  {
    num: "36",
    unit: "mph",
    desc: "Max course speed\nZero-Off locked",
    bg: "1",
    delay: "0s",
  },
  {
    num: "6",
    unit: "/6",
    desc: "Buoy count\nClub record set",
    bg: "2",
    delay: "0.1s",
  },
  {
    num: "22",
    unit: "off",
    desc: "Rope length\nAdvanced course",
    bg: "3",
    delay: "0.2s",
  },
  {
    num: "5",
    unit: "am",
    desc: "Dawn patrol slots\nGlass guaranteed",
    bg: "4",
    delay: "0.3s",
  },
];

export function PerformanceStats() {
  const titleRef = useScrollReveal<HTMLHeadingElement>();
  const subRef = useScrollReveal<HTMLDivElement>();

  return (
    <section
      id="the-pull"
      className="min-h-screen px-12 py-[120px] max-md:px-6 max-md:py-20"
      style={{
        background:
          "linear-gradient(180deg, var(--teal-deep) 0%, #061412 100%)",
      }}
    >
      <div className="pull-header mx-auto mb-20 flex max-w-[1300px] flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
        <h2
          ref={titleRef}
          className="reveal-left font-display leading-[0.85] text-[var(--cloud)] max-md:text-4xl md:text-[clamp(4rem,10vw,10rem)]"
        >
          THE
          <br />
          <span className="text-[var(--teal-glow)]">PULL</span>
          <br />
          STATS
        </h2>
        <div ref={subRef} className="reveal-right max-w-[320px] text-right">
          <div className="section-label mb-2 text-right text-[0.65rem] uppercase tracking-[0.3em] text-[var(--teal-glow)]">
            § 03 — Performance
          </div>
          <p className="text-[0.95rem] font-light leading-[1.7] text-cloud/55">
            Every set recorded. Every buoy counted. Zero-Off syncs directly to
            your member dashboard — your progression, in real time.
          </p>
        </div>
      </div>

      <div className="stats-grid mx-auto grid max-w-[1300px] grid-cols-1 gap-0.5 md:grid-cols-4">
        {STATS.map((stat, _) => (
          <div
            key={stat.bg}
            data-cursor-hover
            className="reveal stat-card relative overflow-hidden border border-teal-glow/10 bg-[rgba(30,74,70,0.3)] px-9 py-12 transition-all duration-350 ease-out hover:-translate-y-1 hover:border-teal-glow/35 md:px-9 md:py-12"
            style={{
              transitionDelay: stat.delay,
            }}
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-350 hover:opacity-100"
              style={{
                background:
                  "linear-gradient(135deg, rgba(78,201,192,0.08) 0%, transparent 60%)",
              }}
            />
            <div className="stat-num font-display text-[4.5rem] leading-none text-[var(--cloud)] mb-2">
              {stat.num}
              <span className="text-[var(--teal-glow)]">{stat.unit}</span>
            </div>
            <div className="stat-desc whitespace-pre-line text-[0.75rem] uppercase tracking-[0.15em] leading-[1.6] text-cloud/45">
              {stat.desc}
            </div>
            <div className="stat-bg-num pointer-events-none absolute -bottom-5 -right-2.5 font-display text-[8rem] leading-none text-teal-glow/[0.04]">
              {stat.bg}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
