import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface CourseNode {
  id: string;
  title: string;
  dept: string;
  number: string;
  x?: number;
  y?: number;
  depth?: number;
  fx?: number | null;
  fy?: number | null;
}

interface CourseLink {
  source: string | CourseNode;
  target: string | CourseNode;
}

interface CourseGraphProps {
  data: {
    nodes: CourseNode[];
    links: CourseLink[];
  } | null;
  activeNodeId?: string | null;
  onNodeClick?: (node: CourseNode) => void;
}

export default function CourseGraph({ data, activeNodeId, onNodeClick }: CourseGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeNodeRef = useRef(activeNodeId || null);
  const highlightRef = useRef<((id: string | null) => void) | null>(null);
  const onNodeClickRef = useRef(onNodeClick);

  useEffect(() => {
    activeNodeRef.current = activeNodeId || null;
    if (typeof highlightRef.current === "function") {
      highlightRef.current(activeNodeRef.current);
    }
  }, [activeNodeId]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    if (!svgRef.current) return;

    if (!data || !data.nodes || data.nodes.length === 0) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const container = svgRef.current.parentElement;
    const bounds = container?.getBoundingClientRect();
    const width = bounds?.width || window.innerWidth || 1200;
    const height = bounds?.height || window.innerHeight || 800;

    const topMargin = 120;
    const bottomPadding = 48;
    const sidePadding = 80;
    const availableWidth = Math.max(width - sidePadding * 2, 1);
    const availableHeight = Math.max(height - topMargin - bottomPadding, 1);

    d3.select(svgRef.current).selectAll("*").remove();

    const nodes: CourseNode[] = data.nodes.map(d => ({ ...d }));
    const links: CourseLink[] = data.links.map(d => ({ ...d }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const validLinks = links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    const hasIncoming = new Set();
    validLinks.forEach(link => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      hasIncoming.add(source);
    });
    const rootNode = nodes.find(n => !hasIncoming.has(n.id)) || nodes[0];

    const depths = new Map();
    const queue: Array<{ id: string; depth: number }> = [{ id: rootNode.id, depth: 0 }];
    const visited = new Set();

    depths.set(rootNode.id, 0);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      validLinks.forEach(link => {
        const target = typeof link.target === 'object' ? link.target.id : link.target;
        const source = typeof link.source === 'object' ? link.source.id : link.source;

        if (target === id && !visited.has(source)) {
          const existingDepth = depths.get(source);
          const newDepth = depth + 1;

          if (existingDepth === undefined || newDepth < existingDepth) {
            depths.set(source, newDepth);
          }

          queue.push({ id: source, depth: newDepth });
        }
      });
    }

    nodes.forEach(node => {
      node.depth = depths.get(node.id) || 0;
    });

    const nodesByDepth = new Map<number, CourseNode[]>();
    nodes.forEach(node => {
      if (!nodesByDepth.has(node.depth!)) {
        nodesByDepth.set(node.depth!, []);
      }
      nodesByDepth.get(node.depth!)!.push(node);
    });

    const maxDepth = Math.max(...depths.values());
    const depthLevels = (maxDepth || 0) + 1;
    const verticalSpacing = depthLevels > 1 ? availableHeight / (depthLevels - 1) : 0;

    nodesByDepth.forEach((nodesAtDepth, depth) => {
      const horizontalSpacing = nodesAtDepth.length > 1 ? availableWidth / (nodesAtDepth.length - 1) : 0;
      nodesAtDepth.forEach((node, index) => {
        const targetX = nodesAtDepth.length > 1
          ? sidePadding + index * horizontalSpacing
          : sidePadding + availableWidth / 2;
        const depthOffset = depthLevels > 1 ? depth * verticalSpacing : availableHeight / 2;

        node.x = targetX;
        node.y = topMargin + depthOffset;
      });
    });

    const targetPositions = new Map();
    nodes.forEach(node => {
      targetPositions.set(node.id, { x: node.x, y: node.y });
    });

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "block");

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const fitGraphToView = (duration = 750) => {
      const graphBounds = g.node()?.getBBox();
      if (!graphBounds || !isFinite(graphBounds.width) || !isFinite(graphBounds.height)) {
        return;
      }

      const graphWidth = Math.max(graphBounds.width, 1);
      const graphHeight = Math.max(graphBounds.height, 1);

      const availableWidth = Math.max(width - sidePadding * 2, 1);
      const availableHeight = Math.max(height - topMargin - bottomPadding, 1);

      const rawScale = Math.min(availableWidth / graphWidth, availableHeight / graphHeight, 2.5);
      const scale = Math.min(Math.max(rawScale, 0.1), 3);

      const graphCenterX = graphBounds.x + graphWidth / 2;
      const graphCenterY = graphBounds.y + graphHeight / 2;

      const targetCenterX = width / 2;
      const targetCenterY = topMargin + availableHeight / 2;

      const translateX = targetCenterX - scale * graphCenterX;
      const translateY = targetCenterY - scale * graphCenterY;

      const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

      svg.transition().duration(duration).call(zoom.transform, transform);
    };

    let hasInitialFit = false;

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(validLinks)
        .id((d: any) => d.id)
        .distance(140)
        .strength(0.4))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("collision", d3.forceCollide().radius(45))
      .force("y", d3.forceY()
        .y((d: any) => targetPositions.get(d.id)?.y ?? (topMargin + availableHeight / 2))
        .strength(1.1))
      .force("x", d3.forceX()
        .x((d: any) => targetPositions.get(d.id)?.x ?? (width / 2))
        .strength(0.5));

    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 35)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "hsl(var(--primary))");

    const link = g.append("g")
      .selectAll("path")
      .data(validLinks)
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.4)
      .attr("marker-end", "url(#arrow)");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        if (typeof highlightRef.current === "function") {
          highlightRef.current(d.id);
        }
      })
      .on("mouseleave", function () {
        if (typeof highlightRef.current === "function") {
          highlightRef.current(activeNodeRef.current);
        }
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        const handler = onNodeClickRef.current;
        if (typeof handler === "function") {
          handler(d);
        }
      })
      .call(d3.drag<any, CourseNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", d => d.id === rootNode.id ? 35 : 25)
      .attr("fill", d => d.id === rootNode.id ? "hsl(var(--primary))" : "hsl(var(--accent))")
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 3);

    const label = node.append("text")
      .text(d => d.id)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", d => (d.id === rootNode.id ? 16 : 14))
      .attr("font-weight", "700")
      .attr("letter-spacing", "0.02em")
      .attr("fill", "hsl(var(--primary-foreground))")
      .attr("paint-order", "stroke")
      .attr("stroke", "hsl(var(--primary) / 0.3)")
      .attr("stroke-width", 2.5)
      .attr("pointer-events", "none");

    label.each(function (d) {
      const circleRadius = d.id === rootNode.id ? 35 : 25;
      const maxTextWidth = circleRadius * 1.65;
      const textElement = this as SVGTextElement;
      const textLength = textElement.getComputedTextLength();

      if (textLength > maxTextWidth) {
        const baseSize = d.id === rootNode.id ? 16 : 14;
        const adjustedSize = Math.max(9, Math.floor((maxTextWidth / textLength) * baseSize));
        d3.select(this).attr("font-size", adjustedSize);
      }
    });

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });

      node.attr("transform", d => `translate(${d.x},${d.y})`);

      if (!hasInitialFit) {
        hasInitialFit = true;
        fitGraphToView(600);
      }
    });

    simulation.on("end", () => {
      fitGraphToView();
    });

    const applyHighlight = (focusedId: string | null) => {
      if (!focusedId) {
        node.style("opacity", 1);
        link.style("opacity", 0.4)
          .attr("stroke", "hsl(var(--muted-foreground))")
          .attr("stroke-width", 2);
        return;
      }

      const connectedNodeIds = new Set([focusedId]);
      const outgoingEdges = new Set();
      const incomingEdges = new Set();

      validLinks.forEach(linkDatum => {
        const sourceId = typeof linkDatum.source === "object" ? linkDatum.source.id : linkDatum.source;
        const targetId = typeof linkDatum.target === "object" ? linkDatum.target.id : linkDatum.target;

        if (sourceId === focusedId) {
          outgoingEdges.add(linkDatum);
          connectedNodeIds.add(targetId);
        }

        if (targetId === focusedId) {
          incomingEdges.add(linkDatum);
          connectedNodeIds.add(sourceId);
        }
      });

      node.style("opacity", (n: CourseNode) => connectedNodeIds.has(n.id) ? 1 : 0.2);

      link
        .style("opacity", l => (outgoingEdges.has(l) || incomingEdges.has(l)) ? 1 : 0.1)
        .attr("stroke", l => {
          if (outgoingEdges.has(l)) return "hsl(var(--primary))";
          if (incomingEdges.has(l)) return "hsl(var(--accent))";
          return "hsl(var(--muted-foreground))";
        })
        .attr("stroke-width", l => (outgoingEdges.has(l) || incomingEdges.has(l)) ? 3 : 2);
    };

    highlightRef.current = applyHighlight;

    if (activeNodeRef.current) {
      applyHighlight(activeNodeRef.current);
    }

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
      highlightRef.current = null;
    };

  }, [data]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}
