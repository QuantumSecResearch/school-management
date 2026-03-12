<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Teacher;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    // GET /api/classrooms — liste avec nb d'étudiants et profs
    public function index()
    {
        $classrooms = Classroom::withCount('students')
            ->with('teachers:id,name,subject')
            ->latest()
            ->get();

        return response()->json($classrooms);
    }

    // POST /api/classrooms
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'level' => 'required|string|max:100',
            'year'  => 'required|string|max:20',
        ]);

        return response()->json(Classroom::create($validated), 201);
    }

    // GET /api/classrooms/{id} — classe + ses étudiants + ses profs
    public function show(Classroom $classroom)
    {
        $classroom->load([
            'students:id,name,email,classroom_id',
            'teachers:id,name,subject',
        ]);

        return response()->json($classroom);
    }

    // PUT /api/classrooms/{id}
    public function update(Request $request, Classroom $classroom)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'level' => 'required|string|max:100',
            'year'  => 'required|string|max:20',
        ]);

        $classroom->update($validated);

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
    // Affecter des étudiants à une classe
    // Body: { "student_ids": [1, 2, 3] }
    // Met à jour classroom_id sur chaque étudiant sélectionné
    // Retire les étudiants qui étaient dans cette classe mais ne sont plus dans la liste
    public function assignStudents(Request $request, Classroom $classroom)
    {
        $request->validate([
            'student_ids'   => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        // Retire cette classe des étudiants qui en faisaient partie
        $classroom->students()->update(['classroom_id' => null]);

        // Affecte les étudiants sélectionnés à cette classe
        if (!empty($request->student_ids)) {
            \App\Models\Student::whereIn('id', $request->student_ids)
                ->update(['classroom_id' => $classroom->id]);
        }

        return response()->json([
            'message'  => 'Étudiants affectés avec succès.',
            'students' => $classroom->students()->get(['id', 'name', 'email']),
        ]);
    }
}
