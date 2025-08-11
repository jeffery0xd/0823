// This file serves as a client-side proxy to the Supabase Edge Function
export default async function handler(req, res) {
  const SUPABASE_URL = 'https://pfkqocxbvnfebuhrjnxm.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma3FvY3hidm5mZWJ1aHJqbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTMwNjksImV4cCI6MjA2ODA2OTA2OX0.B-IoA9SkLH8tmj9xXObklN9PmDj1jnj9B9lpChDDgMM';
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/app_e87b41cfe355428b8146f8bae8184e10_generate_images`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(req.body),
    }
  );
  
  const data = await response.json();
  res.status(response.status).json(data);
}