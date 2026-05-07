'use client';

import type { OfficialRole } from '@/lib/types';

interface PublicOfficial {
  name: string;
  role: OfficialRole;
}

const ROLE_LABELS: Record<OfficialRole, { label: string; icon: string }> = {
  worker:    { label: 'Local Worker',       icon: '👷' },
  engineer:  { label: 'Area Engineer',      icon: '🏗️' },
  corporator:{ label: 'Corporator',         icon: '🏛️' },
  mla:       { label: 'MLA',                icon: '📜' },
  minister:  { label: 'Minister',           icon: '🏢' },
  cm:        { label: 'Chief Minister',     icon: '🏛️' },
};

interface Props {
  officials: PublicOfficial[] | null;
}

export function OfficialList({ officials }: Props) {
  if (!officials || officials.length === 0) {
    return <p className="text-sm text-gray-400">No officials mapped for this area yet.</p>;
  }

  return (
    <div className="space-y-2">
      {officials.map((official, idx) => {
        const meta = ROLE_LABELS[official.role] || { label: official.role, icon: '👤' };
        return (
          <div key={idx} className="flex items-center gap-3 py-1.5">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
              {meta.icon}
            </span>
            <div>
              <p className="text-sm font-medium">{official.name}</p>
              <p className="text-xs text-gray-400">{meta.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
