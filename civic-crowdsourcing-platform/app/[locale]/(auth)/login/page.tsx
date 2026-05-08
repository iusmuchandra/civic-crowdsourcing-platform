'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
    });
    if (error) setError(error.message);
    else setStep('otp');
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.verifyOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setError('Invalid OTP. Please try again.');
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-sm text-gray-400 mt-1">
          Your phone number is never shown publicly
        </p>
      </div>

      {step === 'phone' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 border rounded-lg px-3 py-2.5 text-sm">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                maxLength={10}
                className="flex-1 border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={sendOtp}
            disabled={phone.length < 10 || loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            OTP sent to +91 {phone}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              maxLength={6}
              className="w-full border rounded-lg px-3 py-2.5 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            onClick={verifyOtp}
            disabled={otp.length !== 6 || loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            onClick={() => { setStep('phone'); setError(''); }}
            className="w-full text-sm text-blue-600"
          >
            Change phone number
          </button>
        </div>
      )}
    </div>
  );
}
