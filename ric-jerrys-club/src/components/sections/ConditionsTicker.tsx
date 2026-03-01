"use client";

const CONDITIONS = [
  { icon: "🌡️", label: "Water Temp", val: "72°F" },
  { icon: "💨", label: "Wind Speed", val: "0.3 mph" },
  { icon: "🌊", label: "Flatness Rating", val: "9.8/10" },
  { icon: "☀️", label: "UV Index", val: "6 · Moderate" },
  { icon: "🚤", label: "Boats Active", val: "2 of 3" },
  { icon: "⏱️", label: "Next Open Slot", val: "07:30 AM" },
  { icon: "📍", label: "Course Status", val: "Set · 22 Off" },
];

export function ConditionsTicker() {
  return (
    <div
      id="conditions"
      className="overflow-hidden border-y border-teal-glow/20 bg-[var(--teal-deep)] px-12 py-6"
    >
      <div
        className="flex gap-16 whitespace-nowrap animate-ticker"
      >
        {[...CONDITIONS, ...CONDITIONS].map((item, i) => (
          <div
            key={i}
            className="cond-item flex flex-shrink-0 items-center gap-3"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-cloud/50">
              {item.label}
            </span>
            <span className="font-display ml-1.5 text-[1.3rem] text-[var(--teal-glow)]">
              {item.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
