import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const projectId = "hyuejcdzjhzafyuxiwze";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dWVqY2R6amh6YWZ5dXhpd3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjI5NDMsImV4cCI6MjA2ODg5ODk0M30.OMqqcNqo3_eV9YYUoSYJQjvsUpq8xQk5chIyiDpTkyc";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// API helper function
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || publicAnonKey;
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-62d2b480${endpoint}`,
    {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`API call failed for ${endpoint}:`, error);
    throw new Error(`API Error: ${response.status} ${error}`);
  }

  return response.json();
}

// Export the project configuration for use in other files
export { projectId, publicAnonKey };