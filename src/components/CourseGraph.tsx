import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';

interface CourseNode {
  id: string;
  title: string;
  dept: string;
  number: string;
}

interface CourseLink {
  source: string;
  target: string;
}

interface CourseGraphProps {
  nodes: CourseNode[];
  links: CourseLink[];
}

export const CourseGraph = ({ nodes: courseNodes, links }: CourseGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (!courseNodes.length) return;

    // Create a hierarchical layout
    const levelMap = new Map<string, number>();
    const processedNodes = new Set<string>();

    // Find root nodes (nodes with no incoming edges)
    const hasIncoming = new Set(links.map(l => l.target));
    const rootNodes = courseNodes.filter(n => !hasIncoming.has(n.id));

    // BFS to assign levels
    const queue: Array<{ id: string; level: number }> = rootNodes.map(n => ({ id: n.id, level: 0 }));
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      if (processedNodes.has(id)) continue;
      processedNodes.add(id);
      
      levelMap.set(id, level);
      
      const outgoing = links.filter(l => l.source === id);
      outgoing.forEach(link => {
        if (!processedNodes.has(link.target)) {
          queue.push({ id: link.target, level: level + 1 });
        }
      });
    }

    // Group nodes by level
    const levelGroups = new Map<number, CourseNode[]>();
    courseNodes.forEach(node => {
      const level = levelMap.get(node.id) ?? 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    // Position nodes
    const flowNodes: Node[] = [];
    const horizontalSpacing = 300;
    const verticalSpacing = 150;

    levelGroups.forEach((nodesInLevel, level) => {
      nodesInLevel.forEach((node, index) => {
        const yOffset = (index - (nodesInLevel.length - 1) / 2) * verticalSpacing;
        
        flowNodes.push({
          id: node.id,
          data: { 
            label: (
              <div className="text-center px-4 py-2">
                <div className="font-semibold text-sm">{node.id}</div>
                <div className="text-xs text-muted-foreground mt-1">{node.title}</div>
              </div>
            )
          },
          position: { x: level * horizontalSpacing, y: yOffset },
          style: {
            background: 'hsl(var(--card))',
            border: '2px solid hsl(var(--primary))',
            borderRadius: '8px',
            fontSize: '12px',
            width: 200,
          },
        });
      });
    });

    const flowEdges: Edge[] = links.map((link, index) => ({
      id: `e${index}`,
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary))',
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [courseNodes, links, setNodes, setEdges]);

  if (!courseNodes.length) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>No course data to display. Search for a course to see its prerequisite tree.</p>
      </Card>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg bg-card overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => 'hsl(var(--primary))'}
          maskColor="hsl(var(--muted) / 0.3)"
        />
      </ReactFlow>
    </div>
  );
};
