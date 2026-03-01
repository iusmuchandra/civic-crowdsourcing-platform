"use client";

import { useState, useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const START_DAY = 0; // March 2026 starts Sunday
const DAYS = 31;
const HAS_SLOT = [1, 3, 4, 7, 8, 10, 11, 14, 15, 17, 18, 21, 22, 24, 25, 28];
const PRIME_SLOT = [4, 8, 18, 25];

export function BookingCalendar() {
  const leftRef = useScrollReveal<HTMLDivElement>();
  const rightRef = useScrollReveal<HTMLDivElement>();
  const [selected, setSelected] = useState(4);
  const [month] = useState("March 2026");
  const randomScore = useMemo(() => 8.5 + (selected % 10) * 0.1, [selected]);

  const calendarDays = useMemo(() => {
    const empty = Array.from({ length: START_DAY }, () => ({
      day: 0,
      empty: true,
      hasSlot: false,
      prime: false,
    }));
    const days = Array.from({ length: DAYS }, (_, i) => {
      const d = i + 1;
      return {
        day: d,
        empty: false,
        hasSlot: HAS_SLOT.includes(d),
        prime: PRIME_SLOT.includes(d),
      };
    });
    return [...empty, ...days];
  }, []);

  const selectedLabel =
    selected > 0 ? `Selected: Mar ${selected}` : "Select a day";
  const selectedForecast =
    selected === 4
      ? "Dawn glass predicted 6AM–8AM. Boat #2 available. Conditions score: 9.2"
      : selected > 0
        ? `Dawn glass predicted 6AM–8AM. Conditions score: ${randomScore.toFixed(1)}`
        : "Select a date to see forecast.";

  return (
    <section
      id="booking"
      className="relative px-12 py-[120px] max-md:px-6 max-md:py-20"
    >
      <div className="booking-inner mx-auto grid max-w-[1300px] grid-cols-1 items-start gap-20 md:grid-cols-[1fr_1.2fr]">
        <div ref={leftRef} className="booking-text reveal-left">
          <div className="section-label mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--teal-glow)]">
            § 04 — Smart Booking
          </div>
          <h2 className="font-serif mb-6 text-[var(--cloud)] font-light leading-[1.1] max-md:text-2.5xl md:text-[clamp(2.5rem,5vw,4.5rem)]">
            Book your
            <br />
            <strong className="font-semibold italic text-[var(--gold)]">
              perfect pull.
            </strong>
          </h2>
          <p className="mb-10 max-w-[400px] text-[0.95rem] font-light leading-[1.8] text-cloud/55">
            Our AI forecasts the best slots based on wind patterns, boat
            availability, and your personal preference for glass-flat conditions.
            Gold dates = predicted prime glass.
          </p>
          <div className="border-l-2 border-[var(--teal-glow)] bg-teal-glow/[0.06] p-5">
            <div className="forecast-label mb-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-[var(--gold)]">
              AI Forecast · This Week
            </div>
            <p className="font-serif text-[1.1rem] italic leading-snug text-cloud/80">
              &quot;Wednesday 6AM and Saturday dawn are your highest-probability
              glass windows. Wind drops below 1mph by 5:45AM both mornings.&quot;
            </p>
          </div>
        </div>

        <div ref={rightRef} className="reveal-right">
          <div className="calendar-widget border border-teal-glow/15 bg-teal-deep/40 p-9 backdrop-blur-[10px]">
            <div className="cal-header mb-7 flex items-center justify-between">
              <div className="cal-month font-serif text-[1.4rem] font-normal tracking-[0.1em] text-[var(--cloud)]">
                {month}
              </div>
              <div className="cal-nav flex gap-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center border border-teal-glow/30 text-[var(--teal-glow)] transition-colors hover:bg-[var(--teal-glow)] hover:text-[var(--ink)]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center border border-teal-glow/30 text-[var(--teal-glow)] transition-colors hover:bg-[var(--teal-glow)] hover:text-[var(--ink)]"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="cal-days-header mb-2 grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="cal-day-label py-1.5 text-center text-[0.6rem] uppercase tracking-[0.15em] text-cloud/35"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="cal-grid grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) =>
                cell.empty ? (
                  <div
                    key={`e-${i}`}
                    className="cal-day empty aspect-square opacity-0 pointer-events-none"
                  />
                ) : (
                  <button
                    key={cell.day}
                    type="button"
                    data-cursor-hover
                    onClick={() => setSelected(cell.day)}
                    className={`cal-day aspect-square flex flex-col items-center justify-center text-[0.8rem] transition-all border relative ${
                      selected === cell.day
                        ? "border-[var(--teal-glow)] bg-[var(--teal-glow)] font-medium text-[var(--ink)]"
                        : "border-transparent text-cloud/60 hover:border-teal-glow/30 hover:text-[var(--cloud)]"
                    } ${cell.hasSlot ? "has-slot" : ""} ${cell.prime ? "prime" : ""}`}
                  >
                    {cell.day}
                    {cell.hasSlot && selected !== cell.day && (
                      <span
                        className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--teal-glow)]"
                        style={{
                          background: cell.prime
                            ? "var(--gold)"
                            : "var(--teal-glow)",
                        }}
                      />
                    )}
                  </button>
                )
              )}
            </div>
            <div className="conditions-forecast mt-5 border-l-2 border-[var(--gold)] bg-teal-glow/[0.08] p-4">
              <div className="forecast-label text-[0.6rem] uppercase tracking-[0.2em] text-[var(--gold)] mb-1.5">
                {selectedLabel}
              </div>
              <div className="forecast-text text-[0.85rem] italic leading-snug text-cloud/75">
                {selectedForecast}
              </div>
            </div>
            <button
              type="button"
              data-cursor-hover
              className="btn-book mt-6 w-full border-none bg-[var(--teal-glow)] py-4 px-10 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-[var(--ink)] transition-all hover:bg-[var(--gold)] hover:-translate-y-0.5"
            >
              Reserve This Slot →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
