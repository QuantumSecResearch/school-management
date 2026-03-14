<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Invoice;
use App\Models\Schedule;
use App\Models\SchoolLevel;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // ── Dispatcher : redirige vers le bon dashboard selon le rôle ─
    public function index(Request $request)
    {
        $user = $request->user();

        return match (true) {
            $user->isSuperAdmin()    => $this->superAdmin($request),
            $user->isAdmin()         => $this->superAdmin($request),   // legacy
            $user->isDirector()      => $this->director($request),
            $user->isSchoolAdmin()   => $this->schoolAdmin($request),
            $user->isFinanceManager()=> $this->financeManager($request),
            $user->isTeacher()       => $this->teacher($request),
            $user->isStudent()       => $this->student($request),
            default                  => response()->json(['message' => 'Rôle inconnu.'], 403),
        };
    }

    // ══════════════════════════════════════════════════════════════
    //  SUPER ADMIN — vision totale + activité récente
    // ══════════════════════════════════════════════════════════════
    public function superAdmin(Request $request)
    {
        $classrooms = Classroom::withCount('students')
            ->with(['teachers:id,name,subject', 'stream.schoolLevel'])
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->stream?->schoolLevel?->name ?? '—',
                'year'           => $c->academic_year,
                'students_count' => $c->students_count,
                'teachers'       => $c->teachers,
            ]);

        $usersByRole = User::select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        return response()->json([
            'stats' => [
                'students'               => Student::count(),
                'teachers'               => Teacher::count(),
                'classrooms'             => Classroom::count(),
                'students_without_class' => Student::doesntHave('activeEnrollment')->count(),
                'teachers_without_class' => Teacher::doesntHave('classrooms')->count(),
                'users_by_role'          => $usersByRole,
            ],
            'invoices' => $this->financeStats(),
            'classrooms' => $classrooms,
            'recent_activity' => [
                'grades'   => Grade::with('student:id,first_name,last_name', 'teacher:id,name')
                                ->orderByDesc('created_at')->limit(5)->get(),
                'invoices' => Invoice::with('student:id,first_name,last_name')
                                ->orderByDesc('created_at')->limit(5)->get(),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════
    //  DIRECTOR — pilotage stratégique en lecture seule
    // ══════════════════════════════════════════════════════════════
    public function director(Request $request)
    {
        // Effectifs par niveau
        $byLevel = SchoolLevel::with(['streams.classrooms.enrollments' => fn($q) => $q->where('status', 'active')])
            ->get()
            ->map(fn($level) => [
                'level'    => $level->name,
                'code'     => $level->code,
                'students' => $level->streams->flatMap(fn($s) => $s->classrooms)
                                ->flatMap(fn($c) => $c->enrollments)->count(),
            ]);

        // Effectifs par filière
        $byStream = DB::table('enrollments')
            ->join('classrooms', 'enrollments.classroom_id', '=', 'classrooms.id')
            ->join('streams', 'classrooms.stream_id', '=', 'streams.id')
            ->join('school_levels', 'streams.school_level_id', '=', 'school_levels.id')
            ->where('enrollments.status', 'active')
            ->select('streams.name as stream', 'school_levels.name as level', DB::raw('count(*) as students'))
            ->groupBy('streams.id', 'streams.name', 'school_levels.name')
            ->orderBy('school_levels.order')
            ->get();

        // Taux d'occupation des classes
        $occupancy = Classroom::withCount('students')
            ->whereNotNull('capacity')
            ->get()
            ->map(fn($c) => [
                'classroom' => $c->name,
                'students'  => $c->students_count,
                'capacity'  => $c->capacity,
                'rate'      => $c->capacity > 0 ? round($c->students_count / $c->capacity * 100, 1) : 0,
            ]);

        // Moyennes académiques
        $allGrades = Grade::all();
        $globalAvg = null;
        if ($allGrades->count() > 0) {
            $globalAvg = round(
                $allGrades->avg(fn($g) => $g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0),
                2
            );
        }

        // Élèves en difficulté (moyenne < 10/20)
        $struggling = Grade::select('student_id',
                DB::raw('AVG(grade / max_grade * 20) as avg_on20'))
            ->where('max_grade', '>', 0)
            ->groupBy('student_id')
            ->having('avg_on20', '<', 10)
            ->count();

        return response()->json([
            'stats' => [
                'students'                 => Student::count(),
                'teachers'                 => Teacher::count(),
                'classrooms'               => Classroom::count(),
                'teachers_without_class'   => Teacher::doesntHave('classrooms')->count(),
                'students_without_class'   => Student::doesntHave('activeEnrollment')->count(),
                'teacher_assignment_rate'  => Teacher::count() > 0
                    ? round(Teacher::has('classrooms')->count() / Teacher::count() * 100, 1)
                    : 0,
            ],
            'academics' => [
                'global_average'  => $globalAvg,
                'struggling_count'=> $struggling,
            ],
            'by_level'   => $byLevel,
            'by_stream'  => $byStream,
            'occupancy'  => $occupancy,
            'finance'    => $this->financeStats(),
        ]);
    }

    // ══════════════════════════════════════════════════════════════
    //  SCHOOL ADMIN — gestion opérationnelle scolarité
    // ══════════════════════════════════════════════════════════════
    public function schoolAdmin(Request $request)
    {
        // Étudiants par niveau
        $byLevel = DB::table('enrollments')
            ->join('classrooms', 'enrollments.classroom_id', '=', 'classrooms.id')
            ->join('streams', 'classrooms.stream_id', '=', 'streams.id')
            ->join('school_levels', 'streams.school_level_id', '=', 'school_levels.id')
            ->where('enrollments.status', 'active')
            ->select('school_levels.name as level', DB::raw('count(*) as students'))
            ->groupBy('school_levels.id', 'school_levels.name')
            ->orderBy('school_levels.order')
            ->get();

        // Étudiants par filière
        $byStream = DB::table('enrollments')
            ->join('classrooms', 'enrollments.classroom_id', '=', 'classrooms.id')
            ->join('streams', 'classrooms.stream_id', '=', 'streams.id')
            ->where('enrollments.status', 'active')
            ->select('streams.name as stream', DB::raw('count(*) as students'))
            ->groupBy('streams.id', 'streams.name')
            ->get();

        // Classes avec leurs infos
        $classrooms = Classroom::withCount('students')
            ->with(['stream.schoolLevel', 'teachers:id,name'])
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->stream?->schoolLevel?->name ?? '—',
                'students_count' => $c->students_count,
                'capacity'       => $c->capacity,
                'teachers_count' => $c->teachers->count(),
                'has_no_teacher' => $c->teachers->isEmpty(),
            ]);

        // Volume EDT planifié
        $scheduledSlots = Schedule::count();

        return response()->json([
            'stats' => [
                'students'               => Student::count(),
                'teachers'               => Teacher::count(),
                'classrooms'             => Classroom::count(),
                'students_without_class' => Student::doesntHave('activeEnrollment')->count(),
                'teachers_without_class' => Teacher::doesntHave('classrooms')->count(),
                'classes_without_teacher'=> Classroom::doesntHave('teachers')->count(),
                'scheduled_slots'        => $scheduledSlots,
                'assignment_rate'        => Student::count() > 0
                    ? round(Student::has('activeEnrollment')->count() / Student::count() * 100, 1)
                    : 0,
            ],
            'by_level'   => $byLevel,
            'by_stream'  => $byStream,
            'classrooms' => $classrooms,
        ]);
    }

    // ══════════════════════════════════════════════════════════════
    //  FINANCE MANAGER — gestion des paiements
    // ══════════════════════════════════════════════════════════════
    public function financeManager(Request $request)
    {
        $stats = $this->financeStats();

        // Derniers paiements reçus
        $lastPaid = Invoice::paid()
            ->with('student:id,first_name,last_name')
            ->orderByDesc('paid_at')
            ->limit(10)
            ->get()
            ->map(fn($i) => [
                'id'          => $i->id,
                'student'     => $i->student?->full_name ?? '—',
                'amount'      => $i->amount,
                'description' => $i->description,
                'paid_at'     => $i->paid_at,
            ]);

        // Principaux impayés (overdue + montant le plus élevé)
        $unpaid = Invoice::where('status', '!=', 'paid')
            ->with('student:id,first_name,last_name')
            ->orderByDesc('amount')
            ->limit(10)
            ->get()
            ->map(fn($i) => [
                'id'          => $i->id,
                'student'     => $i->student?->full_name ?? '—',
                'amount'      => $i->amount,
                'description' => $i->description,
                'due_date'    => $i->due_date,
                'status'      => $i->status,
            ]);

        // Répartition par niveau
        $byLevel = DB::table('invoices')
            ->join('students', 'invoices.student_id', '=', 'students.id')
            ->join('enrollments', function($j) {
                $j->on('enrollments.student_id', '=', 'students.id')
                  ->where('enrollments.status', 'active');
            })
            ->join('classrooms', 'enrollments.classroom_id', '=', 'classrooms.id')
            ->join('streams', 'classrooms.stream_id', '=', 'streams.id')
            ->join('school_levels', 'streams.school_level_id', '=', 'school_levels.id')
            ->select(
                'school_levels.name as level',
                DB::raw('count(*) as invoice_count'),
                DB::raw('sum(invoices.amount) as total'),
                DB::raw("sum(case when invoices.status='paid' then invoices.amount else 0 end) as paid")
            )
            ->groupBy('school_levels.id', 'school_levels.name')
            ->get();

        return response()->json([
            'stats'       => $stats,
            'last_paid'   => $lastPaid,
            'unpaid'      => $unpaid,
            'by_level'    => $byLevel,
        ]);
    }

    // ══════════════════════════════════════════════════════════════
    //  TEACHER & STUDENT — inchangés
    // ══════════════════════════════════════════════════════════════
    public function teacher(Request $request)
    {
        $user    = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $teacher) {
            return response()->json(['error' => 'Aucun profil professeur lié à ce compte.'], 404);
        }

        $classrooms = $teacher->classrooms()
            ->withCount('students')
            ->with('stream.schoolLevel')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->stream?->schoolLevel?->name ?? '—',
                'students_count' => $c->students_count,
            ]);

        $days = ['Monday'=>'Lundi','Tuesday'=>'Mardi','Wednesday'=>'Mercredi',
                 'Thursday'=>'Jeudi','Friday'=>'Vendredi','Saturday'=>'Samedi','Sunday'=>'Dimanche'];
        $todayFr = $days[now()->format('l')] ?? now()->format('l');

        $todaySchedule = Schedule::where('teacher_id', $teacher->id)
            ->where('day', $todayFr)
            ->with('classroom:id,name')
            ->orderBy('start_time')
            ->get()
            ->map(fn($s) => [
                'id'         => $s->id,
                'subject'    => $s->subject,
                'classroom'  => $s->classroom->name ?? '—',
                'start_time' => $s->start_time,
                'end_time'   => $s->end_time,
                'color'      => $s->color,
            ]);

        $recentGrades = Grade::where('teacher_id', $teacher->id)
            ->with('student:id,first_name,last_name', 'classroom:id,name')
            ->orderByDesc('created_at')->limit(8)->get()
            ->map(fn($g) => [
                'id'        => $g->id,
                'student'   => $g->student->full_name ?? '—',
                'classroom' => $g->classroom->name ?? '—',
                'subject'   => $g->subject,
                'grade'     => $g->grade . '/' . $g->max_grade,
                'date'      => $g->date,
            ]);

        return response()->json([
            'teacher'        => ['id' => $teacher->id, 'name' => $teacher->name],
            'stats'          => [
                'classrooms'     => $classrooms->count(),
                'total_students' => $classrooms->sum('students_count'),
                'grades_given'   => Grade::where('teacher_id', $teacher->id)->count(),
            ],
            'classrooms'     => $classrooms,
            'today_schedule' => $todaySchedule,
            'today'          => $todayFr,
            'recent_grades'  => $recentGrades,
        ]);
    }

    public function student(Request $request)
    {
        $user    = $request->user();
        $student = Student::where('user_id', $user->id)
            ->with('activeEnrollment.classroom:id,name')
            ->first();

        if (! $student) {
            return response()->json(['error' => 'Aucun profil étudiant lié à ce compte.'], 404);
        }

        $activeClassroomId = $student->activeEnrollment?->classroom_id;

        $grades = Grade::where('student_id', $student->id)
            ->orderByDesc('date')->get()
            ->groupBy('subject')
            ->map(function ($subjectGrades, $subject) {
                $avg = $subjectGrades->avg(fn($g) => $g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0);
                return [
                    'subject' => $subject,
                    'average' => round($avg, 2),
                    'count'   => $subjectGrades->count(),
                    'grades'  => $subjectGrades->map(fn($g) => [
                        'grade'     => $g->grade,
                        'max_grade' => $g->max_grade,
                        'on20'      => $g->on20,
                        'type'      => $g->type,
                        'date'      => $g->date?->format('d/m/Y'),
                        'comment'   => $g->comment,
                    ])->values(),
                ];
            })->values();

        $overallAvg = $grades->isNotEmpty() ? round($grades->avg('average'), 2) : null;

        $dayOrder = ['Lundi'=>1,'Mardi'=>2,'Mercredi'=>3,'Jeudi'=>4,'Vendredi'=>5,'Samedi'=>6];
        $schedule = [];
        if ($activeClassroomId) {
            $schedule = Schedule::where('classroom_id', $activeClassroomId)
                ->with('teacher:id,name')->get()
                ->sortBy(fn($s) => ($dayOrder[$s->day] ?? 7) * 10000 + intval(str_replace(':', '', substr($s->start_time, 0, 5))))
                ->groupBy('day')
                ->map(fn($slots, $day) => [
                    'day'   => $day,
                    'slots' => $slots->map(fn($s) => [
                        'subject'    => $s->subject,
                        'teacher'    => $s->teacher->name ?? '—',
                        'start_time' => $s->start_time,
                        'end_time'   => $s->end_time,
                        'color'      => $s->color,
                    ])->values(),
                ])->values();
        }

        $invoices = Invoice::where('student_id', $student->id)->orderByDesc('due_date')->get();
        $invoiceStats = [
            'total'       => $invoices->count(),
            'paid'        => $invoices->where('status', 'paid')->count(),
            'pending'     => $invoices->where('status', 'pending')->count(),
            'overdue'     => $invoices->where('status', 'overdue')->count(),
            'paid_amount' => $invoices->where('status', 'paid')->sum('amount'),
            'due_amount'  => $invoices->whereIn('status', ['pending', 'overdue'])->sum('amount'),
        ];

        return response()->json([
            'student'       => [
                'id'        => $student->id,
                'name'      => $student->full_name,
                'email'     => $student->email,
                'classroom' => $student->activeEnrollment?->classroom?->name,
            ],
            'stats'         => [
                'subjects'     => $grades->count(),
                'overall_avg'  => $overallAvg,
                'grades_count' => Grade::where('student_id', $student->id)->count(),
            ],
            'grades'        => $grades,
            'schedule'      => $schedule,
            'invoices'      => $invoices,
            'invoice_stats' => $invoiceStats,
        ]);
    }

    // ── Helper privé : stats financières réutilisables ────────────
    private function financeStats(): array
    {
        return [
            'total'           => Invoice::count(),
            'paid'            => Invoice::paid()->count(),
            'pending'         => Invoice::pending()->count(),
            'overdue'         => Invoice::overdue()->count(),
            'total_amount'    => Invoice::sum('amount'),
            'paid_amount'     => Invoice::paid()->sum('amount'),
            'pending_amount'  => Invoice::pending()->sum('amount'),
            'overdue_amount'  => Invoice::overdue()->sum('amount'),
            'recovery_rate'   => Invoice::sum('amount') > 0
                ? round(Invoice::paid()->sum('amount') / Invoice::sum('amount') * 100, 1)
                : 0,
        ];
    }
}

    // ── Admin dashboard ──────────────────────────────────────
    public function index()
    {
        $classrooms = Classroom::withCount('students')
            ->with(['teachers:id,name,subject', 'stream.schoolLevel'])
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->stream?->schoolLevel?->name ?? '—',
                'year'           => $c->academic_year,
                'students_count' => $c->students_count,
                'teachers'       => $c->teachers,
            ]);

        // Finances
        $revenue = Invoice::paid()->sum('amount');

        return response()->json([
            'stats' => [
                'students'               => Student::count(),
                'teachers'               => Teacher::count(),
                'classrooms'             => Classroom::count(),
                'students_without_class' => Student::doesntHave('activeEnrollment')->count(),
                'teachers_without_class' => Teacher::doesntHave('classrooms')->count(),
            ],
            'invoices' => [
                'total'   => Invoice::count(),
                'paid'    => Invoice::paid()->count(),
                'pending' => Invoice::pending()->count(),
                'overdue' => Invoice::overdue()->count(),
                'revenue' => $revenue,
            ],
            'classrooms' => $classrooms,
        ]);
    }

    // ── Teacher dashboard ─────────────────────────────────────
    public function teacher(Request $request)
    {
        $user    = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $teacher) {
            return response()->json(['error' => 'Aucun profil professeur lié à ce compte.'], 404);
        }

        // Ses classes
        $classrooms = $teacher->classrooms()
            ->withCount('students')
            ->with('stream.schoolLevel')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->stream?->schoolLevel?->name ?? '—',
                'students_count' => $c->students_count,
            ]);

        // Emploi du temps du jour
        $days = [
            'Monday'    => 'Lundi',
            'Tuesday'   => 'Mardi',
            'Wednesday' => 'Mercredi',
            'Thursday'  => 'Jeudi',
            'Friday'    => 'Vendredi',
            'Saturday'  => 'Samedi',
            'Sunday'    => 'Dimanche',
        ];
        $todayFr = $days[now()->format('l')] ?? now()->format('l');

        $todaySchedule = Schedule::where('teacher_id', $teacher->id)
            ->where('day', $todayFr)
            ->with('classroom:id,name')
            ->orderBy('start_time')
            ->get()
            ->map(fn($s) => [
                'id'         => $s->id,
                'subject'    => $s->subject,
                'classroom'  => $s->classroom->name ?? '—',
                'start_time' => $s->start_time,
                'end_time'   => $s->end_time,
                'color'      => $s->color,
            ]);

        // Notes récentes
        $recentGrades = Grade::where('teacher_id', $teacher->id)
            ->with('student:id,first_name,last_name', 'classroom:id,name')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn($g) => [
                'id'        => $g->id,
                'student'   => $g->student->full_name ?? '—',
                'classroom' => $g->classroom->name ?? '—',
                'subject'   => $g->subject,
                'grade'     => $g->grade . '/' . $g->max_grade,
                'date'      => $g->date,
            ]);

        return response()->json([
            'teacher' => ['id' => $teacher->id, 'name' => $teacher->name],
            'stats'   => [
                'classrooms'     => $classrooms->count(),
                'total_students' => $classrooms->sum('students_count'),
                'grades_given'   => Grade::where('teacher_id', $teacher->id)->count(),
            ],
            'classrooms'     => $classrooms,
            'today_schedule' => $todaySchedule,
            'today'          => $todayFr,
            'recent_grades'  => $recentGrades,
        ]);
    }

    // ── Student dashboard ─────────────────────────────────────
    public function student(Request $request)
    {
        $user    = $request->user();
        $student = Student::where('user_id', $user->id)
            ->with('activeEnrollment.classroom:id,name')
            ->first();

        if (! $student) {
            return response()->json(['error' => 'Aucun profil étudiant lié à ce compte.'], 404);
        }

        $activeClassroomId = $student->activeEnrollment?->classroom_id;

        // Notes groupées par matière
        $grades = Grade::where('student_id', $student->id)
            ->orderByDesc('date')
            ->get()
            ->groupBy('subject')
            ->map(function ($subjectGrades, $subject) {
                $avg = $subjectGrades->avg(
                    fn($g) => $g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0
                );
                return [
                    'subject' => $subject,
                    'average' => round($avg, 2),
                    'count'   => $subjectGrades->count(),
                    'grades'  => $subjectGrades->map(fn($g) => [
                        'grade'     => $g->grade,
                        'max_grade' => $g->max_grade,
                        'on20'      => $g->on20,
                        'type'      => $g->type,
                        'date'      => $g->date?->format('d/m/Y'),
                        'comment'   => $g->comment,
                    ])->values(),
                ];
            })->values();

        $overallAvg = $grades->isNotEmpty()
            ? round($grades->avg('average'), 2)
            : null;

        // Emploi du temps (sa classe)
        $dayOrder = ['Lundi'=>1,'Mardi'=>2,'Mercredi'=>3,'Jeudi'=>4,'Vendredi'=>5,'Samedi'=>6];
        $schedule = [];
        if ($activeClassroomId) {
            $schedule = Schedule::where('classroom_id', $activeClassroomId)
                ->with('teacher:id,name')
                ->get()
                ->sortBy(fn($s) => ($dayOrder[$s->day] ?? 7) * 10000 + intval(str_replace(':', '', substr($s->start_time, 0, 5))))
                ->groupBy('day')
                ->map(fn($slots, $day) => [
                    'day'   => $day,
                    'slots' => $slots->map(fn($s) => [
                        'subject'    => $s->subject,
                        'teacher'    => $s->teacher->name ?? '—',
                        'start_time' => $s->start_time,
                        'end_time'   => $s->end_time,
                        'color'      => $s->color,
                    ])->values(),
                ])->values();
        }

        // Factures
        $invoices = Invoice::where('student_id', $student->id)
            ->orderByDesc('due_date')
            ->get();

        $invoiceStats = [
            'total'       => $invoices->count(),
            'paid'        => $invoices->where('status', 'paid')->count(),
            'pending'     => $invoices->where('status', 'pending')->count(),
            'overdue'     => $invoices->where('status', 'overdue')->count(),
            'paid_amount' => $invoices->where('status', 'paid')->sum('amount'),
            'due_amount'  => $invoices->whereIn('status', ['pending', 'overdue'])->sum('amount'),
        ];

        return response()->json([
            'student' => [
                'id'        => $student->id,
                'name'      => $student->full_name,
                'email'     => $student->email,
                'classroom' => $student->activeEnrollment?->classroom?->name,
            ],
            'stats' => [
                'subjects'    => $grades->count(),
                'overall_avg' => $overallAvg,
                'grades_count'=> Grade::where('student_id', $student->id)->count(),
            ],
            'grades'        => $grades,
            'schedule'      => $schedule,
            'invoices'      => $invoices,
            'invoice_stats' => $invoiceStats,
        ]);
    }
}
