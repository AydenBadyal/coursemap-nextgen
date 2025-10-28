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
}

interface Link {
  source: string;
  target: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startCourse } = await req.json();
    
    const nodes: Node[] = [];
    const links: Link[] = [];
    const visited = new Set<string>();
    const nodeMap = new Map<string, boolean>();

    const origin = req.headers.get('origin') || 'http://localhost:8080';

    function parseCourse(courseStr: string) {
      const match = courseStr.trim().match(/([A-Z]+)\s*(\d+)([A-Z]*)/i);
      if (!match) return null;
      return { 
        dept: match[1].toUpperCase(), 
        number: match[2],
        suffix: match[3] ? match[3].toUpperCase() : ''
      };
    }

    async function fetchPrerequisites(courseStr: string, depth = 0): Promise<void> {
      if (depth > 5) return;
      if (visited.has(courseStr)) return;
      
      visited.add(courseStr);
      
      const parsed = parseCourse(courseStr);
      if (!parsed) return;
      
      // Skip CMPT 300 specifically
      if (parsed.dept === "CMPT" && parsed.number === "300") return;

      const courseResponse = await fetch(
        `${origin}/functions/v1/fetch-sfu-courses?dept=${parsed.dept}&number=${parsed.number}${parsed.suffix}`
      );

      if (!courseResponse.ok) return;

      const courseData = await courseResponse.json();
      if (!courseData || courseData.length === 0) return;

      const course = courseData[0];
      const courseId = `${course.dept} ${course.number}`;

      if (!nodeMap.has(courseId)) {
        nodes.push({
          id: courseId,
          title: course.title,
          dept: course.dept,
          number: course.number,
        });
        nodeMap.set(courseId, true);
      }

      if (course.prerequisites && course.prerequisites.trim()) {
        const parseResponse = await fetch(
          `${origin}/functions/v1/parse-prerequisites`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prerequisiteText: course.prerequisites }),
          }
        );

        if (parseResponse.ok) {
          const { courses: prereqCourses } = await parseResponse.json();

          for (const prereqStr of prereqCourses) {
            const prereqParsed = parseCourse(prereqStr);
            if (!prereqParsed) continue;

            const prereqId = `${prereqParsed.dept} ${prereqParsed.number}${prereqParsed.suffix}`;

            const existingLink = links.find(
              link => link.source === prereqId && link.target === courseId
            );

            if (!existingLink) {
              links.push({
                source: prereqId,
                target: courseId,
              });
            }

            await fetchPrerequisites(prereqStr, depth + 1);
          }
        }
      }
    }

    await fetchPrerequisites(startCourse);

    return new Response(
      JSON.stringify({ nodes, links }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Build tree error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to build prerequisite tree' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
