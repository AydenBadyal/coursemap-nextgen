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
    console.log('Building tree for course:', startCourse);
    
    const nodes: Node[] = [];
    const links: Link[] = [];
    const visited = new Set<string>();
    const nodeMap = new Map<string, boolean>();

    function parseCourse(courseStr: string) {
      const match = courseStr.trim().match(/([A-Z]+)\s*(\d+)([A-Z]*)/i);
      if (!match) return null;
      return { 
        dept: match[1].toUpperCase(), 
        number: match[2],
        suffix: match[3] ? match[3].toUpperCase() : ''
      };
    }

    function parsePrerequisites(prerequisiteText: string): string[] {
      if (!prerequisiteText || typeof prerequisiteText !== 'string') {
        return [];
      }

      const coursePattern = /\b([A-Z]{2,5})\s*(\d{3,4})([A-Z]{0,2})\b/gi;
      const matches = [...prerequisiteText.matchAll(coursePattern)];

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

      return Array.from(coursesSet);
    }

    async function fetchPrerequisites(courseStr: string, depth = 0): Promise<void> {
      if (depth > 5) {
        console.log('Max depth reached for:', courseStr);
        return;
      }
      if (visited.has(courseStr)) {
        console.log('Already visited:', courseStr);
        return;
      }
      
      visited.add(courseStr);
      
      const parsed = parseCourse(courseStr);
      if (!parsed) {
        console.log('Failed to parse course:', courseStr);
        return;
      }
      
      // Skip CMPT 300 specifically
      if (parsed.dept === "CMPT" && parsed.number === "300") {
        console.log('Skipping CMPT 300');
        return;
      }

      console.log(`Fetching course data for: ${parsed.dept} ${parsed.number}${parsed.suffix}`);
      
      // Fetch course data from SFU API
      const courseResponse = await fetch(
        `https://api.sfucourses.com/v1/rest/outlines?dept=${parsed.dept}&number=${parsed.number}${parsed.suffix}`
      );

      if (!courseResponse.ok) {
        console.log(`SFU API error for ${parsed.dept} ${parsed.number}: ${courseResponse.status}`);
        return;
      }

      const courseData = await courseResponse.json();
      if (!courseData || courseData.length === 0) {
        console.log('No course data found for:', courseStr);
        return;
      }

      const course = courseData[0];
      const courseId = `${course.dept} ${course.number}`;

      if (!nodeMap.has(courseId)) {
        console.log('Adding node:', courseId);
        nodes.push({
          id: courseId,
          title: course.title,
          dept: course.dept,
          number: course.number,
        });
        nodeMap.set(courseId, true);
      }

      if (course.prerequisites && course.prerequisites.trim()) {
        console.log(`Parsing prerequisites for ${courseId}:`, course.prerequisites);
        const prereqCourses = parsePrerequisites(course.prerequisites);
        console.log('Found prerequisites:', prereqCourses);

        for (const prereqStr of prereqCourses) {
          const prereqParsed = parseCourse(prereqStr);
          if (!prereqParsed) continue;

          const prereqId = `${prereqParsed.dept} ${prereqParsed.number}${prereqParsed.suffix}`;

          const existingLink = links.find(
            link => link.source === prereqId && link.target === courseId
          );

          if (!existingLink) {
            console.log(`Adding link: ${prereqId} -> ${courseId}`);
            links.push({
              source: prereqId,
              target: courseId,
            });
          }

          await fetchPrerequisites(prereqStr, depth + 1);
        }
      }
    }

    await fetchPrerequisites(startCourse);

    console.log(`Tree built successfully. Nodes: ${nodes.length}, Links: ${links.length}`);

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
