'use client';

import type { IssueStatus, TimelineEntry } from '@/lib/types';

interface Props {
  status: IssueStatus;
  timeline: TimelineEntry[];
  createdAt: string;
}

const STATUS_STEPS = [
  { key: 'pending' as const,       label: 'Reported',      icon: '📋' },
  { key: 'threshold_met' as const, label: 'Threshold Met', icon: '✅' },
  { key: 'in_progress' as const,   label: 'Work Started',  icon: '🔧' },
  { key: 'resolved' as const,      label: 'Resolved',      icon: '🎉' },
];

export function StatusTimeline({ status, timeline, createdAt }: Props) {
  const statusOrder: IssueStatus[] = ['pending', 'threshold_met', 'in_progress', 'resolved'];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const isComplete = idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                isComplete ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              } ${isCurrent ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}>
                {step.icon}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[1.5rem] ${
                  idx < currentIdx ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1">
              <p className={`text-sm font-medium ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {idx === 0 && (
                <p className="text-xs text-gray-400">
                  {new Date(createdAt).toLocaleDateString(undefined, {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              )}
              {/* Official response entries */}
              {timeline
                .filter(t => {
                  const entryOrder: IssueStatus[] = ['pending', 'threshold_met', 'in_progress', 'resolved'];
                  const tIdx = entryOrder.indexOf(
                    t.action === 'acknowledged' ? 'threshold_met' :
                    t.action === 'work_started' ? 'in_progress' :
                    t.action === 'resolved' ? 'resolved' : 'pending'
                  );
                  return tIdx === idx && idx > 0;
                })
                .map((entry, i) => (
                  <div key={i} className="mt-1 text-xs text-gray-500">
                    <span className="font-medium">{entry.name}</span> ({entry.role})
                    {entry.message && <span> — {entry.message}</span>}
                    <br />
                    <span className="text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}
