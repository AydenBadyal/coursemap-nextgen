import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { CourseSearch } from "@/components/CourseSearch";
import CourseGraph from "@/components/CourseGraph";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

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

interface GraphData {
  nodes: CourseNode[];
  links: CourseLink[];
}

const Index = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('build-tree', {
        body: { startCourse: searchValue.trim() },
      });

      if (error) throw error;

      if (data.nodes && data.links) {
        setGraphData(data);
        setSelectedNode(null);
        
        toast({
          title: "Success!",
          description: `Found ${data.nodes.length} courses in the prerequisite tree.`,
        });
      } else {
        toast({
          title: "No results",
          description: "No course data found. Please check the course code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching course tree:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (node: CourseNode) => {
    setSelectedNode(node.id);
    toast({
      title: node.id,
      description: node.title,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">
              Explore Course Prerequisites
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter any SFU course code to visualize its complete prerequisite tree. 
              See which courses you need to take before enrolling.
            </p>
          </div>

          <div className="flex justify-center">
            <CourseSearch
              value={searchValue}
              onChange={setSearchValue}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {!graphData ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">
                Search for a course to see its prerequisite tree
              </p>
            </Card>
          ) : (
            <div className="border rounded-lg bg-card overflow-hidden" style={{ height: '600px' }}>
              <CourseGraph 
                data={graphData}
                activeNodeId={selectedNode}
                onNodeClick={handleNodeClick}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
