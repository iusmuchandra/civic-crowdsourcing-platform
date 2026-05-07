'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface NearbyIssue {
  id: string;
  category: string;
  status: string;
  gps_lat: number;
  gps_lng: number;
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_ratings: number;
  description_original?: string;
}

export default function HomePage() {
  const [nearbyIssues, setNearbyIssues] = useState<NearbyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNearby() {
      // Try to get user location for personalized feed
      let lat = 17.385;
      let lng = 78.4867;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch { /* use default */ }
      }

      // Fetch issues within ~5km using PostGIS
      const { data } = await supabase.rpc('get_public_map_issues', {
        min_lat: lat - 0.05,
        min_lng: lng - 0.05,
        max_lat: lat + 0.05,
        max_lng: lng + 0.05,
      });

      setNearbyIssues((data || []) as NearbyIssue[]);
      setLoading(false);
    }
    fetchNearby();
  }, [supabase]);

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
          href="/issues/new"
          className="bg-blue-600 text-white rounded-xl p-4 text-center hover:bg-blue-700 active:scale-95 transition-transform"
        >
          <div className="text-3xl mb-1">📸</div>
          <div className="text-sm font-semibold">Report Issue</div>
        </Link>
        <Link
          href="/map"
          className="bg-white border rounded-xl p-4 text-center hover:bg-gray-50 active:scale-95 transition-transform"
        >
          <div className="text-3xl mb-1">🗺️</div>
          <div className="text-sm font-semibold">View Map</div>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">{nearbyIssues.length}</div>
            <div className="text-xs text-gray-400">Nearby Issues</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-600">
              {nearbyIssues.filter(i => i.status === 'pending' || i.status === 'threshold_met').length}
            </div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">
              {nearbyIssues.filter(i => i.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-400">Resolved</div>
          </div>
        </div>
      </div>

      {/* Nearby Issues Feed */}
      <h2 className="text-lg font-semibold mb-3">Nearby Issues</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : nearbyIssues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">🏘️</p>
          <p className="text-gray-400">No issues reported nearby yet.</p>
          <p className="text-sm text-gray-300 mt-1">Be the first to report!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nearbyIssues.slice(0, 10).map(issue => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border hover:border-blue-200 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium capitalize px-2 py-0.5 bg-gray-100 rounded-full">
                  {issue.category.replace('_', ' ')}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  issue.status === 'resolved' ? 'bg-green-500' :
                  issue.status === 'in_progress' ? 'bg-blue-500' :
                  issue.status === 'threshold_met' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {issue.description_original || 'No description provided.'}
              </p>

              {/* Mini rating bar */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{
                      width: `${Math.min((issue.red_count / Math.max(issue.total_ratings, 1)) * 100, 100)}%`
                    }} />
                  </div>
                  <span className="text-red-500 font-medium">{issue.red_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{
                      width: `${Math.min((issue.yellow_count / Math.max(issue.total_ratings, 1)) * 100, 100)}%`
                    }} />
                  </div>
                  <span className="text-yellow-500 font-medium">{issue.yellow_count}</span>
                </div>
                <span className="text-gray-400">{issue.total_ratings} ratings</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
