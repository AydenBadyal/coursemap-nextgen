import { useEffect, useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CourseNode {
  id: string;
  title: string;
  dept: string;
  number: string;
}

interface QuickSearchDialogProps {
  isOpen: boolean;
  nodes: CourseNode[];
  onClose: () => void;
  onSelectCourse: (courseId: string) => void;
}

export const QuickSearchDialog = ({ isOpen, nodes, onClose, onSelectCourse }: QuickSearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredNodes = nodes.filter(node => 
    node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredNodes[selectedIndex]) {
        e.preventDefault();
        onSelectCourse(filteredNodes[selectedIndex].id);
        onClose();
        setSearchTerm('');
      } else if (e.key === 'Escape') {
        onClose();
        setSearchTerm('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredNodes, selectedIndex, onSelectCourse, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Quick search courses... (use ↑↓ to navigate, Enter to select)"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <ScrollArea className="max-h-96">
          <div className="p-2">
            {filteredNodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No courses found
              </div>
            ) : (
              filteredNodes.map((node, index) => (
                <button
                  key={node.id}
                  onClick={() => {
                    onSelectCourse(node.id);
                    onClose();
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="font-mono font-semibold text-sm">{node.id}</div>
                  <div className="text-xs text-muted-foreground mt-1">{node.title}</div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};
