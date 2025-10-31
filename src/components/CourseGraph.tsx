import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  onResetView?: () => void;
}

export const CourseGraph = ({ nodes: courseNodes, links, onResetView }: CourseGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<CourseNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<CourseNode | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const zoomBehaviorRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔔 Selected node state:', selectedNode);
  }, [selectedNode]);

  const resetView = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    
    // Call the parent's reset handler if provided
    if (onResetView) {
      onResetView();
    }
  }, [onResetView]);

  useEffect(() => {
    if (!svgRef.current || !courseNodes.length || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    d3.select(svgRef.current).selectAll('*').remove();

    const nodes = courseNodes.map(d => ({ ...d }));
    const validLinks = links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodes.some(n => n.id === sourceId) && nodes.some(n => n.id === targetId);
    });

    const sourceIds = new Set(validLinks.map(l => 
      typeof l.source === 'object' ? l.source.id : l.source
    ));
    const rootNode = nodes.find(n => !sourceIds.has(n.id)) || nodes[0];

    const depths = new Map<string, number>();
    const queue: Array<{ id: string; depth: number }> = [{ id: rootNode.id, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      depths.set(id, depth);

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

    depthGroups.forEach((nodesAtDepth, depth) => {
      nodesAtDepth.sort((a, b) => a.id.localeCompare(b.id));
      const horizontalSpacing = width / (nodesAtDepth.length + 1);
      nodesAtDepth.forEach((node, index) => {
        node.x = (index + 1) * horizontalSpacing;
        node.y = (maxDepth - depth + 1) * verticalSpacing;
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

    const defs = svg.append('defs');
    
    ['default', 'blue', 'gold'].forEach((type) => {
      const color = type === 'blue' ? 'hsl(var(--info))' : type === 'gold' ? '#eab308' : 'hsl(var(--muted-foreground))';
      defs.append('marker')
        .attr('id', `arrowhead-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

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

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'graph-node')
      .attr('cursor', 'pointer');

    node.append('circle')
      .attr('r', d => d.id === rootNode.id ? 35 : 25)
      .attr('fill', d => d.id === rootNode.id ? 'hsl(var(--primary))' : 'hsl(var(--info))')
      .attr('stroke', 'hsl(var(--card))')
      .attr('stroke-width', 3);

    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => d.id === rootNode.id ? 13 : 11)
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    const updatePositions = () => {
      link.attr('d', (d: any) => {
        const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
        const x1 = source?.x ?? 0;
        const y1 = source?.y ?? 0;
        const x2 = target?.x ?? 0;
        const y2 = target?.y ?? 0;
        return `M${x1},${y1} C ${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
      });

      node.attr('transform', (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    };

    const applyHighlight = (focusedId: string | null) => {
      if (!focusedId) {
        node.style('opacity', 1);
        link
          .style('opacity', 0.6)
          .attr('stroke', 'hsl(var(--muted-foreground))')
          .attr('stroke-width', 2)
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
        .attr('marker-end', (l: any) => {
          if (outgoingEdges.has(l)) return 'url(#arrowhead-blue)';
          if (incomingEdges.has(l)) return 'url(#arrowhead-gold)';
          return 'url(#arrowhead-default)';
        });
    };

    let dragStartX = 0;
    let dragStartY = 0;
    let dragMoved = false;

    node.call(d3.drag<any, CourseNode>()
      .on('start', function(event) {
        dragStartX = event.x;
        dragStartY = event.y;
        dragMoved = false;
        d3.select(this).raise();
      })
      .on('drag', function(event, d) {
        const dx = Math.abs(event.x - dragStartX);
        const dy = Math.abs(event.y - dragStartY);
        if (dx > 5 || dy > 5) {
          dragMoved = true;
        }
        d.x = event.x;
        d.y = event.y;
        updatePositions();
      })
      .on('end', function(event, d) {
        if (!dragMoved) {
          console.log('🎯 CLICK DETECTED on:', d.id);
          setSelectedNode(d);
        }
      }));

    node
      .on('mouseenter', function(event, d) {
        if (!selectedNode) {
          setHoveredNode(d);
        }
      })
      .on('mouseleave', function() {
        if (!selectedNode) {
          setHoveredNode(null);
          // Immediately reset the view
          node.style('opacity', 1);
          link
            .style('opacity', 0.6)
            .attr('stroke', 'hsl(var(--muted-foreground))')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead-default)');
        }
      });

    updatePositions();
    
    if (selectedNode) {
      applyHighlight(selectedNode.id);
    } else if (hoveredNode) {
      applyHighlight(hoveredNode.id);
    } else {
      applyHighlight(null);
    }

  }, [courseNodes, links, selectedNode, hoveredNode]);

  // Expose resetView to parent via a custom event
  useEffect(() => {
    // Store the reset function on the window for the Navbar to call
    (window as any).courseGraphResetView = resetView;
    
    return () => {
      delete (window as any).courseGraphResetView;
    };
  }, [resetView]);

  if (!courseNodes.length) {
    return null;
  }

  return (
    <>
      <div className="relative">
        {/* Legend button on the right */}
        <div className="absolute top-4 right-4 z-10">
          <Button onClick={() => setShowLegend(!showLegend)} variant="secondary" size="sm">
            <Info className="h-4 w-4 mr-2" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </Button>
        </div>
        
        <div ref={containerRef} className="h-[calc(100vh-140px)] w-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </div>

      {/* Course Details Dialog - Left side */}
      {selectedNode && (
        <div className="fixed left-4 top-20 bottom-4 w-96 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide">Course Spotlight</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                console.log('❌ Closing dialog');
                setSelectedNode(null);
              }} 
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-3 text-white">{selectedNode.id}</h2>
                <p className="text-lg text-gray-300 font-normal leading-relaxed">{selectedNode.title}</p>
              </div>

              {selectedNode.units && (
                <div className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded-full">
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">{selectedNode.units}</span>
                </div>
              )}

              {selectedNode.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedNode.description}</p>
                </div>
              )}

              {selectedNode.prerequisites && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Prerequisites</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{selectedNode.prerequisites}</p>
                </div>
              )}

              {selectedNode.corequisites && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Corequisites</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{selectedNode.corequisites}</p>
                </div>
              )}

              {!selectedNode.description && !selectedNode.prerequisites && !selectedNode.corequisites && (
                <div className="text-sm text-gray-500 italic">
                  No additional details available for this course.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Legend Dialog - Right side */}
      {showLegend && (
        <div className="fixed right-4 top-20 bottom-4 w-96 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide">How to Explore</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLegend(false)} 
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div className="space-y-3 text-sm text-gray-300">
                <p>• <span className="font-semibold text-white">Click</span> a course to open its details card.</p>
                <p>• <span className="font-semibold text-white">Drag</span> nodes to reposition them.</p>
                <p>• <span className="font-semibold text-white">Scroll</span> to zoom in or out.</p>
                <p>• <span className="font-semibold text-white">Hover</span> to highlight relationships.</p>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Color Legend</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Red node: course you searched</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-400">Blue node: prerequisites</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
};