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
          <div className="space-y-3 text-base text-white">
            <p>• <span className="font-bold">Drag</span> nodes to inspect pathways. Click <span className="font-bold">Reset View</span> to recentre.</p>
            <p>• <span className="font-bold">Click</span> a course to open its SFU outline card.</p>
            <p>• <span className="font-bold">Ctrl+F / ⌘F</span> to quick search. Use ↑↓ arrow keys to navigate results.</p>
            <p>• <span className="font-bold">Scroll / pinch</span> anywhere to zoom in or out.</p>
            <p>• <span className="font-bold">Hover</span> a course to highlight its relationships.</p>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Color Legend</h4>
            
            <div className="space-y-3 text-base">
              <p>• <span className="font-bold text-red-400">Red node:</span> <span className="text-white">course you searched.</span></p>
              <p>• <span className="font-bold text-blue-400">Blue node:</span> <span className="text-white">prerequisite or dependent course.</span></p>
              <p>• <span className="font-bold text-blue-400">Blue edge:</span> <span className="text-white">course unlocked by the hovered node.</span></p>
              <p>• <span className="font-bold text-yellow-500">Gold edge:</span> <span className="text-white">requirement leading into the hovered node.</span></p>
              <p className="text-sm text-gray-400">• Details card keeps its course highlighted until you close it.</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Edge Types</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg width="40" height="4">
                    <line x1="0" y1="2" x2="40" y2="2" stroke="#9ca3af" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-300">Solid edge (AND)</p>
                  <p className="text-sm text-gray-400">All prerequisites connected with solid lines are required.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg width="40" height="4">
                    <line x1="0" y1="2" x2="40" y2="2" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,4" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-300">Dashed edge (OR)</p>
                  <p className="text-sm text-gray-400">Only one of the courses connected with dashed lines is required.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};