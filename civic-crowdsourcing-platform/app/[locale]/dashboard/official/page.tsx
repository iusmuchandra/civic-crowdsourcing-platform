'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { IssueDetail, ResponseAction } from '@/lib/types';

export default function OfficialDashboardPage() {
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [officialId, setOfficialId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // Auth gate: must be official role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: userData } = await supabase.from('users').select('id, role').eq('auth_user_id', user.id).single();
      if (!userData || userData.role !== 'official') {
        router.push('/');
        return;
      }

      // Find which official this user is
      const { data: officialData } = await supabase.from('officials').select('id').eq('phone', (await supabase.auth.getUser()).data.user?.phone).single();
      if (officialData) setOfficialId(officialData.id);

      // Fetch issues in official's jurisdiction that have hit threshold
      // In production this would use a PostGIS ST_Covers join
      const { data: issuesData } = await supabase
        .from('issues')
        .select('*')
        .in('status', ['threshold_met', 'in_progress'])
        .order('created_at', { ascending: false });

      if (issuesData) {
        const detailed = await Promise.all(
          issuesData.map(async (issue) => {
            const { data } = await supabase.rpc('get_issue_detail', { issue_uuid: issue.id });
            return data as unknown as IssueDetail;
          })
        );
        setIssues(detailed.filter(Boolean));
      }
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  const handleAction = async (issueId: string, action: ResponseAction) => {
    if (!officialId) return;
    setActionLoading(issueId);

    const { error } = await supabase.from('official_responses').insert({
      issue_id: issueId,
      official_id: officialId,
      status_update: action,
      message: message || null,
    });

    if (!error) {
      const newStatus = action === 'resolved' ? 'resolved' :
        action === 'work_started' ? 'in_progress' : 'threshold_met';
      await supabase.from('issues').update({ status: newStatus }).eq('id', issueId);

      // Refresh
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
      setMessage('');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Official Dashboard</h1>

      {issues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No issues in your jurisdiction have reached the threshold yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map(issue => (
            <div key={issue.id} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium capitalize px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {issue.category.replace('_', ' ')}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  issue.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-2">{issue.description_formal}</p>

              {/* Rating breakdown */}
              <div className="flex gap-3 mb-3 text-xs">
                <span className="text-red-600 font-medium">{issue.rating_counts.red} Critical</span>
                <span className="text-yellow-600 font-medium">{issue.rating_counts.yellow} Need Attention</span>
                <span className="text-green-600 font-medium">{issue.rating_counts.green} Looks Fixed</span>
              </div>

              {/* Action buttons (only if not resolved) */}
              {issue.status !== 'resolved' && (
                <div className="space-y-2">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Optional message to citizens..."
                    className="w-full p-2 border rounded-lg text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />

                  <div className="flex gap-2">
                    {issue.status === 'threshold_met' && (
                      <button
                        onClick={() => handleAction(issue.id, 'acknowledged')}
                        disabled={actionLoading === issue.id}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                      >
                        {actionLoading === issue.id ? '...' : 'Acknowledge'}
                      </button>
                    )}
                    {issue.status !== 'resolved' && (
                      <>
                        <button
                          onClick={() => handleAction(issue.id, 'work_started')}
                          disabled={actionLoading === issue.id}
                          className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium"
                        >
                          Mark Work Started
                        </button>
                        <button
                          onClick={() => handleAction(issue.id, 'resolved')}
                          disabled={actionLoading === issue.id}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                        >
                          Mark Resolved
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
