<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    // GET /api/students — liste tous les students
    public function index()
    {
        return response()->json(Student::latest()->get());
    }

    // POST /api/students — créer un student
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:students,email',
            'phone'      => 'nullable|string|max:20',
            'class'      => 'required|string|max:100',
            'birth_date' => 'nullable|date',
        ]);

        $student = Student::create($validated);

        return response()->json($student, 201);
    }

    // GET /api/students/{id} — afficher un student
    public function show(Student $student)
    {
        return response()->json($student);
    }

    // PUT /api/students/{id} — modifier un student
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:students,email,' . $student->id,
            'phone'      => 'nullable|string|max:20',
            'class'      => 'required|string|max:100',
            'birth_date' => 'nullable|date',
        ]);

        $student->update($validated);

        return response()->json($student);
    }

    // DELETE /api/students/{id} — supprimer un student
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json(null, 204);
    }
}
