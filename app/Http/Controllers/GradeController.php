<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    // GET /api/grades?student_id=&classroom_id=&subject=
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Grade::with(['student:id,first_name,last_name', 'teacher:id,name', 'classroom:id,name']);

        if ($user->isStudent()) {
            // Un élève ne voit que ses propres notes
            $studentId = $user->student?->id;
            if (! $studentId) {
                return response()->json([]);
            }
            $query->where('student_id', $studentId);
        } elseif ($user->isTeacher()) {
            // Un prof ne voit que les notes de ses classes
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher) {
                return response()->json([]);
            }
            $classroomIds = $teacher->classrooms()->pluck('classrooms.id');
            $query->whereIn('classroom_id', $classroomIds);

            // Filtres additionnels autorisés
            $query->when($request->student_id,   fn($q) => $q->where('student_id',   $request->student_id))
                  ->when($request->classroom_id, fn($q) => $q->whereIn('classroom_id', $classroomIds->intersect([$request->classroom_id])))
                  ->when($request->subject,       fn($q) => $q->where('subject',      $request->subject));
        } else {
            // Admin : accès complet avec filtres optionnels
            $query->when($request->student_id,   fn($q) => $q->where('student_id',   $request->student_id))
                  ->when($request->classroom_id, fn($q) => $q->where('classroom_id', $request->classroom_id))
                  ->when($request->subject,       fn($q) => $q->where('subject',      $request->subject));
        }

        return response()->json($query->orderByDesc('date')->get());
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

        $user    = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        // Un teacher ne peut saisir une note que pour une classe qui lui est affectée
        if ($user->isTeacher()) {
            if (! $teacher) {
                return response()->json(['message' => 'Aucun profil professeur lié à ce compte.'], 403);
            }
            if ($validated['classroom_id'] && ! $teacher->classrooms()->where('classrooms.id', $validated['classroom_id'])->exists()) {
                return response()->json(['message' => 'Vous n\'êtes pas affecté à cette classe.'], 403);
            }
        }

        $validated['teacher_id'] = $teacher?->id;

        $grade = Grade::create($validated);
        $grade->load(['student:id,first_name,last_name', 'teacher:id,name']);

        return response()->json($grade, 201);
    }

    // PUT /api/grades/{grade}
    public function update(Request $request, Grade $grade)
    {
        $user = $request->user();

        // Un teacher ne peut modifier que ses propres saisies
        if ($user->isTeacher()) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher || $grade->teacher_id !== $teacher->id) {
                return response()->json(['message' => 'Vous ne pouvez modifier que vos propres saisies.'], 403);
            }
        }

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
    public function destroy(Request $request, Grade $grade)
    {
        $user = $request->user();

        // Un teacher ne peut supprimer que ses propres saisies
        if ($user->isTeacher()) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher || $grade->teacher_id !== $teacher->id) {
                return response()->json(['message' => 'Vous ne pouvez supprimer que vos propres saisies.'], 403);
            }
        }

        $grade->delete();
        return response()->json(null, 204);
    }

    // GET /api/students/{student}/grades — toutes les notes d'un élève avec moyenne
    public function studentGrades(Request $request, Student $student)
    {
        $user = $request->user();

        // Un élève ne voit que ses propres notes
        if ($user->isStudent() && $user->student?->id !== $student->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Un teacher ne voit que les élèves de ses classes
        if ($user->isTeacher()) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher) {
                return response()->json(['message' => 'Accès refusé.'], 403);
            }
            $classroomIds = $teacher->classrooms()->pluck('classrooms.id');
            $inClass = $student->enrollments()->whereIn('classroom_id', $classroomIds)->exists();
            if (! $inClass) {
                return response()->json(['message' => 'Cet élève n\'est pas dans vos classes.'], 403);
            }
        }

        $grades = $student->grades()
            ->with(['teacher:id,name', 'classroom:id,name'])
            ->orderByDesc('date')
            ->get();

        $average = null;
        if ($grades->count() > 0) {
            $sum     = $grades->sum(fn($g) => ($g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0));
            $average = round($sum / $grades->count(), 2);
        }

        $bySubject = $grades->groupBy('subject')->map(function ($subjectGrades) {
            $avg = $subjectGrades->avg(fn($g) => $g->max_grade > 0 ? ($g->grade / $g->max_grade) * 20 : 0);
            return [
                'grades'  => $subjectGrades,
                'average' => round($avg, 2),
            ];
        });

        return response()->json([
            'student'    => ['id' => $student->id, 'name' => $student->full_name, 'email' => $student->email],
            'grades'     => $grades,
            'by_subject' => $bySubject,
            'average'    => $average,
        ]);
    }
}
