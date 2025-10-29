import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CourseNode {
  id: string;
  title: string;
  dept: string;
  number: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface CourseLink {
  source: string | CourseNode;
  target: string | CourseNode;
}

interface CourseGraphProps {
  nodes: CourseNode[];
  links: CourseLink[];
}

export const CourseGraph = ({ nodes: courseNodes, links }: CourseGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<CourseNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<CourseNode | null>(null);

  const resetView = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    
    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
  }, []);

  useEffect(() => {
    if (!svgRef.current || !courseNodes.length || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const nodes = courseNodes.map(d => ({ ...d }));
    const validLinks = links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodes.some(n => n.id === sourceId) && nodes.some(n => n.id === targetId);
    });

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'hsl(var(--muted-foreground))');

    // Find root node (node with no incoming edges)
    const hasIncoming = new Set(validLinks.map(l => 
      typeof l.target === 'object' ? l.target.id : l.target
    ));
    const rootNode = nodes.find(n => !hasIncoming.has(n.id)) || nodes[0];

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(validLinks)
        .id((d: any) => d.id)
        .distance(150)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('collision', d3.forceCollide().radius(50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(validLinks)
      .join('line')
      .attr('stroke', 'hsl(var(--muted-foreground))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null))
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .call(d3.drag<any, CourseNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles
    node.append('circle')
      .attr('r', d => d.id === rootNode.id ? 35 : 25)
      .attr('fill', d => d.id === rootNode.id ? 'hsl(var(--primary))' : 'hsl(var(--info))')
      .attr('stroke', 'hsl(var(--card))')
      .attr('stroke-width', 3);

    // Add labels
    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => d.id === rootNode.id ? 14 : 12)
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: CourseNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: CourseNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: CourseNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [courseNodes, links]);

  if (!courseNodes.length) {
    return (
      <Card className="p-12 text-center border-muted">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Welcome to SFU Course Map</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Type any course code in the search bar above to explore prerequisites and dependencies
          </p>
          <p className="text-sm text-muted-foreground">
            Try: <span className="font-mono font-semibold">CMPT 225</span>, <span className="font-mono font-semibold">MACM 101</span>, <span className="font-mono font-semibold">MATH 152</span>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={resetView} variant="secondary" size="sm">
          Reset View
        </Button>
      </div>
      
      <div ref={containerRef} className="h-[calc(100vh-200px)] w-full border rounded-lg bg-card overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {(selectedNode || hoveredNode) && (
        <Card className="absolute bottom-4 left-4 p-4 max-w-md border-primary/50 bg-card/95 backdrop-blur">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-primary">
                {(selectedNode || hoveredNode)?.id}
              </span>
            </div>
            <p className="text-sm text-foreground">
              {(selectedNode || hoveredNode)?.title}
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">Department:</span>
              <span>{(selectedNode || hoveredNode)?.dept}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
