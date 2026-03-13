<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Student;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    // GET /api/grades?student_id=&classroom_id=&subject=
    public function index(Request $request)
    {
        $grades = Grade::with(['student:id,name', 'teacher:id,name', 'classroom:id,name'])
            ->when($request->student_id,   fn($q) => $q->where('student_id',   $request->student_id))
            ->when($request->classroom_id, fn($q) => $q->where('classroom_id', $request->classroom_id))
            ->when($request->subject,      fn($q) => $q->where('subject',      $request->subject))
            ->orderByDesc('date')
            ->get();

        return response()->json($grades);
    }

    // POST /api/grades
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id'   => 'required|exists:students,id',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'subject'      => 'required|string|max:100',
            'grade'        => 'required|numeric|min:0|max:1000',
            'max_grade'    => 'required|numeric|min:1|max:1000',
            'type'         => 'required|in:contrôle,examen,devoir',
            'date'         => 'required|date',
            'comment'      => 'nullable|string|max:500',
        ]);

        // Le teacher_id = prof connecté (si c'est un teacher)
        $validated['teacher_id'] = $request->user()->teacher?->id;

        $grade = Grade::create($validated);
        $grade->load(['student:id,name', 'teacher:id,name']);

        return response()->json($grade, 201);
    }

    // PUT /api/grades/{grade}
    public function update(Request $request, Grade $grade)
    {
        $validated = $request->validate([
            'subject'   => 'sometimes|string|max:100',
            'grade'     => 'sometimes|numeric|min:0|max:1000',
            'max_grade' => 'sometimes|numeric|min:1|max:1000',
            'type'      => 'sometimes|in:contrôle,examen,devoir',
            'date'      => 'sometimes|date',
            'comment'   => 'nullable|string|max:500',
        ]);

        $grade->update($validated);

        return response()->json($grade);
    }

    // DELETE /api/grades/{grade}
    public function destroy(Grade $grade)
    {
        $grade->delete();
        return response()->json(null, 204);
    }

    // GET /api/students/{student}/grades — toutes les notes d'un élève avec moyenne
    public function studentGrades(Student $student)
    {
        $grades = $student->grades()
            ->with(['teacher:id,name', 'classroom:id,name'])
            ->orderByDesc('date')
            ->get();

        // Calcul de la moyenne (tout ramené sur 20)
        $average = null;
        if ($grades->count() > 0) {
            $sum = $grades->sum(fn($g) => ($g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0));
            $average = round($sum / $grades->count(), 2);
        }

        // Grouper par matière
        $bySubject = $grades->groupBy('subject')->map(function ($subjectGrades) {
            $avg = $subjectGrades->avg(fn($g) => $g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0);
            return [
                'grades'  => $subjectGrades,
                'average' => round($avg, 2),
            ];
        });

        return response()->json([
            'student'    => $student->only('id', 'name', 'email'),
            'grades'     => $grades,
            'by_subject' => $bySubject,
            'average'    => $average,
        ]);
    }
}
