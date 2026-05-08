'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RatingButtons } from '@/components/issue/RatingButtons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusTimeline } from '@/components/issue/StatusTimeline';
import { OfficialList } from '@/components/official/OfficialList';
import { IssueMapMini } from '@/components/map/IssueMapMini';
import type { IssueDetail, RatingColor, ResponseAction } from '@/lib/types';

const THRESHOLD = 50;

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<RatingColor | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const fetchIssue = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_issue_detail', { issue_uuid: id });
    if (error) setError('Failed to load issue');
    else setIssue(data as unknown as IssueDetail);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  // Real-time subscription for live rating counter
  useEffect(() => {
    const channel = supabase
      .channel(`issue-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ratings',
        filter: `issue_id=eq.${id}`,
      }, () => {
        fetchIssue(); // Re-fetch on new rating
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'issues',
        filter: `id=eq.${id}`,
      }, () => {
        fetchIssue(); // Re-fetch on status change
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, supabase, fetchIssue]);

  // Check user's existing rating
  useEffect(() => {
    async function checkUserRating() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single();
      if (!userData) return;
      const { data: existing } = await supabase.from('ratings').select('color').eq('issue_id', id).eq('user_id', userData.id).single();
      if (existing) setUserRating(existing.color);
    }
    checkUserRating();
  }, [id, supabase]);

  const handleRate = async (color: RatingColor) => {
    setRatingLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Please sign in to rate this issue.');
      setRatingLoading(false);
      return;
    }

    const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single();
    if (!userData) {
      setError('User profile not found.');
      setRatingLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from('ratings').insert({
      issue_id: id,
      user_id: userData.id,
      color,
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        setError('You have already rated this issue.');
      } else {
        setError('Failed to submit rating.');
      }
    } else {
      setUserRating(color);
      await fetchIssue();
    }
    setRatingLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error === 'Failed to load issue' || !issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-500 text-lg">Issue not found.</p>
      </div>
    );
  }

  const { rating_counts, threshold_progress } = issue;
  const progressPercent = Math.min((threshold_progress / THRESHOLD) * 100, 100);
  const isThresholdMet = issue.status !== 'pending';

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    threshold_met: 'Threshold Met',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Photo */}
      <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100">
        <img
          src={issue.photo_url}
          alt={issue.category}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-full text-xs font-medium capitalize">
          {issue.category.replace('_', ' ')}
        </span>
        <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          issue.status === 'resolved' ? 'bg-green-500 text-white' :
          issue.status === 'in_progress' ? 'bg-blue-500 text-white' :
          issue.status === 'threshold_met' ? 'bg-orange-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {statusLabels[issue.status]}
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="text-xl font-bold mb-2 capitalize">{issue.category.replace('_', ' ')} Issue</h1>
      <p className="text-gray-600 mb-4">{issue.description_formal || issue.description_original}</p>

      {/* Mini Map */}
      <div className="mb-4 rounded-xl overflow-hidden h-40">
        <IssueMapMini lat={issue.gps_lat} lng={issue.gps_lng} />
      </div>

      {/* Progress Bar — the "GoFundMe" style counter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-bold text-orange-600">{threshold_progress}</span>
          <span className="text-gray-500">/ {THRESHOLD} citizens have flagged this</span>
        </div>
        <ProgressBar value={progressPercent} />
        <p className="text-xs text-gray-400 mt-2">
          {threshold_progress < 5 && 'This issue needs more ratings to appear on the public map.'}
          {threshold_progress >= 5 && threshold_progress < THRESHOLD && `${THRESHOLD - threshold_progress} more ratings needed to notify officials.`}
          {threshold_progress >= THRESHOLD && 'Threshold reached! Officials have been notified.'}
        </p>
      </div>

      {/* Rating Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{rating_counts.red}</div>
          <div className="text-xs text-red-700">Critical</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{rating_counts.yellow}</div>
          <div className="text-xs text-yellow-700">Needs Attention</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{rating_counts.green}</div>
          <div className="text-xs text-green-700">Looks Fixed</div>
        </div>
      </div>

      {/* Rating Buttons — Red / Yellow / Green */}
      {!isThresholdMet && (
        <div className="mb-4">
          <RatingButtons
            onRate={handleRate}
            loading={ratingLoading}
            currentRating={userRating}
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
      )}

      {userRating && (
        <p className="text-sm text-green-600 text-center mb-4">
          Your rating ({userRating}) has been recorded.
        </p>
      )}

      {/* Status Timeline */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        <h2 className="font-semibold mb-3">Status Timeline</h2>
        <StatusTimeline
          status={issue.status}
          timeline={issue.timeline || []}
          createdAt={issue.created_at}
        />
      </div>

      {/* Responsible Officials (public — no contact details EVER) */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h2 className="font-semibold mb-3">Responsible Officials</h2>
        <OfficialList officials={issue.officials} />
      </div>
    </div>
  );
}
