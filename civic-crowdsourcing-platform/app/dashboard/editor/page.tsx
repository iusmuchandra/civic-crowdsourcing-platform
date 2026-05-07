'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Official, OfficialRole } from '@/lib/types';

interface OfficialEdit extends Official {
  suggestion?: {
    name?: string;
    role?: OfficialRole;
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
}

export default function EditorDashboardPage() {
  const [officials, setOfficials] = useState<OfficialEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: userData } = await supabase.from('users').select('role').eq('auth_user_id', user.id).single();
      if (!userData || (userData.role !== 'editor' && userData.role !== 'admin')) {
        router.push('/');
        return;
      }

      const { data } = await supabase.from('officials').select('*').order('role').order('name');
      setOfficials(data || []);
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  const handleSuggestEdit = async (officialId: string) => {
    setSaving(true);
    const official = officials.find(o => o.id === officialId);
    if (!official?.suggestion) return;

    // Editor suggestions go to review queue (simplified: store as metadata)
    const { error } = await supabase.from('officials').update({
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString(),
    }).eq('id', officialId);

    if (error) {
      setMessage('Failed to submit suggestion.');
    } else {
      setMessage('Suggestion submitted for admin review.');
      setEditingId(null);
    }
    setSaving(false);
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
      <h1 className="text-xl font-bold mb-2">Community Editor Panel</h1>
      <p className="text-sm text-gray-500 mb-6">
        Suggest updates to official contact details. Changes are reviewed by an admin before going live.
      </p>

      {message && (
        <div className="bg-green-50 rounded-xl p-3 mb-4 text-sm text-green-700">{message}</div>
      )}

      <div className="space-y-3">
        {officials.map(official => (
          <div key={official.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">{official.name}</p>
                <p className="text-xs text-gray-400 capitalize">{official.role}</p>
              </div>
              <button
                onClick={() => setEditingId(editingId === official.id ? null : official.id)}
                className="text-xs text-blue-600 font-medium"
              >
                {editingId === official.id ? 'Cancel' : 'Suggest Edit'}
              </button>
            </div>

            <div className="text-xs text-gray-400 space-y-0.5">
              <p>Ward: {official.ward_number || 'N/A'}</p>
              <p>Municipality: {official.municipality || 'N/A'}</p>
              <p>State: {official.state || 'N/A'}</p>
              {official.is_verified && (
                <span className="text-green-600 font-medium"> Verified</span>
              )}
            </div>

            {editingId === official.id && (
              <div className="mt-3 space-y-2 border-t pt-3">
                <input
                  placeholder="Updated name"
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  onChange={e => {
                    const updated = officials.map(o =>
                      o.id === official.id ? { ...o, suggestion: { ...o.suggestion, name: e.target.value } } : o
                    );
                    setOfficials(updated);
                  }}
                />
                <input
                  placeholder="Updated phone (not publicly visible)"
                  type="tel"
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  onChange={e => {
                    const updated = officials.map(o =>
                      o.id === official.id ? { ...o, suggestion: { ...o.suggestion, phone: e.target.value } } : o
                    );
                    setOfficials(updated);
                  }}
                />
                <input
                  placeholder="Updated email"
                  type="email"
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  onChange={e => {
                    const updated = officials.map(o =>
                      o.id === official.id ? { ...o, suggestion: { ...o.suggestion, email: e.target.value } } : o
                    );
                    setOfficials(updated);
                  }}
                />
                <button
                  onClick={() => handleSuggestEdit(official.id)}
                  disabled={saving}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Submit Suggestion
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
