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
    <div className="fixed right-4 top-24 bottom-4 w-80 bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Course Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{course.id}</h2>
            <p className="text-base text-foreground font-medium">{course.title}</p>
          </div>

          {course.units && (
            <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">{course.units}</span>
            </div>
          )}

          {course.description && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Overview</h4>
              <p className="text-sm text-foreground leading-relaxed">{course.description}</p>
            </div>
          )}

          {course.prerequisites && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prerequisites</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{course.prerequisites}</p>
            </div>
          )}

          {course.corequisites && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Corequisites</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{course.corequisites}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
