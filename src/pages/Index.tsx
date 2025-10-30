import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { CourseSearch } from "@/components/CourseSearch";
import { CourseGraph } from "@/components/CourseGraph";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const Index = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes] = useState<CourseNode[]>([]);
  const [links, setLinks] = useState<CourseLink[]>([]);
  const { toast } = useToast();

  const hasSearched = nodes.length > 0;

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('build-tree', {
        body: { startCourse: searchValue.trim() },
      });

      if (error) throw error;

      if (data.nodes && data.links) {
        setNodes(data.nodes);
        setLinks(data.links);
        
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        isLoading={isLoading}
        showSearch={hasSearched}
      />
      
      {!hasSearched ? (
        // Welcome screen - centered
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="max-w-3xl w-full px-4 space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">Welcome to SFU Course Map</h1>
              <p className="text-lg text-muted-foreground">
                Type any course code in the search bar above to explore prerequisites and dependencies
              </p>
              <p className="text-sm text-muted-foreground">
                Try: <span className="font-mono font-semibold">CMPT 225</span>, <span className="font-mono font-semibold">MACM 101</span>, <span className="font-mono font-semibold">MATH 152</span>
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
          </div>
        </main>
      ) : (
        // Graph view
        <main className="container mx-auto px-4 py-6">
          <CourseGraph nodes={nodes} links={links} />
        </main>
      )}
    </div>
  );
};

export default Index;