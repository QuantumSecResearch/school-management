<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    // GET /api/students?search=...&classroom_id=...&page=1
    public function index(Request $request)
    {
        $search      = $request->query('search');
        $classroomId = $request->query('classroom_id');

        $students = Student::with('classroom:id,name')
            ->latest()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($classroomId, fn($q) => $q->where('classroom_id', $classroomId))
            ->paginate(10);

        return response()->json($students);
    }

    // POST /api/students
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:students,email',
            'phone'        => 'nullable|string|max:20',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'birth_date'   => 'nullable|date',
        ]);

        return response()->json(Student::create($validated), 201);
    }

    // GET /api/students/{id} — afficher un student
    public function show(Student $student)
    {
        return response()->json($student);
    }

    // PUT /api/students/{id}
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:students,email,' . $student->id,
            'phone'        => 'nullable|string|max:20',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'birth_date'   => 'nullable|date',
        ]);

        $student->update($validated);

        return response()->json($student->load('classroom:id,name'));
    }

    // DELETE /api/students/{id} — supprimer un student
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json(null, 204);
    }
}
