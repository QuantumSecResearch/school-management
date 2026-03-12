<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    // GET /api/teachers?search=...&subject=...&page=1
    public function index(Request $request)
    {
        $search  = $request->query('search');
        $subject = $request->query('subject');

        $teachers = Teacher::latest()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($subject, fn($query) => $query->where('subject', $subject))
            ->paginate(10);

        return response()->json($teachers);
    }

    // POST /api/teachers
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|unique:teachers,email',
            'phone'   => 'nullable|string|max:20',
            'subject' => 'required|string|max:100',
            'status'  => 'in:active,inactive',
        ]);

        return response()->json(Teacher::create($validated), 201);
    }

    // GET /api/teachers/{id}
    public function show(Teacher $teacher)
    {
        return response()->json($teacher);
    }

    // PUT /api/teachers/{id}
    public function update(Request $request, Teacher $teacher)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|unique:teachers,email,' . $teacher->id,
            'phone'   => 'nullable|string|max:20',
            'subject' => 'required|string|max:100',
            'status'  => 'in:active,inactive',
        ]);

        $teacher->update($validated);

        return response()->json($teacher);
    }

    // DELETE /api/teachers/{id}
    public function destroy(Teacher $teacher)
    {
        $teacher->delete();

        return response()->json(null, 204);
    }
}
