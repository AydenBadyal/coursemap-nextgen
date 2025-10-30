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
    <div className="fixed left-4 bottom-4 w-96 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide">How to Explore</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              • <span className="font-semibold text-white">Drag</span> nodes to inspect pathways. 
              Click <span className="font-semibold text-white">Reset View</span> to recentre.
            </p>
            <p>
              • <span className="font-semibold text-white">Click</span> a course to open its SFU outline card.
            </p>
            <p>
              • <span className="font-semibold text-white">Ctrl+F / ⌘F</span> to quick search. Use ↑↓ arrow keys to navigate results.
            </p>
            <p>
              • <span className="font-semibold text-white">Scroll / pinch</span> anywhere to zoom in or out.
            </p>
            <p>
              • <span className="font-semibold text-white">Hover</span> a course to highlight its relationships.
            </p>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Color Legend</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Red node:</p>
                  <p className="text-xs text-gray-400">course you searched.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Blue node:</p>
                  <p className="text-xs text-gray-400">prerequisite or dependent course.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="24" height="4">
                    <line x1="0" y1="2" x2="24" y2="2" stroke="#3b82f6" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-400">Blue edge:</p>
                  <p className="text-xs text-gray-400">course unlocked by the hovered node.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="24" height="4">
                    <line x1="0" y1="2" x2="24" y2="2" stroke="#eab308" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-500">Gold edge:</p>
                  <p className="text-xs text-gray-400">requirement leading into the hovered node.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
            • Details card keeps its course highlighted until you close it.
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};