import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CourseNode {
  id: string;
  title: string;
  dept: string;
  number: string;
  description?: string;
  units?: string;
  prerequisites?: string;
  corequisites?: string;
}

interface CourseDetailsDialogProps {
  course: CourseNode | null;
  onClose: () => void;
}

export const CourseDetailsDialog = ({ course, onClose }: CourseDetailsDialogProps) => {
  if (!course) return null;

  return (
    <div className="fixed left-4 top-20 bottom-4 w-96 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide">Course Spotlight</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-3 text-white">{course.id}</h2>
            <p className="text-lg text-gray-300 font-normal leading-relaxed">{course.title}</p>
          </div>

          {course.units && (
            <div className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded-full">
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">{course.units}</span>
            </div>
          )}

          {course.description && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{course.description}</p>
            </div>
          )}

          {course.prerequisites && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Prerequisites</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{course.prerequisites}</p>
            </div>
          )}

          {course.corequisites && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Corequisites</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{course.corequisites}</p>
            </div>
          )}

          {!course.description && !course.prerequisites && !course.corequisites && (
            <div className="text-sm text-gray-500 italic">
              No additional details available for this course.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};