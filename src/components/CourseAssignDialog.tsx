import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import CourseLessonsSection, { Lesson } from "./course/CourseLessonsSection";
import { Settings,  Layers, Plus } from "lucide-react";
import { Calendar1, Clock, BookOpen, GripVertical, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getSystemDefaults,
  getDisabledDatesForCalendar,
  isDateBlocked,
  clearSystemCache,
  generatePhysicalSchedulesFromPattern,
  updatePhysicalSchedules
} from "@/utils/scheduleUtils"; // עדכן את הנתיב לפי המיקום הנכון
import { Switch } from "@radix-ui/react-switch";
import { useAuth } from "./auth/AuthProvider";

// --- Interfaces ---
interface Institution {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  full_name: string;
}

interface TimeSlot {
  day: number;
  start_time: string;
  end_time: string;
  [key: string]: Json | undefined;
}

interface CourseInstanceSchedule {
  days_of_week: number[];
  time_slots: TimeSlot[];
  total_lessons?: number;
  lesson_duration_minutes?: number;
}

interface EditData {
  instance_id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_for_customer: number;
  price_for_instructor: number;
  institution_name: string;
  instructor_name: string;
  start_date: string;
  approx_end_date: string;
}

interface CourseAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  courseId?: string;
  courseName?: string;
  instanceId?: string;
  editData?: EditData;
  onAssignmentComplete: () => void;
}

// --- Helper Functions ---
const formatDate = (date: Date, formatString: string) => {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  if (formatString === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (formatString === "dd/MM") return `${day}/${month}`;
  return d.toLocaleDateString();
};

const getInitialState = () => ({
  formData: {
    institution_id: "",
    instructor_id: "",
    grade_level: "",
    price_for_customer: "",
    price_for_instructor: "",
    max_participants: "",
    start_date: "",
    end_date: "",
  },
  courseSchedule: {
    days_of_week: [],
    time_slots: [],
    total_lessons: 1,
    lesson_duration_minutes: 45,
    task_duration_minutes: 25,
  },
  instanceLessons: [],
  hasCustomLessons: false,
});


// --- Main Component ---
const CourseAssignDialog = ({
  open,
  onOpenChange,
  mode = 'create',
  courseId,
  courseName,
  instanceId,
  editData,
  onAssignmentComplete,
}: CourseAssignDialogProps) => {
  const { toast } = useToast();
  
  // --- States ---
  const {user}=useAuth();
  const isAdmin = ['admin'].includes(user?.user_metadata?.role);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialState().formData);
  const [showCustomLessonsDialog, setShowCustomLessonsDialog] = useState(false);
  const [templateLessons, setTemplateLessons] = useState<Lesson[]>([]);
  const [instanceLessons, setInstanceLessons] = useState<any[]>([]);
  const [hasCustomLessons, setHasCustomLessons] = useState(false);
  const [courseSchedule, setCourseSchedule] = useState(getInitialState().courseSchedule);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
const [systemDefaults, setSystemDefaults] = useState<any>(null);
const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);
const [draggedLessonIndex, setDraggedLessonIndex] = useState<number | null>(null);
const [lessonSource, setLessonSource] = useState<'none' | 'template' | 'scratch'>('none');
const [lessonMode, setLessonMode] = useState<'template' | 'custom_only' | 'combined'|'none'>('template');
const [isCombinedMode, setIsCombinedMode] = useState(false);
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

console.log(" instance id from dialog assign ",instanceId)
  const isMounted = useRef(false);
  
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  

  useEffect(() => {
  if (!open) {
    isMounted.current = false;
    return;
  }
  if (isMounted.current) {
    return;
  }

  const initialState = getInitialState();
  setFormData(initialState.formData);
  setCourseSchedule(initialState.courseSchedule);
  setInstanceLessons(initialState.instanceLessons);
  setHasCustomLessons(initialState.hasCustomLessons);
  setStep(1);
  setScheduleWarnings([]); // הוסף את זה

  // טעינת הגדרות מערכת וקבצים חסומים
  loadSystemConfiguration();

  fetchInstitutions();
  fetchInstructors();

  if (mode === 'create' && courseId) {
    fetchTemplateLessons().then(templates => {
      const lessonList = templates || [];
      if (lessonList.length > 0) {
        setCourseSchedule(prev => ({ ...prev, total_lessons: lessonList.length || 1 }));
      }
    });
  } else if (mode === 'edit' && editData) {
    fetchExistingSchedule();
    loadInstanceLessons();
    if(courseId) fetchTemplateLessons();
  }

  isMounted.current = true;
}, [open]);


useEffect(() => {
  if (templateLessons.length > 0 || instanceLessons.length > 0) {
    const totalLessons = templateLessons.length + instanceLessons.length;
    setCourseSchedule(prev => ({
      ...prev,
      total_lessons: totalLessons || prev.total_lessons || 1
    }));
  }
}, [templateLessons, instanceLessons]); // רק כשהרשימות משתנות, לא כשהערך משתנה

useEffect(() => {
  const debounceTimer = setTimeout(() => {
    validateScheduleDates();
  }, 500);
  
  return () => clearTimeout(debounceTimer);
}, [formData.start_date, formData.end_date, courseSchedule.days_of_week, courseSchedule.total_lessons, templateLessons, instanceLessons]);
  // Load system configuration on dialog open
const loadSystemConfiguration = async () => {
  try {
    // Load system defaults
    const defaults = await getSystemDefaults();
    setSystemDefaults(defaults);
    
    // Update course schedule with system defaults
    setCourseSchedule(prev => ({
      ...prev,
      lesson_duration_minutes: defaults.default_lesson_duration,
      task_duration_minutes: defaults.default_task_duration,
    }));
    
    // Load disabled dates for calendar
    const disabled = await getDisabledDatesForCalendar();
    setDisabledDates(disabled);
    
  } catch (error) {
    console.error('Error loading system configuration:', error);
    toast({
      title: "שגיאה",
      description: "לא ניתן לטעון הגדרות מערכת",
      variant: "destructive",
    });
  }
};

const validateScheduleDates = async () => {
  if (!formData.start_date || !formData.end_date || courseSchedule.days_of_week.length === 0) {
    setScheduleWarnings([]);
    return;
  }
  
  const warnings: string[] = [];
  
  // Generate potential lesson dates
  const potentialDates: Date[] = [];
  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);
  
  let currentDate = new Date(startDate);
  let lessonCount = 0;
  const maxLessons = templateLessons.length + instanceLessons.length || 10;
  
  while (currentDate <= endDate && lessonCount < maxLessons) {
    const dayOfWeek = currentDate.getDay();
    if (courseSchedule.days_of_week.includes(dayOfWeek)) {
      const isBlocked = await isDateBlocked(currentDate);
      if (isBlocked) {
        warnings.push(`התאריך ${formatDate(currentDate, "dd/MM/yyyy")} חסום במערכת`);
      }
      potentialDates.push(new Date(currentDate));
      lessonCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Check if lesson duration is appropriate
  if (courseSchedule.lesson_duration_minutes && systemDefaults) {
    if (courseSchedule.lesson_duration_minutes < 15) {
      warnings.push('משך השיעור קצר מהמומלץ (15 דקות)');
    }
    if (courseSchedule.lesson_duration_minutes > systemDefaults.default_lesson_duration * 2) {
      warnings.push(`משך השיעור ארוך משמעותית מברירת המחדל (${systemDefaults.default_lesson_duration} דקות)`);
    }
  }
  
  setScheduleWarnings(warnings);
};

  useEffect(() => {
    if (mode === 'edit' && editData && institutions.length > 0 && instructors.length > 0) {
      const institutionId = findIdByName(institutions, editData.institution_name);
      const instructorId = findIdByName(instructors, editData.instructor_name);
      setFormData({
        institution_id: institutionId,
        instructor_id: instructorId,
        grade_level: editData.grade_level,
        price_for_customer: editData.price_for_customer.toString(),
        price_for_instructor: editData.price_for_instructor.toString(),
        max_participants: editData.max_participants.toString(),
        start_date: editData.start_date || "",
        end_date: editData.approx_end_date || "",
      });
    }
  }, [editData, institutions, instructors, mode, open]);

  // --- Data Fetching Functions ---
  const findIdByName = (items: any[], name: string) => items.find(item => item.name === name || item.full_name === name)?.id || "";

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase.from("educational_institutions").select("id, name").order("name");
      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast({ title: "שגיאה", description: "לא ניתן לטעון את רשימת המוסדות", variant: "destructive" });
    }
  };
  
  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id, full_name").eq("role", "instructor").order("full_name");
      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast({ title: "שגיאה", description: "לא ניתן לטעון את רשימת המדריכים", variant: "destructive" });
    }
  };

const fetchTemplateLessons = async (idToFetch?: string) => {
      const finalCourseId = idToFetch || courseId; // Use passed ID or prop
  if (!finalCourseId) return;

    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          order_index,
          lesson_tasks (
            id,
            title,
            description,
            estimated_duration,
            is_mandatory,
            order_index
          )
        `)
        .eq('course_id', finalCourseId) // Use finalCourseId here
        .is('course_instance_id', null) // רק שיעורי תבנית
        .order('order_index');

      if (error) {
        console.error('Error loading template lessons:', error);
        return;
      }

      const formattedLessons = lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order_index: lesson.order_index,
        tasks: lesson.lesson_tasks?.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          is_mandatory: task.is_mandatory,
          order_index: task.order_index
        })).sort((a, b) => a.order_index - b.order_index) || []
      })) || [];

      setTemplateLessons(formattedLessons);
    } catch (error) {
      console.error('Error fetching template lessons:', error);
    }
  };
  const loadInstanceLessons = async () => {
    const actualInstanceId = instanceId || editData?.instance_id;
    if (!actualInstanceId) return;
    try {
      console.log('[loadInstanceLessons] Loading lessons for instance:', actualInstanceId);

      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, description, order_index, course_instance_id, lesson_tasks(*)')
        .eq('course_instance_id', actualInstanceId)
        .order('order_index');

      if (error) throw error;

      console.log('[loadInstanceLessons] Found lessons in DB:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[loadInstanceLessons] Lesson details:', data.map(l => ({ id: l.id, title: l.title, order_index: l.order_index })));
      }

      if (data && data.length > 0) {
        const formattedLessons = data.map(l => ({
          ...l,
          description: l.description || '',
          tasks: (l.lesson_tasks as any[]) || []
        }));
        setInstanceLessons(formattedLessons);
        setHasCustomLessons(true);
        console.log('[loadInstanceLessons] Set hasCustomLessons = true');
      } else {
        setInstanceLessons([]);
        setHasCustomLessons(false);
        console.log('[loadInstanceLessons] No custom lessons found, set hasCustomLessons = false');
      }
    } catch (error) {
      console.error('[loadInstanceLessons] Error loading instance lessons:', error);
    }
  };
  


// Find this function
const fetchExistingSchedule = async () => {
  if (!editData?.instance_id) return;

  try {
    // START of CHANGE
    const { data: instanceData, error: instanceError } = await supabase
      .from("course_instances")
      .select("course_id, lesson_mode") // Fetch lesson_mode here
      .eq("id", editData.instance_id)
      .single();

    if (instanceError) throw instanceError;

    // Check the mode and fetch template lessons if needed
    if (instanceData) {
      const lessonMode = (instanceData as any).lesson_mode;
      if (lessonMode === 'combined') {
        setIsCombinedMode(true);
      }
      // This is the crucial fix: fetch template lessons for the correct course
      const coursId = (instanceData as any).course_id;
      if (coursId) {
        fetchTemplateLessons(coursId);
      }
    }
    // END of CHANGE

    const { data: scheduleData, error: scheduleError } = await supabase
      .from("course_instance_schedules")
      .select("*")
      .eq("course_instance_id", editData.instance_id)
      .single();

    if (scheduleData && !scheduleError) {
      const durMinutes = (scheduleData as any).lesson_duration_minutes;
      const taskDurMinutes = (scheduleData as any).task_duration_minutes;

      // Normalize days_of_week to numbers (might come from DB as strings)
      const normalizedDays = (scheduleData.days_of_week || []).map((day: any) =>
        typeof day === 'string' ? parseInt(day, 10) : day
      );

      // Normalize time_slots days to numbers
      const normalizedTimeSlots = ((scheduleData.time_slots as any[]) || []).map((ts: any) => ({
        ...ts,
        day: typeof ts.day === 'string' ? parseInt(ts.day, 10) : ts.day
      }));

      setCourseSchedule({
        days_of_week: normalizedDays,
        time_slots: normalizedTimeSlots as TimeSlot[],
        total_lessons: scheduleData.total_lessons || 1,
        lesson_duration_minutes:
          durMinutes ||
          systemDefaults?.default_lesson_duration ||
          45,
        task_duration_minutes:
          taskDurMinutes ||
          systemDefaults?.default_task_duration ||
          25,
      });
    }
  } catch (error) {
    console.error("Error fetching existing schedule:", error);
  }
};

  // --- Logic and Handlers ---
  const handleInstanceLessonsChange = (newLessons: Lesson[]) => {
    setInstanceLessons([...newLessons]);
  };
  // Drag and drop handlers for reordering lessons
const handleDragStart = (e: React.DragEvent, index: number) => {
  setDraggedLessonIndex(index);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault();
  if (draggedLessonIndex === null || draggedLessonIndex === index) return;

  const newLessons = [...instanceLessons];
  const draggedLesson = newLessons[draggedLessonIndex];
  
  newLessons.splice(draggedLessonIndex, 1);
  newLessons.splice(index, 0, draggedLesson);
  
  // Update order_index for all lessons
  const reorderedLessons = newLessons.map((lesson, idx) => ({
    ...lesson,
    order_index: idx
  }));

  setInstanceLessons(reorderedLessons);
  setDraggedLessonIndex(index);
};

const handleDragEnd = async () => {
  if (draggedLessonIndex === null) return;

  try {
    // Save new order to database
    const updates = instanceLessons.map((lesson, index) => ({
      id: lesson.id,
      order_index: index
    }));

    for (const update of updates) {
      await supabase
        .from('lessons')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    toast({ title: "הצלחה", description: "סדר השיעורים עודכן" });
  } catch (error) {
    console.error('Error updating lesson order:', error);
    toast({ title: "שגיאה", description: "שגיאה בעדכון סדר השיעורים", variant: "destructive" });
  }

  setDraggedLessonIndex(null);
};





  useEffect(() => {
    const fetchLessonMode = async () => {
      const { data, error } = await supabase
        .from("course_instances")
        .select("lesson_mode")
        .eq("id", instanceId)
        .single();

      if (error) {
        console.error("Error fetching lesson mode:", error);
        return;
      }

      if (data) {
        console.log('lesson_mode from db : ',data.lesson_mode)
        setLessonMode(data.lesson_mode);
        setIsCombinedMode(data.lesson_mode === "combined");
      }
    };

    fetchLessonMode();
  }, [instanceId]);
    



  

const copyTemplateLessonsToInstance = () => {
    if (templateLessons.length === 0) {
      toast({ title: "הודעה", description: "אין שיעורי תבנית להעתקה", variant: "default" });
      return;
    }
    setIsCombinedMode(false)
    // if (lessonMode === 'combined') {
    //   toast({ title: "מוד משולב", description: "במוד זה, שיעורי תבנית מוצגים כפי שהם, ללא העתקה. הוסף ייחודיים.", variant: "default" });
    //   return;
    // }
    
    // העתקה רק ל-'custom_only'
    const copiedLessons = templateLessons.map((lesson, index) => ({
      id: `temp-lesson-${Date.now()}-${index}`,
      title: lesson.title,
      description: lesson.description || '',
      order_index: index,
      tasks: lesson.tasks.map((task, taskIndex) => ({
        id: `temp-task-${Date.now()}-${index}-${taskIndex}`,
        title: task.title,
        description: task.description,
        estimated_duration: task.estimated_duration,
        is_mandatory: task.is_mandatory,
        order_index: task.order_index,
      }))
    }));

    setInstanceLessons(copiedLessons);
    setHasCustomLessons(true);
    setLessonSource('template');
    setLessonMode('custom_only');
    toast({ title: "הצלחה", description: `${copiedLessons.length} שיעורים הועתקו (custom_only)` });
  };


  const startFromScratch = () => {
  setInstanceLessons([]);
  setHasCustomLessons(true);
  setLessonSource('scratch');
  setLessonMode('custom_only'); // *** הוסף את זה ***
  toast({ title: "מוכן", description: "כעת תוכל להוסיף שיעורים חדשים" });
};
// במקום שהפונקציות האחרות (אחרי startFromScratch)
const startCombinedMode = () => {
  setInstanceLessons([]); // מתחיל עם רשימה ריקה של שיעורים ייחודיים
  setHasCustomLessons(true);
  setLessonSource('combined');
  setLessonMode('combined'); // *** המפתח כאן ***
  setIsCombinedMode(true);
  toast({
    title: "מצב משולב",
    description: `כעת תוכל להוסיף שיעורים נוספים ל-${templateLessons.length} שיעורי התבנית הקיימים`,
    variant: "default"
  });
};
  // const resetInstanceLessons = () => {
  //   setInstanceLessons([]);
  //   setHasCustomLessons(false);
  //   toast({ title: "איפוס", description: "השימוש חזר לשיעורי התבנית המקוריים", variant: "default" });
  // };
const resetInstanceLessons = async () => {
  const actualInstanceId = instanceId || editData?.instance_id;

  if (mode === 'edit' && actualInstanceId) {
    // **במצב עריכה - מחק מה-DB וצור מחדש**
    try {
      console.log('[resetInstanceLessons] Starting reset for instance:', actualInstanceId);

      // Step 1: Delete ALL schedules for this course instance
      const { error: schedulesError } = await supabase
        .from('lesson_schedules')
        .delete()
        .eq('course_instance_id', actualInstanceId);

      if (schedulesError) {
        console.error('[resetInstanceLessons] Error deleting schedules:', schedulesError);
        throw schedulesError;
      }

      console.log('[resetInstanceLessons] All schedules deleted');

      // Step 2: Delete the custom lessons
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .eq('course_instance_id', actualInstanceId);

      if (lessonsError) throw lessonsError;

      console.log('[resetInstanceLessons] Custom lessons deleted');

      // Step 3: Update lesson_mode to template
      const { error: updateError } = await supabase
        .from('course_instances')
        .update({ lesson_mode: 'template' })
        .eq('id', actualInstanceId);

      if (updateError) {
        console.error('[resetInstanceLessons] Error updating lesson_mode:', updateError);
        throw updateError;
      }

      console.log('[resetInstanceLessons] Updated lesson_mode to template');

      // Step 4: Regenerate physical schedules with template lessons
      try {
        // Fetch the schedule pattern
        const { data: schedulePattern, error: scheduleError } = await supabase
          .from('course_instance_schedules')
          .select(`
            *,
            course_instances:course_instance_id (
              course_id,
              start_date,
              end_date
            )
          `)
          .eq('course_instance_id', actualInstanceId)
          .single();

        if (scheduleError) throw scheduleError;

        if (schedulePattern && schedulePattern.course_instances) {
          // Fetch template lessons
          const { data: templateLessons } = await supabase
            .from('lessons')
            .select('id, title, course_id, order_index, course_instance_id')
            .eq('course_id', schedulePattern.course_instances.course_id)
            .is('course_instance_id', null)
            .order('order_index');

          console.log('[resetInstanceLessons] Template lessons found:', templateLessons?.length || 0);

          if (templateLessons && templateLessons.length > 0) {
            // Generate new physical schedules with template lessons
            const physicalSchedules = await generatePhysicalSchedulesFromPattern(
              {
                id: schedulePattern.id,
                course_instance_id: actualInstanceId,
                days_of_week: schedulePattern.days_of_week,
                time_slots: schedulePattern.time_slots,
                total_lessons: schedulePattern.total_lessons,
                lesson_duration_minutes: schedulePattern.lesson_duration_minutes,
              },
              templateLessons,
              schedulePattern.course_instances.start_date,
              schedulePattern.course_instances.end_date
            );

            console.log('[resetInstanceLessons] Regenerated physical schedules:', physicalSchedules.length);
          }
        }
      } catch (regenerateError) {
        console.error('[resetInstanceLessons] Error regenerating schedules:', regenerateError);
        // Don't fail the whole operation
      }

      // Update UI state
      console.log('[resetInstanceLessons] BEFORE state update - hasCustomLessons:', hasCustomLessons, 'instanceLessons.length:', instanceLessons.length);
      setInstanceLessons([]);
      setHasCustomLessons(false);
      setLessonSource('none');
      setLessonMode('template');
      setIsCombinedMode(false);
      console.log('[resetInstanceLessons] AFTER state update - State should now be: hasCustomLessons=false, instanceLessons=[], lessonMode=template');

      toast({
        title: "חזרה לברירת מחדל",
        description: "השיעורים והתזמונים חזרו לברירת המחדל של הקורס",
        variant: "default"
      });

    } catch (error) {
      console.error('[resetInstanceLessons] Error resetting lessons:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בחזרה לברירת מחדל: " + (error?.message || ''),
        variant: "destructive"
      });
    }
  } else {
    // **במצב יצירה - רק ניקוי state**
    setInstanceLessons([]);
    setHasCustomLessons(false);
    setLessonSource('none');
    setLessonMode('template');
    setIsCombinedMode(false);
    toast({ title: "נוקה", description: "השיעורים הייחודיים הוסרו (לא נשמר עדיין)" });
  }
};
  
  const handleInputChange = (field: string, value: string) => setFormData(prev => ({...prev, [field]: value}));
  
  const toggleDayOfWeek = (dayIndex: number) => {
    setCourseSchedule(prev => {
      const isSelected = prev.days_of_week.includes(dayIndex);
      if (isSelected) {
        return {
          ...prev,
          days_of_week: prev.days_of_week.filter(d => d !== dayIndex),
          time_slots: prev.time_slots.filter(ts => ts.day !== dayIndex),
        };
      } else {
        return {
          ...prev,
          days_of_week: [...prev.days_of_week, dayIndex].sort(),
          time_slots: [...prev.time_slots, { day: dayIndex, start_time: "08:00", end_time: "08:45" }],
        };
      }
    });
  };

  const updateTimeSlot = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
    setCourseSchedule(prev => ({
      ...prev,
      time_slots: prev.time_slots.map(ts => ts.day === dayIndex ? { ...ts, [field]: value } : ts),
    }));
  };

 
const handleCourseAssignment = async (): Promise<string | null> => {
  const finalSchedule = {
    ...courseSchedule,
    total_lessons: hasCustomLessons ? instanceLessons.length : templateLessons.length,
  };

  // *** קבע את lesson_mode הנכון ***
 

  try {
    if (mode === 'create') {
      const { data, error } = await supabase
        .from("course_instances")
        .insert([{
            course_id: courseId,
            institution_id: formData.institution_id,
            instructor_id: formData.instructor_id,
            grade_level: formData.grade_level,
            max_participants: parseInt(formData.max_participants) || null,
            price_for_customer: parseFloat(formData.price_for_customer) || null,
            price_for_instructor: parseFloat(formData.price_for_instructor) || null,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            days_of_week: finalSchedule.days_of_week,
            lesson_mode: lessonMode, // *** הוסף את זה ***
            schedule_pattern: {
              time_slots: finalSchedule.time_slots,
              total_lessons: finalSchedule.total_lessons,
              lesson_duration_minutes: finalSchedule.lesson_duration_minutes,
            },
        }])
        .select()
        .single();
      if (error) throw error;
      return data.id;
    } else {
      const { data, error } = await supabase
        .from("course_instances")
        .update({
          institution_id: formData.institution_id,
          instructor_id: formData.instructor_id,
          grade_level: formData.grade_level,
          max_participants: parseInt(formData.max_participants) || null,
          price_for_customer: parseFloat(formData.price_for_customer) || null,
          price_for_instructor: parseFloat(formData.price_for_instructor) || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          days_of_week: finalSchedule.days_of_week,
          lesson_mode: lessonMode, // *** הוסף את זה ***
          schedule_pattern: {
            time_slots: finalSchedule.time_slots,
            total_lessons: finalSchedule.total_lessons,
            lesson_duration_minutes: finalSchedule.lesson_duration_minutes,
          },
        })
        .eq("id", editData?.instance_id)
        .select()
        .single();
      if (error) throw error;
      return editData?.instance_id || null;
    }
  } catch (error) {
    console.error("Error with course assignment:", error);
    toast({ 
      title: "שגיאה", 
      description: mode === 'create' ? "שגיאה בשיוך התוכנית" : "שגיאה בעדכון התוכנית", 
      variant: "destructive"
    });
    return null;
  }
};
 
  
const saveCourseInstanceSchedule = async (instanceId: string) => {
  try {
    const { data: existingSchedule } = await supabase
      .from("course_instance_schedules")
      .select("*")
      .eq("course_instance_id", instanceId)
      .single();

    const adjustedTimeSlots = courseSchedule.time_slots.map(timeSlot => {
      const startDate = new Date(formData.start_date + 'T00:00:00');
      let targetDate = new Date(startDate);
      
      while (targetDate.getDay() !== timeSlot.day) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const [hours, minutes] = timeSlot.start_time.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      
      if (existingSchedule && timeSlot.first_lesson_date) {
        return timeSlot;
      }
      
      if (targetDate.getTime() <= new Date().getTime()) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      
      return {
        ...timeSlot,
        first_lesson_date: targetDate.toISOString().split('T')[0],
      };
    });

    // ================= START OF FIX =================
    // Correctly calculate total lessons based on the selected mode
    let totalLessonsCount = 0;
    if (lessonMode === 'template') {
      totalLessonsCount = templateLessons.length;
    } else if (lessonMode === 'custom_only') {
      totalLessonsCount = instanceLessons.length;
    } else if (lessonMode === 'combined') {
      totalLessonsCount = templateLessons.length + instanceLessons.length;
    }
    // ================== END OF FIX ==================

    const scheduleData = {
      course_instance_id: instanceId,
      days_of_week: courseSchedule.days_of_week,
      time_slots: adjustedTimeSlots,
      total_lessons: totalLessonsCount, // Use the corrected count
      lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
    };

    const { error } = await supabase
      .from("course_instance_schedules")
      .upsert(scheduleData, { onConflict: 'course_instance_id' });
    
    if (error) throw error;
    
    console.log(`Schedule saved with ${totalLessonsCount} total lessons`);
  } catch (error) {
    console.error("Error saving course instance schedule:", error);
    throw error;
  }
};



  const saveInstanceLessons = async (assignmentInstanceId: string) => {
    try {
      console.log(`[saveInstanceLessons] START - Syncing unique lessons for instance ${assignmentInstanceId} with mode: ${lessonMode}`);
      console.log(`[saveInstanceLessons] Current instanceLessons:`, instanceLessons.map(l => ({ id: l.id, title: l.title })));

      // This function ONLY manages the UNIQUE lessons ('instanceLessons').
      // The 'combined' view is a display-time concern handled by the assignments page.

      // 1. Get all lesson IDs currently in the DB for this instance
      const { data: dbLessons, error: fetchError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('course_instance_id', assignmentInstanceId);
      if (fetchError) throw fetchError;
      const dbLessonIds = new Set(dbLessons?.map(l => l.id) || []);
      console.log(`[saveInstanceLessons] Lessons in DB:`, dbLessons?.length || 0, dbLessons?.map(l => ({ id: l.id, title: l.title })));

      // 2. Get all lesson IDs currently in the UI state (excluding new temporary ones)
      const uiLessonIds = new Set(instanceLessons.map(l => l.id).filter(id => id && !id.toString().startsWith('temp-')));
      console.log(`[saveInstanceLessons] Lessons in UI (non-temp IDs):`, uiLessonIds.size, Array.from(uiLessonIds));

      // 3. Find lessons to DELETE (in DB but not in UI)
      const lessonIdsToDelete = [...dbLessonIds].filter(id => !uiLessonIds.has(id));
      console.log(`[saveInstanceLessons] Lessons to DELETE:`, lessonIdsToDelete.length, lessonIdsToDelete);

      if (lessonIdsToDelete.length > 0) {
        console.log(`[saveInstanceLessons] Deleting ${lessonIdsToDelete.length} lessons...`);

        // *** Step 1: Delete ALL schedules linked to these lessons ***
        const { error: deleteSchedulesError } = await supabase
          .from('lesson_schedules')
          .delete()
          .in('lesson_id', lessonIdsToDelete);

        if (deleteSchedulesError) {
          console.error('[saveInstanceLessons] Error deleting schedules for lessons:', deleteSchedulesError);
          throw deleteSchedulesError;
        }

        console.log('[saveInstanceLessons] Schedules deleted for lessons');

        // *** Step 2: Delete ALL tasks linked to 