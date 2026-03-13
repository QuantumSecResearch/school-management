<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\Invoice;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // ── Admin dashboard ──────────────────────────────────────
    public function index()
    {
        $classrooms = Classroom::withCount('students')
            ->with('teachers:id,name,subject')
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->level,
                'year'           => $c->year,
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
                'students_without_class' => Student::whereNull('classroom_id')->count(),
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
            ->get(['classrooms.id', 'classrooms.name', 'classrooms.level']);

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
                'student'   => $g->student->first_name . ' ' . $g->student->last_name,
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
        $student = Student::where('user_id', $user->id)->with('classroom:id,name')->first();

        if (! $student) {
            return response()->json(['error' => 'Aucun profil étudiant lié à ce compte.'], 404);
        }

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
        if ($student->classroom_id) {
            $schedule = Schedule::where('classroom_id', $student->classroom_id)
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
                'name'      => $student->name,
                'email'     => $student->email,
                'classroom' => $student->classroom?->name,
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
