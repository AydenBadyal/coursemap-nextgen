import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LegendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendDialog = ({ isOpen, onClose }: LegendDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed left-4 top-24 bottom-4 w-72 bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Legend</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <div className="text-lg leading-none">&times;</div>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Node Colors</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary border-2 border-white flex-shrink-0" />
                <p className="text-sm">Searched course (red)</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-info border-2 border-white flex-shrink-0" />
                <p className="text-sm">Prerequisites (blue)</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Edge Types</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-0.5 bg-muted-foreground mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Solid line</p>
                  <p className="text-xs text-muted-foreground">AND - All required</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg width="24" height="4" className="mt-2 flex-shrink-0">
                  <line x1="0" y1="2" x2="24" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" className="text-muted-foreground" />
                </svg>
                <div>
                  <p className="text-sm font-medium">Dashed line</p>
                  <p className="text-xs text-muted-foreground">OR - One of these</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Interactions</h4>
            
            <div className="space-y-1.5 text-sm">
              <p><span className="font-medium">Click:</span> Show details</p>
              <p><span className="font-medium">Hover:</span> Highlight path</p>
              <p><span className="font-medium">Drag:</span> Move node</p>
              <p><span className="font-medium">Scroll:</span> Zoom</p>
              <p><span className="font-medium">⌘/Ctrl+F:</span> Search</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hover Colors</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-0.5 bg-info flex-shrink-0" />
                <p className="text-sm text-info">Blue - Unlocks</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-0.5 flex-shrink-0" style={{ backgroundColor: '#eab308' }} />
                <p className="text-sm" style={{ color: '#eab308' }}>Gold - Requires</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
