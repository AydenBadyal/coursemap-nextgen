-- Fix function search path by recreating with CASCADE
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
DROP FUNCTION IF EXISTS public.update_courses_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_courses_updated_at();