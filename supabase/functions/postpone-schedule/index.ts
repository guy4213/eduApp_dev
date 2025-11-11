import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY');

interface PostponePayload {
  scheduleId: string;
  reportId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: PostponePayload = await req.json();
    if (!payload.scheduleId || !payload.reportId) {
      throw new Error("Missing scheduleId or reportId in payload.");
    }

    // Create Supabase client with service role privileges
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    console.log('[postponeSchedule] Starting postpone for schedule:', payload.scheduleId);

    // 1. Fetch the original schedule with all related data
    const { data: originalSchedule, error: fetchError } = await supabase
      .from('lesson_schedules')
      .select(`
        *,
        course_instances:course_instance_id (
          id,
          start_date,
          end_date,
          course_instance_schedules (
            id,
            days_of_week,
            time_slots,
            total_lessons,
            lesson_duration_minutes
          )
        ),
        lessons:lesson_id (
          id,
          title,
          order_index
        )
      `)
      .eq('id', payload.scheduleId)
      .single();

    if (fetchError || !originalSchedule) {
      console.error('[postponeSchedule] Error fetching schedule:', fetchError);
      throw new Error('לא נמצא תזמון');
    }

    console.log('[postponeSchedule] Original schedule:', originalSchedule);

    const courseInstance = originalSchedule.course_instances;
    let pattern = courseInstance?.course_instance_schedules?.[0];

    // If pattern not found via join, try direct query
    if (!pattern || !pattern.days_of_week || !pattern.time_slots) {
      console.log('[postponeSchedule] Trying to fetch pattern directly from DB...');
      const { data: directPattern, error: directError } = await supabase
        .from('course_instance_schedules')
        .select('*')
        .eq('course_instance_id', originalSchedule.course_instance_id)
        .single();

      if (directPattern && directPattern.days_of_week && directPattern.time_slots) {
        console.log('[postponeSchedule] ✅ Using direct pattern instead');
        pattern = directPattern;
      } else {
        throw new Error('לא נמצא תבנית תזמון');
      }
    }

    console.log('[postponeSchedule] Final pattern to use:', pattern);

    // Normalize days
    const normalizedDays = (pattern.days_of_week || []).map((day: any) =>
      typeof day === 'string' ? parseInt(day, 10) : day
    ).sort();

    const normalizedTimeSlots = (pattern.time_slots || []).map((ts: any) => ({
      ...ts,
      day: typeof ts.day === 'string' ? parseInt(ts.day, 10) : ts.day
    }));

    console.log('[postponeSchedule] Pattern days:', normalizedDays);
    console.log('[postponeSchedule] Time slots:', normalizedTimeSlots);

    // 2. Calculate next available date
    const originalDate = new Date(originalSchedule.scheduled_start);
    let nextDate = new Date(originalDate);
    nextDate.setDate(nextDate.getDate() + 1); // Start from next day

    // Find next day that matches the pattern
    let attempts = 0;
    while (!normalizedDays.includes(nextDate.getDay()) && attempts < 14) {
      nextDate.setDate(nextDate.getDate() + 1);
      attempts++;
    }

    if (attempts >= 14) {
      throw new Error('לא נמצא יום זמין בשבועיים הקרובים');
    }

    // Get blocked dates
    const { data: blockedDatesData } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('is_active', true);

    const blockedDateSet = new Set<string>();
    (blockedDatesData || []).forEach(blockedDate => {
      if (blockedDate.date) {
        blockedDateSet.add(blockedDate.date);
      } else if (blockedDate.start_date && blockedDate.end_date) {
        const start = new Date(blockedDate.start_date);
        const end = new Date(blockedDate.end_date);
        const current = new Date(start);
        while (current <= end) {
          blockedDateSet.add(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    });

    // Skip blocked dates
    attempts = 0;
    while (blockedDateSet.has(nextDate.toISOString().split('T')[0]) && attempts < 30) {
      nextDate.setDate(nextDate.getDate() + 1);
      // Make sure it still matches pattern
      while (!normalizedDays.includes(nextDate.getDay()) && attempts < 30) {
        nextDate.setDate(nextDate.getDate() + 1);
        attempts++;
      }
      attempts++;
    }

    // 3. Find the time slot for the new day
    const nextDayOfWeek = nextDate.getDay();
    const timeSlot = normalizedTimeSlots.find(ts => ts.day === nextDayOfWeek);

    if (!timeSlot || !timeSlot.start_time || !timeSlot.end_time) {
      throw new Error('לא נמצא slot זמן עבור היום הבא');
    }

    // 4. Calculate new start and end times
    const [startHour, startMinute] = timeSlot.start_time.split(':').map(Number);
    const [endHour, endMinute] = timeSlot.end_time.split(':').map(Number);

    const newStart = new Date(nextDate);
    newStart.setHours(startHour, startMinute, 0, 0);

    const newEnd = new Date(nextDate);
    newEnd.setHours(endHour, endMinute, 0, 0);

    console.log('[postponeSchedule] New schedule date:', newStart.toISOString());

    // 5. Update the existing schedule (instead of creating a duplicate)
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('lesson_schedules')
      .update({
        scheduled_start: newStart.toISOString(),
        scheduled_end: newEnd.toISOString()
      })
      .eq('id', payload.scheduleId)
      .select()
      .single();

    if (updateError || !updatedSchedule) {
      console.error('[postponeSchedule] Error updating schedule:', updateError);
      throw new Error('שגיאה בעדכון תזמון');
    }

    console.log('[postponeSchedule] Updated schedule:', updatedSchedule.id, 'to', newStart.toISOString());

    // 6. Chain all subsequent schedules (shift them forward by one day of pattern)
    // Get schedules that start at or after the NEW date (not the original date)
    const { data: subsequentSchedules, error: fetchSubError } = await supabase
      .from('lesson_schedules')
      .select('*')
      .eq('course_instance_id', originalSchedule.course_instance_id)
      .gte('scheduled_start', newStart.toISOString())
      .neq('id', payload.scheduleId) // Exclude the schedule we just updated
      .order('scheduled_start', { ascending: true });

    if (!fetchSubError && subsequentSchedules && subsequentSchedules.length > 0) {
      console.log(`[postponeSchedule] Chaining ${subsequentSchedules.length} subsequent schedules`);

      for (const schedule of subsequentSchedules) {
        const scheduleDate = new Date(schedule.scheduled_start);

        // Find next pattern day
        let shiftedDate = new Date(scheduleDate);
        shiftedDate.setDate(shiftedDate.getDate() + 1);

        attempts = 0;
        while (!normalizedDays.includes(shiftedDate.getDay()) && attempts < 14) {
          shiftedDate.setDate(shiftedDate.getDate() + 1);
          attempts++;
        }

        // Skip blocked dates
        attempts = 0;
        while (blockedDateSet.has(shiftedDate.toISOString().split('T')[0]) && attempts < 30) {
          shiftedDate.setDate(shiftedDate.getDate() + 1);
          while (!normalizedDays.includes(shiftedDate.getDay()) && attempts < 30) {
            shiftedDate.setDate(shiftedDate.getDate() + 1);
            attempts++;
          }
          attempts++;
        }

        // Find time slot for shifted day
        const shiftedDayOfWeek = shiftedDate.getDay();
        const shiftedTimeSlot = normalizedTimeSlots.find(ts => ts.day === shiftedDayOfWeek);

        if (shiftedTimeSlot && shiftedTimeSlot.start_time && shiftedTimeSlot.end_time) {
          const [shiftStartHour, shiftStartMinute] = shiftedTimeSlot.start_time.split(':').map(Number);
          const [shiftEndHour, shiftEndMinute] = shiftedTimeSlot.end_time.split(':').map(Number);

          const shiftedStart = new Date(shiftedDate);
          shiftedStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);

          const shiftedEnd = new Date(shiftedDate);
          shiftedEnd.setHours(shiftEndHour, shiftEndMinute, 0, 0);

          // Update the schedule
          await supabase
            .from('lesson_schedules')
            .update({
              scheduled_start: shiftedStart.toISOString(),
              scheduled_end: shiftedEnd.toISOString()
            })
            .eq('id', schedule.id);

          console.log(`[postponeSchedule] Shifted schedule ${schedule.id} to ${shiftedStart.toISOString()}`);
        }
      }
    }

    const message = `התזמון נדחה ליום ${nextDate.toLocaleDateString('he-IL')} ו-${subsequentSchedules?.length || 0} תזמונים נשרשרו קדימה`;

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[postponeSchedule] Error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
