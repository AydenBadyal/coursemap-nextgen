import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CourseDetailsDialog } from './CourseDetailsDialog';
import { LegendDialog } from './LegendDialog';
import { QuickSearchDialog } from './QuickSearchDialog';
import { Info } from 'lucide-react';

interface CourseNode {
  id: string;
  title: string;
  dept: string;
  number: string;
  description?: string;
  units?: string;
  prerequisites?: string;
  corequisites?: string;
  x?: number;
  y?: number;
  depth?: number;
}

interface CourseLink {
  source: string | CourseNode;
  target: string | CourseNode;
  type?: 'AND' | 'OR';
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
  const [showLegend, setShowLegend] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const zoomBehaviorRef = useRef<any>(null);

  const resetView = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  const zoomToNode = useCallback((nodeId: string) => {
    if (!svgRef.current || !courseNodes.length) return;

    const node = courseNodes.find(n => n.id === nodeId);
    if (!node || !node.x || !node.y) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scale = 1.5;
    const x = width / 2 - node.x * scale;
    const y = height / 2 - node.y * scale;

    svg.transition()
      .duration(750)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(x, y).scale(scale)
      );

    // Show the course details when zooming from search
    setSelectedNode(node);
  }, [courseNodes]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowQuickSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

    // Find root node (the searched course - sink with no outgoing edges as source)
    const sourceIds = new Set(validLinks.map(l => 
      typeof l.source === 'object' ? l.source.id : l.source
    ));
    const rootNode = nodes.find(n => !sourceIds.has(n.id)) || nodes[0];

    // Assign depths using BFS from root
    const depths = new Map<string, number>();
    const queue: Array<{ id: string; depth: number }> = [{ id: rootNode.id, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      depths.set(id, depth);

      // Find prerequisites (sources pointing to this node)
      validLinks.forEach(link => {
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        
        if (targetId === id && !visited.has(sourceId)) {
          queue.push({ id: sourceId, depth: depth + 1 });
        }
      });
    }

    nodes.forEach(node => {
      node.depth = depths.get(node.id) ?? 0;
    });

    // Group nodes by depth for hierarchical layout
    const depthGroups = new Map<number, CourseNode[]>();
    nodes.forEach(node => {
      const depth = node.depth ?? 0;
      if (!depthGroups.has(depth)) {
        depthGroups.set(depth, []);
      }
      depthGroups.get(depth)!.push(node);
    });

    const maxDepth = Math.max(...Array.from(depthGroups.keys()));
    const verticalSpacing = height / (maxDepth + 2);

    // Position nodes hierarchically
    depthGroups.forEach((nodesAtDepth, depth) => {
      nodesAtDepth.sort((a, b) => a.id.localeCompare(b.id));
      const horizontalSpacing = width / (nodesAtDepth.length + 1);
      nodesAtDepth.forEach((node, index) => {
        node.x = (index + 1) * horizontalSpacing;
        node.y = (maxDepth - depth + 1) * verticalSpacing; // Reverse so root is at top
      });
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
    zoomBehaviorRef.current = zoom;

    // Create arrow markers
    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrowhead-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'hsl(var(--muted-foreground))');

    defs.append('marker')
      .attr('id', 'arrowhead-blue')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'hsl(var(--info))');

    defs.append('marker')
      .attr('id', 'arrowhead-gold')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#eab308');

    // Create links (curved paths)
    const link = g.append('g')
      .selectAll('path')
      .data(validLinks as any)
      .join('path')
      .attr('class', 'graph-link')
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--muted-foreground))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (l: any) => (l.type === 'OR' ? '6,4' : null))
      .attr('marker-end', 'url(#arrowhead-default)');

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'graph-node')
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
      .attr('font-size', d => d.id === rootNode.id ? 13 : 11)
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    // Position elements
    const updatePositions = () => {
      link
        .attr('d', (d: any) => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
          const x1 = source?.x ?? 0;
          const y1 = source?.y ?? 0;
          const x2 = target?.x ?? 0;
          const y2 = target?.y ?? 0;
          // Smooth vertical curve
          return `M${x1},${y1} C ${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
        });

      node.attr('transform', (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    };

    updatePositions();

    // Highlight logic
    const applyHighlight = (focusedId: string | null) => {
      if (!focusedId) {
        node.style('opacity', 1);
        link
          .style('opacity', 0.6)
          .attr('stroke', 'hsl(var(--muted-foreground))')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', (l: any) => (l.type === 'OR' ? '6,4' : null))
          .attr('marker-end', 'url(#arrowhead-default)');
        return;
      }

      const connectedNodeIds = new Set([focusedId]);
      const outgoingEdges = new Set();
      const incomingEdges = new Set();

      validLinks.forEach(linkDatum => {
        const sourceId = typeof linkDatum.source === 'object' ? linkDatum.source.id : linkDatum.source;
        const targetId = typeof linkDatum.target === 'object' ? linkDatum.target.id : linkDatum.target;

        if (sourceId === focusedId) {
          outgoingEdges.add(linkDatum);
          connectedNodeIds.add(targetId);
        }

        if (targetId === focusedId) {
          incomingEdges.add(linkDatum);
          connectedNodeIds.add(sourceId);
        }
      });

      node.style('opacity', (n: any) => connectedNodeIds.has(n.id) ? 1 : 0.2);

      link
        .style('opacity', (l: any) => (outgoingEdges.has(l) || incomingEdges.has(l)) ? 1 : 0.1)
        .attr('stroke', (l: any) => {
          if (outgoingEdges.has(l)) return 'hsl(var(--info))';
          if (incomingEdges.has(l)) return '#eab308';
          return 'hsl(var(--muted-foreground))';
        })
        .attr('stroke-width', (l: any) => (outgoingEdges.has(l) || incomingEdges.has(l)) ? 3 : 2)
        .attr('stroke-dasharray', (l: any) => (l.type === 'OR' ? '6,4' : null))
        .attr('marker-end', (l: any) => {
          if (outgoingEdges.has(l)) return 'url(#arrowhead-blue)';
          if (incomingEdges.has(l)) return 'url(#arrowhead-gold)';
          return 'url(#arrowhead-default)';
        });
    };

    // Apply highlight on hover/select
    if (selectedNode) {
      applyHighlight(selectedNode.id);
    } else if (hoveredNode) {
      applyHighlight(hoveredNode.id);
    }

    function dragstarted(event: any) {
      d3.select(event.sourceEvent.target.parentNode).raise();
    }

    function dragged(event: any, d: CourseNode) {
      d.x = event.x;
      d.y = event.y;
      updatePositions();
    }

    function dragended() {
      // Nothing needed here for static layout
    }

    return () => {
      // Cleanup
    };
  }, [courseNodes, links, selectedNode, hoveredNode]);

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
    <>
      <div className="relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button onClick={() => setShowLegend(!showLegend)} variant="secondary" size="sm">
            <Info className="h-4 w-4 mr-2" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </Button>
          <Button onClick={resetView} variant="secondary" size="sm">
            Reset View
          </Button>
        </div>
        
        <div ref={containerRef} className="h-[calc(100vh-200px)] w-full border rounded-lg overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </div>

      <CourseDetailsDialog 
        course={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />

      <LegendDialog 
        isOpen={showLegend} 
        onClose={() => setShowLegend(false)} 
      />

      <QuickSearchDialog
        isOpen={showQuickSearch}
        nodes={courseNodes}
        onClose={() => setShowQuickSearch(false)}
        onSelectCourse={zoomToNode}
      />
    </>
  );
};
