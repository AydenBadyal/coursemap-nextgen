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

    type CourseMatch = { code: string; start: number; end: number };
    const filteredMatches: CourseMatch[] = matches
      .map((match) => {
        const dept = match[1].toUpperCase();
        const number = match[2];
        const suffix = match[3] ? match[3].toUpperCase() : '';
        const courseCode = `${dept} ${number}${suffix}`;
        const start = match.index ?? 0;
        const end = start + match[0].length;
        return { code: courseCode, start, end };
      })
      .filter(({ code }) => !excludePatterns.some((pattern) => pattern.test(code)));

    // Build unique list for quick checks
    filteredMatches.forEach(({ code }) => coursesSet.add(code));
    const courses = Array.from(coursesSet);

    // Heuristic grouping: consecutive courses separated by "or", "/" or phrases like "either" / "one of"
    const lower = prerequisiteText.toLowerCase();
    const orGroups: string[][] = [];
    let current: string[] = [];
    for (let i = 0; i < filteredMatches.length - 1; i++) {
      const a = filteredMatches[i];
      const b = filteredMatches[i + 1];
      const between = lower.slice(a.end, b.start);
      const hasOr = /\bor\b|\/|either|one of/.test(between);
      if (hasOr) {
        if (current.length === 0) current.push(a.code);
        current.push(b.code);
      } else {
        if (current.length > 1) orGroups.push([...new Set(current)]);
        current = [];
      }
    }
    if (current.length > 1) orGroups.push([...new Set(current)]);

    const groups = orGroups.map((items) => ({ type: 'OR' as const, items }));

    return new Response(
      JSON.stringify({ courses, groups }),
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
