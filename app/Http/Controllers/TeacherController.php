<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    // GET /api/teachers?search=...&subject=...&page=1
    public function index(Request $request)
    {
        $user = $request->user();

        // Un élève n'a pas accès à la liste des professeurs
        if ($user->isStudent()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $search  = $request->query('search');
        $subject = $request->query('subject');

        // Un teacher ne voit que la liste publique (sans données sensibles)
        $columns = $user->isTeacher()
            ? ['id', 'name', 'subject']
            : ['id', 'user_id', 'name', 'email', 'phone', 'subject', 'status', 'created_at', 'updated_at'];

        $teachers = Teacher::select($columns)
            ->latest()
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
    public function show(Request $request, Teacher $teacher)
    {
        $user = $request->user();

        if ($user->isStudent()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Un teacher ne voit que son propre profil complet, les autres sont résumés
        if ($user->isTeacher()) {
            $self = Teacher::where('user_id', $user->id)->first();
            if (! $self || $self->id !== $teacher->id) {
                return response()->json(['id' => $teacher->id, 'name' => $teacher->name, 'subject' => $teacher->subject]);
            }
        }

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

    // POST /api/teachers/{id}/account — créer un compte professeur
    public function createAccount(Request $request, Teacher $teacher)
    {
        if ($teacher->user_id) {
            return response()->json(['error' => 'Ce professeur a déjà un compte utilisateur.'], 422);
        }

        $validated = $request->validate([
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name'     => $teacher->name,
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role'     => 'teacher',
        ]);

        $teacher->update(['user_id' => $user->id]);

        return response()->json([
            'message' => 'Compte professeur créé avec succès.',
            'email'   => $user->email,
        ], 201);
    }
}
