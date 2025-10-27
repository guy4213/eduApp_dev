// import React, { useEffect, useState } from "react";
// import { useAuth } from "@/components/auth/AuthProvider";
// import MobileDashboard from "./MobileDashboard";
// import MobileNavigation from "../layout/MobileNavigation";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { StatsCard } from "./StatsCard";
// import { Progress } from "@/components/ui/progress";
// import {
//   Calendar,
//   Users,
//   BookOpen,
//   BarChart3,
//   Settings,
//   Clock,
//   MapPin,
//   Star,
//   Award,
//   Plus,
//   CalendarIcon,
// } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
// import { WeeklyCalendar } from "../ui/WeeklyCalendar";
// import { Lesson } from "../course/CourseLessonsSection";
// import { DailyLessonsCard } from "@/components/DailyLessonsCard";
// import { useNavigate } from "react-router-dom";

// interface DashboardStats {
//   totalLessons: number;
//   activeStudents: number;
//   activeCourses: number;
//   monthlyEarnings: number;
//   upcomingLessons: any[];
//   recentActivity: any[];
// }
// export interface ClassItem {
//   time: string;
//   title: string;
//   instructor: string;
//   booked: number;
//   capacity: number;
//   avatars: string[];
//   status: "available" | "booked";
//   date?: string; // optional ISO date for filtering
// }


// const Dashboard = () => {
//   const { user } = useAuth();
//   const [stats, setStats] = useState<DashboardStats>({
//     totalLessons: 0,
//     activeStudents: 0,
//     activeCourses: 0,
//     monthlyEarnings: 0,
//     upcomingLessons: [],
//     recentActivity: [],
//   });
//   const [loading, setLoading] = useState(true);
//   const [userProfile, setUserProfile] = useState(null);
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [lessons, setLessons] = useState<any>();
//   const nav=useNavigate();





// useEffect(() => {
// const fetchDashboardData = async () => {
//   if (!user) return;
  
//   try {

//     // פרופיל המשתמש
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("id", user.id);

//     // קודם מושכים את כל ה-course_instances של המדריך
//     const { data: courses } = await supabase
//       .from("course_instances")
//       .select("id")
//       // .eq("instructor_id", user.id);

//     console.log("User courses:", courses);

//     if (!courses || courses.length === 0) {
//       console.log("No courses found for instructor");
//       setLessons([]);
//       setStats({
//         totalLessons: 0,
//         activeStudents: 0,
//         activeCourses: 0,
//         monthlyEarnings: 0,
//         upcomingLessons: [],
//         recentActivity: [],
//       });
//       return;
//     }

//     const courseIds = courses.map(c => c.id);

//     // עכשיו מושכים רק schedules של הקורסים האלה
//     const { data: schedules, error } = await supabase
//   .from("lesson_schedules")
//   .select(`
//     id,
//     scheduled_start,
//     scheduled_end,
//     lesson:lesson_id (
//       id,
//       title
//     ),
//     course_instance:course_instance_id (
//       id,
//       grade_level,
//       institution:institution_id (
//         id,
//         name
//       ),
//       instructor:instructor_id (
//         id,
//         full_name
//       )
//     )
//   `)

//       .in("course_instance_id", courseIds);

//     console.log("schedules", schedules);

//     // שאר הקוד...
//     const adaptedLessons = (schedules || []).map((s) => ({
//       id: s.id,
//       institution_name: s.course_instance?.institution?.name || "לא ידוע",
//       scheduled_start: s.scheduled_start,
//       scheduled_end:s.scheduled_end,
//       title: s.lesson?.title || "ללא כותרת",
//       instructorName: s.course_instance?.instructor?.full_name || "לא ידוע",
//       instructor_id: s.course_instance?.instructor?.id || "לא ידוע",
//       lesson_id: s.lesson?.id 
//     }));

//     console.log("cccccccc   ", adaptedLessons);
    
//     setLessons(adaptedLessons);
//     setStats({
//       totalLessons: adaptedLessons.length,
//       activeStudents: 45,
//       activeCourses: courses?.length || 0,
//       monthlyEarnings: 4350,
//       upcomingLessons: adaptedLessons.slice(0, 3),
//       recentActivity: adaptedLessons.slice(-3),
//     });

//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//   } finally {
//     setLoading(false);
//   }
// };

//   fetchDashboardData();
// }, [user]);
//   const menuItems = [
//     {
//       icon: Calendar,
//       title: "יומן אישי",
//       description: "צפייה במערכת השעות והשיעורים הקרובים",
//       path: "/calendar",
//     },
//     {
//       icon: BookOpen,
//       title: "דיווח שיעור",
//       description: "דיווח על שיעור שהתקיים או בתהליך",
//       path: "/lesson-report/:id",
//     },
//     {
//       icon: Users,
//       title: "קורסים",
//       description: "ניהול הקורסים והכיתות שלי",
//       path: "/courses",
//     },
//     {
//       icon: BarChart3,
//       title: "דוחות ושכר",
//       description: "צפייה בדוחות חודשיים וחישוב שכר",
//       path: "/reports",
//     },
//     {
//       icon: Settings,
//       title: "הגדרות פרופיל",
//       description: "עריכת פרטים אישיים והגדרות המערכת",
//       path: "/profile",
//     },
//   ];

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
//       </div>
//     );
//   }
//   console.log("lessons : ", lessons);
//   console.log("userPRO: ", userProfile);
//   return (
//     <>
//       {/* Mobile View */}
//       <div className="md:hidden">
     
//         <MobileNavigation />
//       </div>

//       {/* Desktop View */}
//       <div className="hidden md:block min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//         {/* Main Content */}
//         <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {/* Welcome Section */}
//           <div className="mb-8">
//             {user?.user_metadata.role !== "instructor" ? (
//               <h2 className="text-3xl font-bold text-gray-900 mb-2">
//                 ברוך הבא למערכת ניהול המנחים והמרצים
//               </h2>
//             ) : (
//               <h2 className="text-gray-600 text-lg"> ברוכים הבאים </h2>
//             )}
//           </div>

//           {/* Stats Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//             <StatsCard
//               title="תלמידים פעילים"
//               value={stats.activeStudents}
//               icon={Users}
//               color="bg-gradient-to-r from-orange-500 to-red-500"
//             />
//             <StatsCard
//               title="הושלמו"
//               value="1"
//               icon={Award}
//               color="bg-gradient-to-r from-green-500 to-emerald-500"
//             />
//             <StatsCard
//               title="שיעורים כללים"
//               value="3"
//               icon={BookOpen}
//               color="bg-gradient-to-r from-blue-500 to-cyan-500"
//             />
//             <StatsCard
//               title="מבוצע בבניינים"
//               value="45"
//               icon={BarChart3}
//               color="bg-gradient-to-r from-purple-500 to-indigo-500"
//             />
//           </div>
//           <div className="lg:col-span-2">
      
//           </div>
//           {/* Main Dashboard Grid */}
//             <DailyLessonsCard
//       dateLabel={new Date(Date.now()).toLocaleString().split(",")[0]}
//         onAddLesson={() => nav('/courses')}
//         lessons={lessons}
//       />

//           {/* Summary Card */}
//           <Card className="bg-gradient-to-l from-yellow-100 to-amber-100 border-yellow-300 shadow-lg mb-8">
//             <CardContent className="p-8 text-center">
//               <div className="flex items-center justify-center mb-4">
//                 <Award className="h-10 w-10 text-yellow-600 mr-3" />
//                 <span className="text-3xl font-bold text-yellow-800">
//                   ₪4,350
//                 </span>
//               </div>
//               <p className="text-yellow-700 font-semibold text-lg">סטר נפש</p>
//               <p className="text-sm text-yellow-600 mt-2 font-medium">
//                 🏆 ב-2 שפעילות בלכלי מפיסד התמרמר ב-שירי בפולטי
//               </p>
//               <p className="text-xs text-yellow-600 mt-1">
//                 ב שנים ותשרת בצרכים
//               </p>
//             </CardContent>
//           </Card>

//           {/* Menu Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {menuItems.map((item, index) => (
//               <Card
//                 key={index}
//                 className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105"
//               >
//                 <CardHeader className="pb-4">
//                   <div className="flex items-center">
//                     <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-4">
//                       <item.icon className="h-6 w-6 text-white" />
//                     </div>
//                     <CardTitle className="text-lg text-gray-900">
//                       {item.title}
//                     </CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <CardDescription className="text-sm text-gray-600 leading-relaxed">
//                     {item.description}
//                   </CardDescription>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </main>
//       </div>
//     </>
//   );
// };

// export default Dashboard;


import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Clock,
  MapPin,
  Star,
  Award,
  Plus,
  CalendarIcon,
  TrendingUp,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCombinedSchedules } from "@/utils/scheduleUtils";
import { DailyLessonsCard } from "@/components/DailyLessonsCard";
import { useNavigate } from "react-router-dom";
import MobileDashboard from "./MobileDashboard";
import { StatsCard } from "../StatsCard";
import MobileNavigation from "../layout/MobileNavigation";
import LeadsStatsCard from "./LeadsStatsCard";
import { useToast } from "@/components/ui/use-toast"
interface DashboardStats {
  totalLessons: number;
  activeStudents: number;
  activeCourses: number;
  monthlyEarnings: number;
  rewardsTotal: number;
  upcomingLessons: any[];
  recentActivity: any[];
}

export interface ClassItem {
  time: string;
  title: string;
  instructor: string;
  booked: number;
  capacity: number;
  avatars: string[];
  status: "available" | "booked";
  date?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    activeStudents: 0,
    activeCourses: 0,
    monthlyEarnings: 0,
    rewardsTotal: 0,
    upcomingLessons: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<any>([]);
  const nav = useNavigate();
  const [reports, setReports] = useState<any>([]);
  const [monthlySchedules, setMonthlySchedules] = useState<any>([]);
    const [weeklyReports, setWeeklyReports] = useState<any>([]);
  const [monthlyReportsCount, setMonthlyReportsCount] = useState<number>(0);


    function filterReportsCurrentWeek(reports) {
  const now = new Date();

  // Get Sunday of current week (start)
  const dayOfWeek = now.getDay();
  const sundayStart = new Date(now);
  sundayStart.setHours(0, 0, 0, 0);
  sundayStart.setDate(now.getDate() - dayOfWeek);

  // Get next Sunday (start of next week)
  const nextSunday = new Date(sundayStart);
  nextSunday.setDate(sundayStart.getDate() + 7);

  return reports.filter(report => {
    const createdAt = new Date(report.created_at);
    return createdAt >= sundayStart && createdAt < nextSunday;
  });
}
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { data: reportsData } = await supabase
        .from("lesson_reports")
        .select("*")
        .gte("created_at", firstDay)
        .lt("created_at", firstDayNextMonth);

      setReports(reportsData)
      // Calculate reports count strictly within the current month (defensive)
      const monthStartLocal = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthEndLocal = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const onlyThisMonth = (reportsData || []).filter((r: any) => {
        const d = new Date(r.created_at);
        return d >= monthStartLocal && d <= monthEndLocal;
      });
      setMonthlyReportsCount(onlyThisMonth.length);
      

      const reportsThisWeek = filterReportsCurrentWeek(reportsData);
      setWeeklyReports(reportsThisWeek)
      // קודם מושכים את כל ה-course_instances של המדריך
      const { data: courses } = await supabase
        .from("course_instances")
        .select("id")
       

      console.log("User courses:", courses);

      if (!courses || courses.length === 0) {
        console.log("No courses found for instructor");
        setLessons([]);
        setStats({
          totalLessons: 0,
          activeStudents: 0,
          activeCourses: 0,
          monthlyEarnings: 0,
          rewardsTotal: 0,
          upcomingLessons: [],
          recentActivity: [],
        });
        setLoading(false);
        return;
      }

      const courseIds = courses.map(c => c.id);

      // משיכה מאוחדת של כל התזמונים (מורשת + נוצר מתבנית)
      const combined = await fetchCombinedSchedules();

      // סינון לפי הקורסים הרלוונטיים בלבד
      const combinedForCourses = (combined || []).filter((s: any) =>
        courseIds.includes(s.course_instance_id || s?.course_instances?.id)
      );

      // טווח חודשי
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

      const schedulesThisMonth = combinedForCourses.filter((s: any) => {
        const d = new Date(s.scheduled_start);
        return d >= monthStart && d <= monthEnd;
      });

      setMonthlySchedules(schedulesThisMonth.length);

      // שמירה על הלוגיקה הקיימת לסטטיסטיקות נוספות
      const { data: enrollments } = await supabase
        .from("course_instances")
        .select("*")
       


// Filter only schedules in the current month

      // מושכים נתוני תלמידים



//           const totalActive = enrollments.reduce(
//   (acc, curr) => acc + (curr.max_participants || 0),
//   0
// );

const { data: students } = await supabase
        .from("students")
        .select("*")

const totalActive=students.length;
console.log("Total active students:", totalActive);



console.log("All schedules:", combinedForCourses.length);
console.log("Schedules this month:", schedulesThisMonth.length);
setMonthlySchedules(schedulesThisMonth.length);

const adaptedLessons = (combinedForCourses || []).map((s: any) => ({
  id: s.id,
  institution_name: s.course_instances?.institution?.name || s?.course_instance?.institution?.name || "לא ידוע",
  scheduled_start: s.scheduled_start,
  scheduled_end: s.scheduled_end,
  title: s.lesson?.title || "ללא כותרת",
  course_name: s.course_instances?.course?.name || "ללא שם קורס",
  lesson_number: s.lesson_number || (s.lesson?.order_index ? s.lesson.order_index + 1 : 1),
  instructorName: s.course_instances?.instructor?.full_name || s?.course_instance?.instructor?.full_name || "לא ידוע",
  instructor_id: s.course_instances?.instructor?.id || s?.course_instance?.instructor?.id || "לא ידוע",
  lesson_id: s.lesson?.id,
  grade_level: s.course_instances?.grade_level || s?.course_instance?.grade_level || "לא ידוע",      
  course_instance_id: s.course_instance_id
}));

console.log("Adapted lessons:", adaptedLessons);

// Fetch sales leads for rewards calculation
const { data: salesLeads } = await supabase
  .from('sales_leads')
  .select('potential_value, commission_percentage');

// Calculate total rewards from sales leads
const calculateRewardsTotal = (leads: any[]) => {
  const totalPotentialValue = leads.reduce((sum, lead) => {
    return sum + (lead.potential_value || 0);
  }, 0);

  // Calculate different reward types based on potential values
  // const teaching_incentives = Math.floor(totalPotentialValue * 0.4); // 40% for teaching incentives
  // const closing_bonuses = Math.floor(totalPotentialValue * 0.3); // 30% for closing bonuses  
  // const team_rewards = Math.floor(totalPotentialValue * 0.1); // 10% for team rewards
  return totalPotentialValue;
};

const rewardsTotal = calculateRewardsTotal(salesLeads || []);

setLessons(adaptedLessons);
setStats({
  totalLessons: adaptedLessons.length,
  activeStudents:   totalActive,
  activeCourses: enrollments?.length || 0,
  monthlyEarnings: adaptedLessons.length * 150, // חישוב פשוט לפי מספר שיעורים
  rewardsTotal: rewardsTotal,
  upcomingLessons: adaptedLessons.slice(0, 3),
  recentActivity: adaptedLessons.slice(-3),
});

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
        toast({
      title: "שגיאה",
      description: "לא ניתן לטעון את הנתונים",
      variant: "destructive"
    });
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Auto-refresh dashboard data every 2 minutes
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Listen for lesson report updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lessonReportUpdated') {
        console.log('Lesson report updated, refreshing dashboard...');
        fetchDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events
    const handleCustomEvent = () => {
      console.log('Custom lesson report event, refreshing dashboard...');
      fetchDashboardData();
    };
    
    window.addEventListener('lessonReportUpdated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lessonReportUpdated', handleCustomEvent);
    };
  }, []);

const menuItems = [
  {
    icon: Calendar,
    title: "יומן אישי",
    description: "צפייה במערכת השעות והשיעורים הקרובים",
    path: "/calendar",
    gradient: "from-blue-500 to-blue-600",
  },
  user?.user_metadata.role !== "instructor"
    ? {
        icon: BookOpen,
        title: "דיווח שיעור",
        description: "דיווח על שיעור שהתקיים או בתהליך",
        path: "/lesson-report",
        gradient: "from-green-500 to-emerald-600",
      }
    : null,
  {
    icon: Users,
    title: "קורסים",
    description: "ניהול הקורסים והכיתות שלי",
    path: "/courses",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: Users,
    title: "הקצאות",
    description: "צפייה והקצאה של קורסים",
    path: "/course-assignments",
    gradient: "from-indigo-500 to-indigo-600",
  },
 user?.user_metadata.role === "admin"
    ? {
    icon: BarChart3,
    title: "דוחות ושכר",
    description: "צפייה בדוחות חודשיים וחישוב שכר",
    path: "/reports",
    gradient: "from-orange-500 to-red-500",
    }:null ,

  {
    icon: Settings,
    title: "הגדרות פרופיל",
    description: "עריכת פרטים אישיים והגדרות המערכת",
    path: "/profile",
    gradient: "from-gray-500 to-gray-600",
  },
].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="text-lg text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // return (
  //   <>
  //     {/* Mobile View */}
  //     <div className="md:hidden mb-20">
  //       <MobileDashboard stats={stats} lessons={lessons} />
  //     </div>

  //     {/* Desktop View */}
  //     <div className="hidden md:block min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
  //       {/* Main Content */}
  //       <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
  //         {/* Welcome Section */}
  //         <div className="text-center">
  //           {user?.user_metadata.role !== "instructor" ? (
  //             <div>
  //               <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
  //                 ברוך הבא למערכת ניהול המנחים והמרצים
  //               </h2>
  //               <p className="text-gray-600 text-base md:text-lg">ניהול יעיל ומקצועי של המערכת החינוכית</p>
  //             </div>
  //           ) : (
  //             <div>
  //               <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">
  //                 שלום {user?.user_metadata?.full_name || user?.email}
  //               </h2>
  //               <p className="text-gray-600 text-base md:text-lg">ברוכים הבאים לדשבורד המדריכים</p>
  //             </div>
  //           )}
  //         </div>

  //         {/* תגמולים - Rewards Call to Action */}
  //         <Card 
  //           className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border-0 shadow-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden relative active:scale-95"
  //           onClick={() => nav('/rewards')}
  //         >
  //           <div className="absolute top-0 right-0 w-20 md:w-32 h-20 md:h-32 bg-white/10 rounded-full -translate-y-10 md:-translate-y-16 translate-x-10 md:translate-x-16"></div>
  //           <div className="absolute bottom-0 left-0 w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-full translate-y-8 md:translate-y-12 -translate-x-8 md:-translate-x-12"></div>
  //           <CardContent className="p-4 md:p-8 text-center relative z-10">
  //             <div className="flex items-center justify-center mb-3 md:mb-4">
  //               <Award className="h-8 w-8 md:h-12 md:w-12 text-white mr-2 md:mr-4 animate-pulse" />
  //               <div className="text-right">
  //                 <span className="text-2xl md:text-4xl font-bold text-white block">
  //                   ₪{stats.monthlyEarnings.toLocaleString()}
  //                 </span>
  //                 <span className="text-xs md:text-sm text-white/80">זמינים לתגמול</span>
  //               </div>
  //             </div>
  //             <p className="text-white font-bold text-lg md:text-xl mb-2">🏆 לידים שווים מחכים לכם</p>
  //             <p className="text-white/90 text-xs md:text-sm mb-3 md:mb-4">לחצו לצפייה בכל התגמולים הזמינים</p>
  //             <Button 
  //               variant="secondary" 
  //               size="sm"
  //               className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all duration-200 text-xs md:text-sm"
  //             >
  //               צפייה בתגמולים ←
  //             </Button>
  //           </CardContent>
  //         </Card>

  //         {/* Stats Grid */}
  //         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
  //           <StatsCard
  //             title="תלמידים פעילים"
  //             value={stats.activeStudents}
  //             icon={Users}
  //             color="bg-gradient-to-r from-orange-500 to-red-500"
  //           />
  //           <StatsCard
  //             title="שיעורים הושלמו"
  //             value={stats.totalLessons}
  //             icon={Award}
  //             color="bg-gradient-to-r from-green-500 to-emerald-500"
  //           />
  //           <StatsCard
  //             title="קורסים פעילים"
  //             value={stats.activeCourses}
  //             icon={BookOpen}
  //             color="bg-gradient-to-r from-blue-500 to-cyan-500"
  //           />
  //           <StatsCard
  //             title="רווחים חודשיים"
  //             value={`₪${stats.monthlyEarnings.toLocaleString()}`}
  //             icon={BarChart3}
  //             color="bg-gradient-to-r from-purple-500 to-indigo-500"
  //           />
  //         </div>

  //         {/* Main Dashboard Grid */}
  //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
  //           {/* Daily Lessons */}
  //           <div className="lg:col-span-2">
  //             <DailyLessonsCard
  //               dateLabel={new Date().toLocaleDateString('he-IL')}
  //               onAddLesson={() => nav('/courses')}
  //               lessons={lessons}
  //             />
  //           </div>

  //           {/* Quick Stats */}
  //           <div className="space-y-4 md:space-y-6">
  //             <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
  //               <CardHeader className="p-3 md:p-6">
  //                 <CardTitle className="flex items-center text-white text-sm md:text-lg">
  //                   <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2" />
  //                   ביצועים השבוע
  //                 </CardTitle>
  //               </CardHeader>
  //               <CardContent className="p-3 md:p-6 pt-0">
  //                 <div className="space-y-2 md:space-y-3">
  //                   <div className="flex justify-between text-xs md:text-sm">
  //                     <span>שיעורים שהתקיימו</span>
  //                     <span className="font-bold">{stats.totalLessons}</span>
  //                   </div>
  //                   <div className="flex justify-between text-xs md:text-sm">
  //                     <span>נוכחות ממוצעת</span>
  //                     <span className="font-bold">92%</span>
  //                   </div>
  //                   <div className="flex justify-between text-xs md:text-sm">
  //                     <span>דירוג כללי</span>
  //                     <span className="font-bold flex items-center">
  //                       4.8 <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-300 mr-1" />
  //                     </span>
  //                   </div>
  //                 </div>
  //               </CardContent>
  //             </Card>

  //             <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white border-0 shadow-xl">
  //               <CardHeader className="p-3 md:p-6">
  //                 <CardTitle className="flex items-center text-white text-sm md:text-lg">
  //                   <Target className="h-4 w-4 md:h-5 md:w-5 mr-2" />
  //                   יעדים חודשיים
  //                 </CardTitle>
  //               </CardHeader>
  //               <CardContent className="p-3 md:p-6 pt-0">
  //                 <div className="space-y-3 md:space-y-4">
  //                   <div>
  //                     <div className="flex justify-between mb-2 text-xs md:text-sm">
  //                       <span>שיעורים</span>
  //                       <span>15/20</span>
  //                     </div>
  //                     <Progress value={75} className="h-1.5 md:h-2 bg-white/20" />
  //                   </div>
  //                   <div>
  //                     <div className="flex justify-between mb-2 text-xs md:text-sm">
  //                       <span>הכנסות</span>
  //                       <span>₪4,350/₪6,000</span>
  //                     </div>
  //                     <Progress value={72} className="h-1.5 md:h-2 bg-white/20" />
  //                   </div>
  //                 </div>
  //               </CardContent>
  //             </Card>
  //           </div>
  //         </div>

  //         {/* Menu Grid */}
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  //           {menuItems.map((item, index) => (
  //             <Card
  //               key={index}
  //               className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 group"
  //               onClick={() => nav(item.path)}
  //             >
  //               <CardHeader className="pb-3 md:pb-4 p-3 md:p-6">
  //                 <div className="flex items-center">
  //                   <div className={`p-2 md:p-3 bg-gradient-to-r ${item.gradient} rounded-lg mr-3 md:mr-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
  //                     <item.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
  //                   </div>
  //                   <CardTitle className="text-base md:text-lg text-gray-900 group-hover:text-blue-600 transition-colors font-semibold">
  //                     {item.title}
  //                   </CardTitle>
  //                 </div>
  //               </CardHeader>
  //               <CardContent className="p-3 md:p-6 pt-0">
  //                 <CardDescription className="text-xs md:text-sm text-gray-600 leading-relaxed">
  //                   {item.description}
  //                 </CardDescription>
  //               </CardContent>
  //             </Card>
  //           ))}
  //         </div>
  //       </main>
  //     </div>
  //   </>
  // );
return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mb-12">
    <><MobileNavigation/></>
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
      
      {/* Welcome Section */}
      <div className="text-center">
        {user?.user_metadata.role !== "instructor" ? (
          <div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              ברוך הבא למערכת ניהול המנחים והמרצים
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">
              ניהול יעיל ומקצועי של המערכת החינוכית
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-gray-900 mb-2">
              שלום {user?.user_metadata?.full_name || user?.email}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">
              ברוכים הבאים לדשבורד המדריכים
            </p>
          </div>
        )}
        
        {/* Refresh Button */}
        <div className="mt-4">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="bg-white/80 hover:bg-white shadow-md"
          >
            <Calendar className="h-4 w-4 ml-2" />
            רענן דשבורד
          </Button>
        </div>
      </div>

      {/* תגמולים */}
   { user.user_metadata.role==="instructor"&&  <Card 
        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border-0 shadow-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden relative active:scale-95"
        onClick={() => nav('/rewards')}
      >
        <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-32 h-16 sm:h-20 md:h-32 bg-white/10 rounded-full -translate-y-8 sm:-translate-y-10 md:-translate-y-16 translate-x-8 sm:translate-x-10 md:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-12 sm:w-16 md:w-24 h-12 sm:h-16 md:h-24 bg-white/10 rounded-full translate-y-6 sm:translate-y-8 md:translate-y-12 -translate-x-6 sm:-translate-x-8 md:-translate-x-12"></div>
        <CardContent className="p-3 sm:p-4 md:p-8 text-center relative z-10">
          <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
            <Award className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 text-white mr-2 sm:mr-3 md:mr-4 animate-pulse" />
            <div className="text-right">
              <span className="text-xl sm:text-2xl md:text-4xl font-bold text-white block">
                ₪{stats.rewardsTotal.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-white/80">סה״כ תגמולים צפויים</span>
            </div>
          </div>
          <p className="text-white font-bold text-base sm:text-lg md:text-xl mb-2">
            🏆 לידים שווים מחכים לכם
          </p>
          <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4">
            לחצו לצפייה בכל התגמולים הזמינים
          </p>
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all duration-200 text-xs sm:text-sm"
          >
            צפייה בתגמולים ←
          </Button>
        </CardContent>
      </Card>
}
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
         <div className="col-span-3">
          <DailyLessonsCard
            key={`daily-lessons-${weeklyReports.length}-${monthlyReportsCount}`}
            dateLabel={new Date().toLocaleDateString('he-IL')}
            onAddLesson={() => nav('/courses')}
            lessons={lessons}
          />
        </div>
     { user.user_metadata.role!=="instructor"&&   
       <div className="col-span-3">
        <Card 
        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border-0 shadow-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden relative active:scale-95"
        onClick={() => nav('/rewards')}
      >
        <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-32 h-16 sm:h-20 md:h-32 bg-white/10 rounded-full -translate-y-8 sm:-translate-y-10 md:-translate-y-16 translate-x-8 sm:translate-x-10 md:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-12 sm:w-16 md:w-24 h-12 sm:h-16 md:h-24 bg-white/10 rounded-full translate-y-6 sm:translate-y-8 md:translate-y-12 -translate-x-6 sm:-translate-x-8 md:-translate-x-12"></div>
        <CardContent className="p-3 sm:p-4 md:p-8 text-center relative z-10">
          <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
            <Award className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 text-white mr-2 sm:mr-3 md:mr-4 animate-pulse" />
            <div className="text-right">
              <span className="text-xl sm:text-2xl md:text-4xl font-bold text-white block">
                ₪{stats.rewardsTotal.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-white/80">סה״כ תגמולים צפויים למדריכים</span>
            </div>
          </div>
          <p className="text-white font-bold text-base sm:text-lg md:text-xl mb-2">
            🏆      לחצו לצפייה בכלל הלידים הזמינים למדריכים


          </p>
          
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all duration-200 text-xs sm:text-sm"
          >
            צפייה בתגמולים ←
          </Button>
        </CardContent>
      </Card>
      </div>
      }

      {/* Leads Stats Card - Only for Admin and Pedagogical Manager */}
      {(user.user_metadata.role === "admin" || user.user_metadata.role === "pedagogical_manager") && (
        <div className="col-span-3 mb-4">
          <LeadsStatsCard />
        </div>
      )}

        <div className="md:col-span-1 col-span-3">
        <StatsCard  
          title="תלמידים פעילים"
          value={stats.activeStudents}
          icon={Users}
          color="bg-gradient-to-r from-orange-500 to-red-500"
        />
        </div>
         <div className="md:col-span-1 col-span-3 mx-2">
        <StatsCard
          title="שיעורים הושלמו"
          value={weeklyReports.length}
          icon={Award}
          color="bg-gradient-to-r from-green-500 to-emerald-500"
        />
        </div>
         <div className="md:col-span-1 col-span-3">
        <StatsCard
          title="קורסים פעילים"
          value={stats.activeCourses}
          icon={BookOpen}
          color="bg-gradient-to-r from-blue-500 to-cyan-500"
        />
        </div>
        {/* <StatsCard
          title="רווחים חודשיים"
          value={`₪${stats.monthlyEarnings.toLocaleString()}`}
          icon={BarChart3}
          color="bg-gradient-to-r from-purple-500 to-indigo-500"
        /> */}
      </div>

      {/* Main Dashboard Grid */}
    {/* Main Dashboard Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* ביצועים השבוע Card */}
  <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
    <CardHeader className="p-3 md:p-6">
      <CardTitle className="flex items-center text-white text-sm md:text-lg">
        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2" />
        ביצועים השבוע
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 md:p-6 pt-0">
      <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
        <div className="flex justify-between">
          <span>שיעורים שהתקיימו</span>
          <span className="font-bold">{monthlyReportsCount}</span>
        </div>
        {/* <div className="flex justify-between">
          <span>נוכחות ממוצעת</span>
          <span className="font-bold">92%</span>
        </div>
        <div className="flex justify-between">
          <span>דירוג כללי</span>
          <span className="font-bold flex items-center">
            4.8 <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-300 mr-1" />
          </span>
        </div> */}
      </div>
    </CardContent>
  </Card>

  {/* יעדים חודשיים Card */}
  <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white border-0 shadow-xl">
    <CardHeader className="p-3 md:p-6">
      <CardTitle className="flex items-center text-white text-sm md:text-lg">
        <Target className="h-4 w-4 md:h-5 md:w-5 mr-2" />
        יעדים חודשיים
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 md:p-6 pt-0">
      <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
        <div>
          <div className="flex justify-between mb-2">
            <span>שיעורים</span>
            <span>{monthlyReportsCount}/{monthlySchedules}</span>
          </div>
          <Progress value={(monthlyReportsCount/monthlySchedules)*100} className="h-1.5 md:h-2 bg-white/20" />
        </div>
        {/* <div>
          <div className="flex justify-between mb-2">
            <span>הכנסות</span>
            <span>₪4,350/₪6,000</span>
          </div>
          <Progress value={72} className="h-1.5 md:h-2 bg-white/20" />
        </div> */}
      </div>
    </CardContent>
  </Card>
</div>


      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {menuItems.map((item, index) => (
          <Card
            key={index}
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 group"
            onClick={() => nav(item.path)}
          >
            <CardHeader className="pb-3 md:pb-4 p-3 md:p-6">
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 bg-gradient-to-r ${item.gradient} rounded-lg mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 group-hover:text-blue-600 transition-colors font-semibold">
                  {item.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <CardDescription className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {item.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  </div>
);

};

export default Dashboard;