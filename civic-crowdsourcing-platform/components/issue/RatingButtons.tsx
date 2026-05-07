'use client';

import type { RatingColor } from '@/lib/types';

interface Props {
  onRate: (color: RatingColor) => void;
  loading: boolean;
  currentRating: RatingColor | null;
}

const RATING_OPTIONS: { color: RatingColor; emoji: string; label: string; bg: string }[] = [
  { color: 'red',    emoji: '🟥', label: 'Critical',        bg: 'hover:bg-red-50 border-red-200' },
  { color: 'yellow', emoji: '🟨', label: 'Needs Attention',  bg: 'hover:bg-yellow-50 border-yellow-200' },
  { color: 'green',  emoji: '🟩', label: 'Looks Fixed',      bg: 'hover:bg-green-50 border-green-200' },
];

export function RatingButtons({ onRate, loading, currentRating }: Props) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-2 text-center">Tap to rate this issue:</p>
      <div className="flex gap-2">
        {RATING_OPTIONS.map(({ color, emoji, label, bg }) => {
          const isSelected = currentRating === color;
          return (
            <button
              key={color}
              onClick={() => !loading && !isSelected && onRate(color)}
              disabled={loading || !!currentRating}
              className={`flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? `border-${color}-500 bg-${color}-50 scale-105`
                  : `border-gray-100 ${bg}`
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-xs font-medium">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
