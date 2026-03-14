<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    private function currentAcademicYear(): string
    {
        $month = (int) date('n');
        $year  = (int) date('Y');
        return $month >= 9
            ? "{$year}-" . ($year + 1)
            : ($year - 1) . "-{$year}";
    }

    private function formatStudents(Classroom $classroom): \Illuminate\Support\Collection
    {
        return $classroom->students()
            ->get(['students.id', 'students.first_name', 'students.last_name', 'students.email'])
            ->map(fn($s) => [
                'id'    => $s->id,
                'name'  => $s->full_name,
                'email' => $s->email ?? '',
            ]);
    }

    // GET /api/classrooms
    public function index()
    {
        $classrooms = Classroom::withCount('students')
            ->with(['stream.schoolLevel', 'teachers:id,name,subject'])
            ->latest()
            ->get();

        return response()->json($classrooms);
    }

    // POST /api/classrooms
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'stream_id'     => 'required|exists:streams,id',
            'academic_year' => 'required|string|max:20',
            'capacity'      => 'nullable|integer|min:1|max:200',
        ]);

        $classroom = Classroom::create($validated);
        $classroom->load('stream.schoolLevel');

        return response()->json($classroom, 201);
    }

    // GET /api/classrooms/{id}
    public function show(Classroom $classroom)
    {
        $classroom->load(['stream.schoolLevel', 'teachers:id,name,subject']);
        $students = $this->formatStudents($classroom);

        return response()->json(
            array_merge($classroom->toArray(), ['students' => $students])
        );
    }

    // PUT /api/classrooms/{id}
    public function update(Request $request, Classroom $classroom)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'stream_id'     => 'required|exists:streams,id',
            'academic_year' => 'required|string|max:20',
            'capacity'      => 'nullable|integer|min:1|max:200',
        ]);

        $classroom->update($validated);
        $classroom->load('stream.schoolLevel');

        return response()->json($classroom);
    }

    // DELETE /api/classrooms/{id}
    public function destroy(Classroom $classroom)
    {
        $classroom->delete();
        return response()->json(null, 204);
    }

    // POST /api/classrooms/{id}/teachers
    public function assignTeachers(Request $request, Classroom $classroom)
    {
        $request->validate([
            'teacher_ids'   => 'required|array',
            'teacher_ids.*' => 'exists:teachers,id',
        ]);

        $classroom->teachers()->sync($request->teacher_ids);

        return response()->json([
            'message'  => 'Professeurs affectés avec succès.',
            'teachers' => $classroom->teachers()->get(['id', 'name', 'subject']),
        ]);
    }

    // POST /api/classrooms/{id}/students
    // Affecte des étudiants via le système d'enrollments (pas classroom_id sur students)
    public function assignStudents(Request $request, Classroom $classroom)
    {
        $request->validate([
            'student_ids'   => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $year   = $this->currentAcademicYear();
        $newIds = collect($request->student_ids);

        // IDs actuellement inscrits dans cette classe (actifs)
        $currentIds = Enrollment::where('classroom_id', $classroom->id)
            ->where('academic_year', $year)
            ->where('status', 'active')
            ->pluck('student_id');

        // Retirer les étudiants qui ne sont plus dans la liste
        $toRemove = $currentIds->diff($newIds);
        if ($toRemove->isNotEmpty()) {
            Enrollment::where('classroom_id', $classroom->id)
                ->whereIn('student_id', $toRemove)
                ->where('academic_year', $year)
                ->where('status', 'active')
                ->update(['status' => 'inactive']);
        }

        // Ajouter les nouveaux étudiants
        $toAdd = $newIds->diff($currentIds);
        foreach ($toAdd as $studentId) {
            // Désactiver tout enrollment actif dans une autre classe pour cette année
            Enrollment::where('student_id', $studentId)
                ->where('academic_year', $year)
                ->where('status', 'active')
                ->where('classroom_id', '!=', $classroom->id)
                ->update(['status' => 'inactive']);

            // Créer ou réactiver l'enrollment dans cette classe
            Enrollment::updateOrCreate(
                [
                    'student_id'    => $studentId,
                    'classroom_id'  => $classroom->id,
                    'academic_year' => $year,
                ],
                ['status' => 'active']
            );
        }

        return response()->json([
            'message'  => 'Étudiants affectés avec succès.',
            'students' => $this->formatStudents($classroom),
        ]);
    }
}
