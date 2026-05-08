'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface FeedIssue {
  id: string;
  category: string;
  status: string;
  lat: number;
  lng: number;
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_ratings: number;
  description_formal?: string;
}

interface StatsState {
  total: number;
  active: number;
  resolved: number;
  hasConfig: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  pothole: '\u{1F573}\u{FE0F}',
  streetlight: '\u{1F4A1}',
  water_tap: '\u{1F6B0}',
  bus_stop: '\u{1F68F}',
  garbage: '\u{1F5D1}\u{FE0F}',
  other: '\u{26A0}\u{FE0F}',
};

function majorityColor(r: number, y: number, g: number): string {
  if (r >= y && r >= g) return 'red';
  if (y >= r && y >= g) return 'yellow';
  return 'green';
}

const COLORS: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
};

export default function HomePage() {
  const { locale } = useParams<{ locale: string }>();
  const [issues, setIssues] = useState<FeedIssue[]>([]);
  const [stats, setStats] = useState<StatsState>({ total: 0, active: 0, resolved: 0, hasConfig: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [countRes, activeRes, resolvedRes, issuesRes] = await Promise.all([
        supabase.from('issues').select('*', { count: 'exact', head: true }),
        supabase.from('issues').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
        supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.rpc('get_public_map_issues', {
          min_lat: 8, min_lng: 68, max_lat: 38, max_lng: 98,
        }),
      ]);

      const hasConfig = !countRes.error || !countRes.error?.message?.includes('URL');
      const total = countRes.count ?? 0;
      const active = activeRes.count ?? 0;
      const resolved = resolvedRes.count ?? 0;

      setStats({ total, active, resolved, hasConfig });

      if (issuesRes.error) {
        if (issuesRes.error.message?.includes('URL') || issuesRes.error.message?.includes('fetch')) {
          setError('Supabase not configured.');
          setStats({ total: 0, active: 0, resolved: 0, hasConfig: false });
        } else {
          // Schema not loaded yet — show empty state
          setIssues([]);
        }
      } else {
        const data = issuesRes.data as FeedIssue[] | null;
        setIssues(data?.slice(0, 5) ?? []);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('URL') || msg.includes('fetch') || msg.includes('not configured')) {
        setError('Supabase not configured.');
        setStats({ total: 0, active: 0, resolved: 0, hasConfig: false });
      } else {
        setIssues([]);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Hero */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-blue-600">Civic</span> Voice
        </h1>
        <p className="text-gray-500 mt-1">Report. Rate. Resolve.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href={`/${locale}/issues/new`}
          className="bg-blue-600 text-white rounded-xl p-4 text-center hover:bg-blue-700 active:scale-95 transition-transform"
        >
          <div className="text-3xl mb-1">{'\u{1F4F8}'}</div>
          <div className="text-sm font-semibold">Report Issue</div>
        </Link>
        <Link
          href={`/${locale}/map`}
          className="bg-white border rounded-xl p-4 text-center hover:bg-gray-50 active:scale-95 transition-transform"
        >
          <div className="text-3xl mb-1">{'\u{1F5FA}\u{FE0F}'}</div>
          <div className="text-sm font-semibold">View Map</div>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-400">Nearby Issues</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-600">{stats.active}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-gray-400">Resolved</div>
          </div>
        </div>
        {!stats.hasConfig && (
          <p className="text-xs text-amber-500 text-center mt-2">
            Connect Supabase in .env.local to see live data
          </p>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-amber-700">{'⚠'} {error}</p>
          <p className="text-xs text-amber-500 mt-1">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
          </p>
        </div>
      )}

      {/* Nearby Issues Feed */}
      <h2 className="text-lg font-semibold mb-3">Nearby Issues</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">{'\u{1F3D8}\u{FE0F}'}</div>
          <p className="text-gray-400">No issues reported nearby yet.</p>
          <p className="text-sm text-gray-300 mt-1">Be the first to report!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => {
            const color = majorityColor(issue.red_count, issue.yellow_count, issue.green_count);
            const statusColors: Record<string, string> = {
              resolved: 'bg-green-100 text-green-700',
              in_progress: 'bg-blue-100 text-blue-700',
              threshold_met: 'bg-orange-100 text-orange-700',
              pending: 'bg-yellow-100 text-yellow-700',
            };
            const desc = issue.description_formal || '';
            const shortened = desc.length > 100 ? desc.slice(0, 100) + '...' : desc;

            return (
              <Link
                key={issue.id}
                href={`/${locale}/issues/${issue.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border hover:border-blue-200 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">
                      {CATEGORY_ICONS[issue.category] || CATEGORY_ICONS.other}
                    </span>
                    <span className="text-xs font-medium capitalize text-gray-600">
                      {issue.category.replace('_', ' ')}
                    </span>
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[issue.status] || statusColors.pending}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>

                {shortened && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{shortened}</p>
                )}

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${COLORS[color]}`} />
                    <span className="font-medium">{issue.total_ratings}</span>
                    <span className="text-gray-400">ratings</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-red-500">{issue.red_count} crit</span>
                  <span className="text-yellow-500">{issue.yellow_count} warn</span>
                  <span className="text-green-500">{issue.green_count} ok</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
