'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { moderatePhoto, formalizeComplaint } from '@/lib/claude';
import { GpsPicker } from '@/components/map/GpsPicker';
import type { IssueCategory } from '@/lib/types';

const CATEGORIES: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'pothole',     label: 'Pothole',      icon: '🕳️' },
  { value: 'streetlight', label: 'Streetlight',   icon: '💡' },
  { value: 'water_tap',   label: 'Water Tap',     icon: '🚰' },
  { value: 'bus_stop',    label: 'Bus Stop',      icon: '🚏' },
  { value: 'garbage',     label: 'Garbage',       icon: '🗑️' },
  { value: 'other',       label: 'Other',         icon: '⚠️' },
];

type Step = 'photo' | 'location' | 'describe';

export default function NewIssuePage() {
  const router = useRouter();
  const supabase = createClient();

  // Step state
  const [step, setStep] = useState<Step>('photo');

  // Step 1: Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationResult, setModerationResult] = useState<{
    is_valid: boolean; detected_category: string; reason: string;
  } | null>(null);

  // Step 2: Location
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [autoCategory, setAutoCategory] = useState<IssueCategory>('other');

  // Step 3: Description
  const [description, setDescription] = useState('');
  const [formalizing, setFormalizing] = useState(false);
  const [formalResult, setFormalResult] = useState<{
    language_detected: string; description_formal: string; subject: string; urgency: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ---- Step 1: Photo Upload + AI Moderation ----
  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Convert to base64 for Claude Vision
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPhotoBase64(base64);

      // Run AI moderation
      setModerationLoading(true);
      try {
        const result = await moderatePhoto(base64, file.type);
        setModerationResult(result);
        if (result.is_valid) {
          setAutoCategory(result.detected_category as IssueCategory);
        }
      } catch {
        setModerationResult({ is_valid: false, detected_category: 'other', reason: 'Moderation service unavailable. Please try again.' });
      }
      setModerationLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  // ---- Step 2: GPS Location ----
  const handleGpsSelect = useCallback((lat: number, lng: number) => {
    setGpsLat(lat);
    setGpsLng(lng);
  }, []);

  // ---- Step 3: Description + AI Formalization ----
  const handleFormalize = useCallback(async () => {
    if (!description.trim() || !gpsLat || !gpsLng) return;
    setFormalizing(true);
    try {
      const result = await formalizeComplaint(description, gpsLat, gpsLng, autoCategory);
      setFormalResult(result);
    } catch {
      setError('AI formalization failed. Please try again.');
    }
    setFormalizing(false);
  }, [description, gpsLat, gpsLng, autoCategory]);

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!photoFile || !gpsLat || !gpsLng || !formalResult) return;
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in.'); setSubmitting(false); return; }

    const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single();
    if (!userData) { setError('User profile not found.'); setSubmitting(false); return; }

    // Upload photo to Supabase Storage
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${userData.id}/${Date.now()}.${fileExt}`;
    const { error: uploadErr } = await supabase.storage.from('issue-photos').upload(fileName, photoFile);
    if (uploadErr) { setError('Photo upload failed.'); setSubmitting(false); return; }

    const { data: urlData } = supabase.storage.from('issue-photos').getPublicUrl(fileName);

    // Insert issue
    const { error: insertErr } = await supabase.from('issues').insert({
      photo_url: urlData.publicUrl,
      gps_coords: `POINT(${gpsLng} ${gpsLat})`,
      category: autoCategory,
      description_original: description,
      description_formal: formalResult.description_formal,
      language_detected: formalResult.language_detected,
      created_by: userData.id,
    });

    if (insertErr) {
      setError('Failed to create issue.');
      setSubmitting(false);
      return;
    }

    router.push('/map');
  };

  // ---- Render ----
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['photo', 'location', 'describe'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step ? 'bg-blue-600 text-white' :
              (['photo','location','describe'].indexOf(step) > i) ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {['photo','location','describe'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">
              {s === 'photo' ? 'Photo' : s === 'location' ? 'Location' : 'Describe'}
            </span>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* ---- STEP 1: PHOTO ---- */}
      {step === 'photo' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Take a Photo</h1>
          <p className="text-sm text-gray-500">Capture the civic infrastructure issue clearly.</p>

          <label className="block aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer overflow-hidden bg-gray-50">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-4xl mb-2">📸</span>
                <span className="text-sm">Tap to take photo or upload</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>

          {moderationLoading && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              Analyzing photo with AI...
            </div>
          )}

          {moderationResult && !moderationResult.is_valid && (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm font-medium text-red-700">Photo Rejected</p>
              <p className="text-sm text-red-600 mt-1">{moderationResult.reason}</p>
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(''); setModerationResult(null); }}
                className="mt-2 text-sm text-red-600 underline"
              >
                Try a different photo
              </button>
            </div>
          )}

          {moderationResult?.is_valid && (
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-green-700">Photo Validated</p>
              <p className="text-sm text-green-600">Category: {moderationResult.detected_category}</p>
            </div>
          )}

          <button
            onClick={() => setStep('location')}
            disabled={!moderationResult?.is_valid}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            Continue to Location
          </button>
        </div>
      )}

      {/* ---- STEP 2: LOCATION ---- */}
      {step === 'location' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Pin the Location</h1>
          <p className="text-sm text-gray-500">Drag the pin to the exact location of the issue.</p>

          <div className="rounded-xl overflow-hidden h-64 bg-gray-100">
            <GpsPicker onSelect={handleGpsSelect} />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('photo')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep('describe')}
              disabled={!gpsLat}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ---- STEP 3: DESCRIBE ---- */}
      {step === 'describe' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Describe the Issue</h1>
          <p className="text-sm text-gray-500">
            Describe in any language. AI will formalize it into an official complaint.
          </p>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you see, how long it has been, and why it matters..."
            className="w-full h-36 p-4 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          {!formalResult ? (
            <button
              onClick={handleFormalize}
              disabled={!description.trim() || formalizing}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {formalizing ? 'AI is formalizing...' : 'AI Formalize →'}
            </button>
          ) : (
            <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-purple-600 font-medium">AI-Generated Formal Complaint</p>
              <p className="text-sm font-medium">Language: {formalResult.language_detected}</p>
              <p className="text-sm font-semibold">{formalResult.subject}</p>
              <p className="text-sm text-gray-700">{formalResult.description_formal}</p>
              <p className="text-xs text-purple-500">Urgency: {formalResult.urgency}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('location')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formalResult || submitting}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
