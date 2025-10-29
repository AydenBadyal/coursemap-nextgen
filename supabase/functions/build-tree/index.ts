import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Node {
  id: string;
  title: string;
  dept: string;
  number: string;
  description?: string;
  units?: string;
  prerequisites?: string;
  corequisites?: string;
}

interface Link {
  source: string;
  target: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startCourse } = await req.json();

    const nodes: Node[] = [];
    const links: Link[] = [];
    const visited = new Set<string>();
    const nodeMap = new Map<string, boolean>();

    // Always call sibling functions via the Supabase Functions URL (never use request origin)
    const FUNCTIONS_BASE = 'https://qnoxtpcjwifaquokfohj.supabase.co/functions/v1';
    const supaAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeaders: HeadersInit = {
      'apikey': supaAnon,
      'authorization': `Bearer ${supaAnon}`,
    };

    function parseCourse(courseStr: string) {
      const match = String(courseStr).trim().match(/([A-Z]+)\s*(\d+)([A-Z]*)/i);
      if (!match) return null as
        | null
        | { dept: string; number: string; suffix: string };
      return {
        dept: match[1].toUpperCase(),
        number: match[2],
        suffix: match[3] ? match[3].toUpperCase() : '',
      };
    }

    async function fetchPrerequisites(courseStr: string, depth = 0): Promise<void> {
      if (depth > 5) return; // safety guard
      if (visited.has(courseStr)) return;
      visited.add(courseStr);

      const parsed = parseCourse(courseStr);
      if (!parsed) return;

      // Avoid known problematic courses to reduce noise
      if (parsed.dept === 'CMPT' && parsed.number === '300') return;

      // Fetch course data using our public function with proper auth headers
      const courseRes = await fetch(
        `${FUNCTIONS_BASE}/fetch-sfu-courses?dept=${parsed.dept}&number=${parsed.number}${parsed.suffix}`,
        { headers: authHeaders }
      );

      if (!courseRes.ok) {
        const txt = await courseRes.text().catch(() => '');
        console.error('fetch-sfu-courses failed:', courseRes.status, txt.slice(0, 200));
        return;
      }

      const ct = courseRes.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const txt = await courseRes.text().catch(() => '');
        throw new Error(`Unexpected response from fetch-sfu-courses: ${txt.slice(0, 200)}`);
      }

      const courseData = await courseRes.json();
      if (!courseData || courseData.length === 0) return;

      const course = courseData[0];
      const courseId = `${course.dept} ${course.number}`;

      if (!nodeMap.has(courseId)) {
        nodes.push({
          id: courseId,
          title: course.title ?? courseId,
          dept: course.dept,
          number: course.number,
          description: course.description ?? '',
          units: course.units ?? '',
          prerequisites: course.prerequisites ?? '',
          corequisites: course.corequisites ?? '',
        });
        nodeMap.set(courseId, true);
      }

      const prereqText = String(course.prerequisites || '').trim();
      if (prereqText) {
        const parseRes = await fetch(`${FUNCTIONS_BASE}/parse-prerequisites`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prerequisiteText: prereqText }),
        });

        if (!parseRes.ok) {
          const txt = await parseRes.text().catch(() => '');
          console.error('parse-prerequisites failed:', parseRes.status, txt.slice(0, 200));
          return;
        }

        const ct2 = parseRes.headers.get('content-type') || '';
        if (!ct2.includes('application/json')) {
          const txt = await parseRes.text().catch(() => '');
          throw new Error(`Unexpected response from parse-prerequisites: ${txt.slice(0, 200)}`);
        }

        const { courses: prereqCourses = [] } = await parseRes.json();

        for (const prereqStr of prereqCourses as string[]) {
          const p = parseCourse(prereqStr);
          if (!p) continue;
          const prereqId = `${p.dept} ${p.number}${p.suffix}`;

          // Avoid duplicate links
          if (!links.find((l) => l.source === prereqId && l.target === courseId)) {
            links.push({ source: prereqId, target: courseId });
          }

          await fetchPrerequisites(prereqStr, depth + 1);
        }
      }
    }

    await fetchPrerequisites(startCourse);

    return new Response(JSON.stringify({ nodes, links }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Build tree error:', error);
    return new Response(JSON.stringify({ error: 'Failed to build prerequisite tree' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
