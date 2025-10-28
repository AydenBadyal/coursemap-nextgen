import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CourseSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export const CourseSearch = ({ value, onChange, onSearch, isLoading }: CourseSearchProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2 w-full max-w-md">
      <Input
        placeholder="Enter course code (e.g., CMPT 225)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1"
        disabled={isLoading}
      />
      <Button 
        onClick={onSearch} 
        disabled={isLoading || !value.trim()}
        className="gap-2"
      >
        <Search className="h-4 w-4" />
        {isLoading ? 'Loading...' : 'Search'}
      </Button>
    </div>
  );
};
