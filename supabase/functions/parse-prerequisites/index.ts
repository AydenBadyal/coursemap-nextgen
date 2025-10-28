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
    const { prerequisiteText } = await req.json();
    
    if (!prerequisiteText || typeof prerequisiteText !== 'string') {
      return new Response(
        JSON.stringify({ courses: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Extract all course codes using regex
    // Matches patterns like: CMPT 225, CMPT 105W, MACM101, ENSC 251D
    const coursePattern = /\b([A-Z]{2,5})\s*(\d{3,4})([A-Z]{0,2})\b/gi;
    const matches = [...prerequisiteText.matchAll(coursePattern)];

    // Filter out BC 12 / high school courses and create unique course codes
    const coursesSet = new Set<string>();
    const excludePatterns = [
      /^BC\s*\d+[A-Z]*$/i,
      /^(MATH|CHEM|PHYS|ENGL|BIO)\s*11[A-Z]*$/i,
      /^(MATH|CHEM|PHYS|ENGL|BIO)\s*12[A-Z]*$/i,
    ];

    matches.forEach(match => {
      const dept = match[1].toUpperCase();
      const number = match[2];
      const suffix = match[3] ? match[3].toUpperCase() : '';
      const courseCode = `${dept} ${number}${suffix}`;

      const shouldExclude = excludePatterns.some(pattern => pattern.test(courseCode));
      
      if (!shouldExclude) {
        coursesSet.add(courseCode);
      }
    });

    const courses = Array.from(coursesSet);

    return new Response(
      JSON.stringify({ courses }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Parse prereqs error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to parse prerequisites' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
