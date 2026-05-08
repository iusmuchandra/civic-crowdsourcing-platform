import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  // NEXT_PUBLIC_ vars are inlined at build time in client components.
  // We read them at call time so they're always resolved in the browser context.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return a noisy proxy so the caller always gets a clear error.
    return new Proxy({} as ReturnType<typeof createSupabaseClient>, {
      get(_target, prop) {
        if (prop === 'auth') {
          return new Proxy({}, {
            get() {
              return () => {
                throw new Error(
                  'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
                );
              };
            },
          });
        }
        return () => {
          throw new Error(
            'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
          );
        };
      },
    });
  }

  return createSupabaseClient(url, anonKey);
}
