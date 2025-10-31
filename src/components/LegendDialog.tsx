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
              • <span className="font-semibold text-white">Click</span> a course node to view its full details on the right side.
            </p>
            <p>
              • <span className="font-semibold text-white">Drag</span> nodes around to explore different pathways and reorganize the view.
            </p>
            <p>
              • <span className="font-semibold text-white">Hover</span> over a course to temporarily highlight all its prerequisites (incoming) and unlocked courses (outgoing).
            </p>
            <p>
              • <span className="font-semibold text-white">Scroll / pinch</span> anywhere to zoom in or out of the graph.
            </p>
            <p>
              • <span className="font-semibold text-white">Pan/drag background</span> to move around the graph view.
            </p>
            <p>
              • <span className="font-semibold text-white">Ctrl+F / ⌘F</span> opens quick search. Type to find courses, use ↑↓ arrows to navigate, Enter to jump to a course and view its details.
            </p>
            <p>
              • <span className="font-semibold text-white">Reset View</span> button in the navbar returns the graph to its original position and zoom level.
            </p>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Node Colors</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Red node</p>
                  <p className="text-xs text-gray-400">The course you searched for (root of the tree). This is your target course and all other courses shown are its prerequisites.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Blue nodes</p>
                  <p className="text-xs text-gray-400">Prerequisites and related courses in the tree. These must be completed before taking the red course.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Edge Types (Prerequisite Logic)</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="32" height="4">
                    <line x1="0" y1="2" x2="32" y2="2" stroke="#9ca3af" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Solid edge (AND)</p>
                  <p className="text-xs text-gray-400">All prerequisites connected with solid lines are required. You must complete ALL of them to proceed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="32" height="4">
                    <line x1="0" y1="2" x2="32" y2="2" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Dashed edge (OR)</p>
                  <p className="text-xs text-gray-400">Only one of the courses connected with dashed lines is required. Choose any one from the group to satisfy the prerequisite.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Hover Highlight Colors</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="32" height="4">
                    <line x1="0" y1="2" x2="32" y2="2" stroke="#3b82f6" strokeWidth="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-400">Blue edges (outgoing)</p>
                  <p className="text-xs text-gray-400">Shows courses that this prerequisite unlocks. These are the courses you can take AFTER completing the hovered course.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="32" height="4">
                    <line x1="0" y1="2" x2="32" y2="2" stroke="#eab308" strokeWidth="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-500">Gold edges (incoming)</p>
                  <p className="text-xs text-gray-400">Shows prerequisites required for the hovered course. These are the courses you must complete BEFORE taking the hovered course.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Understanding the Tree Structure</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• The tree flows from bottom to top: prerequisites at the bottom, target course at the top.</p>
              <p>• Arrows point from prerequisites TO the courses they unlock.</p>
              <p>• The depth of a node indicates how many prerequisite layers exist between it and the target course.</p>
              <p>• Nodes at the same horizontal level are at the same depth in the prerequisite chain.</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Interaction Behavior</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• <span className="font-medium text-white">Clicking a course:</span> Opens the details panel on the right and keeps the highlight active until you close the panel.</p>
              <p>• <span className="font-medium text-white">Hovering a course:</span> Temporarily highlights relationships. Unhovering returns the view to normal (or to the clicked course's highlight if one is selected).</p>
              <p>• <span className="font-medium text-white">Dragging nodes:</span> Repositions them for better visibility. The layout is flexible and won't snap back.</p>
              <p>• <span className="font-medium text-white">Zooming:</span> Use scroll wheel or pinch gesture to zoom in/out. The zoom is centered on your cursor position.</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Course Information</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• Click any node to see the full course title, description, units, prerequisites text, and corequisites.</p>
              <p>• Use quick search (Ctrl+F / ⌘F) to find specific courses by code and automatically zoom to them.</p>
              <p>• The details panel shows comprehensive information pulled from the SFU course catalog.</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};