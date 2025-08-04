import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isProduction = import.meta.env.PROD;

// Validate URL format
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Robust validation including "undefined" string check
if (
  !supabaseUrl ||
  supabaseUrl === 'undefined' ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'undefined' ||
  !isValidUrl(supabaseUrl)
) {
  console.error('❌ [Supabase] Environment variables not configured properly!');
  console.error('Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('You can find these values in your Supabase project dashboard');
  console.error('VITE_SUPABASE_URL must be a valid URL like: https://your-project-id.supabase.co');
  console.error('Current values:', {
    url: supabaseUrl || '(not set)',
    anonKey: supabaseAnonKey ? '(set)' : '(not set)'
  });
  
  // Show user-friendly error message only in browser environment
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: #f3f4f6; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          background: white; 
          padding: 2rem; 
          border-radius: 0.5rem; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
          max-width: 500px; 
          text-align: center;
        ">
          <h2 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Supabase Not Connected</h2>
          <p style="color: #374151; margin-bottom: 1rem;">
            Please configure valid Supabase credentials in the .env file:
          </p>
          <div style="
            background: #f9fafb; 
            padding: 1rem; 
            border-radius: 0.25rem; 
            font-family: monospace; 
            font-size: 0.875rem; 
            text-align: left; 
            margin-bottom: 1rem;
          ">
            VITE_SUPABASE_URL=https://your-project-id.supabase.co<br>
            VITE_SUPABASE_ANON_KEY=your_anon_key
          </div>
          <p style="color: #6b7280; font-size: 0.875rem;">
            Find these values in your Supabase project dashboard.<br>
            Make sure the URL starts with https:// and is complete.
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
  
  throw new Error('Supabase environment variables not configured properly');
}

// Success logs with production-safe output
console.log('✅ [Supabase] Configured successfully');
console.log('🔗 [Supabase] URL:', supabaseUrl);

// Only show Anon Key details in development
if (!isProduction) {
  console.log(
    '🔑 [Supabase] Anon Key:',
    supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '(not set)'
  );
} else {
  console.log('🔑 [Supabase] Anon Key: (hidden in production)');
  
  // Log de diagnóstico para produção
  console.log('🔍 [Diagnóstico] Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlFormat: supabaseUrl ? 'OK' : 'MISSING',
    production: isProduction
  });
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);