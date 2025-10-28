import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dept = url.searchParams.get('dept') || '';
    const number = url.searchParams.get('number') || '';

    const response = await fetch(
      `https://api.sfucourses.com/v1/rest/outlines?dept=${dept}&number=${number}`
    );

    if (!response.ok) {
      throw new Error(`SFU API returned status: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('SFU Courses API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch course data' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
