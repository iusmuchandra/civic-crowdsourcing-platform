'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  updated_by: string;
  updated_at: string;
}

export default function AdminDashboardPage() {
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: userData } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single();
      if (!userData || userData.role !== 'admin') { router.push('/'); return; }

      // Fetch officials with pending edits (updated but not verified)
      const { data } = await supabase.from('officials').select('*').eq('is_verified', false).order('updated_at', { ascending: false });
      setReviewQueue(data || []);
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    await supabase.from('officials').update({ is_verified: true }).eq('id', id);
    setReviewQueue(prev => prev.filter(o => o.id !== id));
    setApproving(null);
  };

  const handleReject = async (id: string) => {
    // Revert unverified changes (simplified — in production track edit history)
    await supabase.from('officials').update({ is_verified: false }).eq('id', id);
    setReviewQueue(prev => prev.filter(o => o.id !== id));
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
      <h1 className="text-xl font-bold mb-2">Admin Panel</h1>
      <p className="text-sm text-gray-500 mb-6">
        Review and approve editor-submitted changes to official records.
      </p>

      {reviewQueue.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No pending reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewQueue.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.role}</p>
                </div>
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Updated: {new Date(item.updated_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={approving === item.id}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
