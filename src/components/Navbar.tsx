import sfuLogo from "@/assets/sfu-logo.png";
import { CourseSearch } from "./CourseSearch";

interface NavbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  isLoading?: boolean;
  showSearch?: boolean;
}

export const Navbar = ({ searchValue = "", onSearchChange, onSearch, isLoading = false, showSearch = false }: NavbarProps) => {
  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={sfuLogo} alt="SFU Logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold">Course Map</h1>
            <p className="text-xs text-muted-foreground">CMPT 225, CMPT271...</p>
          </div>
        </div>

        {showSearch && onSearchChange && onSearch && (
          <div className="flex-1 max-w-md">
            <CourseSearch
              value={searchValue}
              onChange={onSearchChange}
              onSearch={onSearch}
              isLoading={isLoading}
            />
          </div>
        )}

        <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          RESET VIEW
        </button>
      </div>
    </nav>
  );
};