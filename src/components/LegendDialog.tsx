import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LegendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendDialog = ({ isOpen, onClose }: LegendDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-24 bottom-4 w-80 bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">How to Explore</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold">•</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">Drag</span>
                <span className="text-sm text-muted-foreground"> nodes to inspect pathways. Click </span>
                <span className="font-semibold text-sm">Reset View</span>
                <span className="text-sm text-muted-foreground"> to recentre.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold">•</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">Click</span>
                <span className="text-sm text-muted-foreground"> a course to open its SFU outline card.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold">•</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">Ctrl+F / ⌘F</span>
                <span className="text-sm text-muted-foreground"> to quick search. Use </span>
                <span className="font-semibold text-sm">↑↓</span>
                <span className="text-sm text-muted-foreground"> arrow keys to navigate results.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold">•</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">Scroll / pinch</span>
                <span className="text-sm text-muted-foreground"> anywhere to zoom in or out.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold">•</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">Hover</span>
                <span className="text-sm text-muted-foreground"> a course to highlight its relationships.</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Color Legend</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary border-2 border-card flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-primary">Red node:</span>
                  <span className="text-sm text-muted-foreground"> course you searched.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-info border-2 border-card flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-info">Blue node:</span>
                  <span className="text-sm text-muted-foreground"> prerequisite or dependent course.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-0.5 bg-info flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-info">Blue edge:</span>
                  <span className="text-sm text-muted-foreground"> course unlocked by the hovered node.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-0.5 bg-yellow-500 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-yellow-500">Gold edge:</span>
                  <span className="text-sm text-muted-foreground"> requirement leading into the hovered node.</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic mt-4">
                • Details card keeps its course highlighted until you close it.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
