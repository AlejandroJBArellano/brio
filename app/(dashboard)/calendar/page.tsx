import { fetchCalendarScheduleAction } from "@/app/actions/calendar";
import { DayScheduleView } from "@/app/components/DayScheduleView";
import { CalendarSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <AsyncCalendarContent />
    </Suspense>
  );
}

async function AsyncCalendarContent() {
  const calendarData = await fetchCalendarScheduleAction();
  return (
    <DayScheduleView
      schedule={calendarData.schedule}
      isConfigured={calendarData.isConfigured}
    />
  );
}
