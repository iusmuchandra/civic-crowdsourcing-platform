'use client';

interface Props {
  value: number; // 0-100
}

export function ProgressBar({ value }: Props) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
