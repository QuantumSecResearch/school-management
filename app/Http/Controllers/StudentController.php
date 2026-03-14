<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    // GET /api/students?search=...&classroom_id=...&page=1
    public function index(Request $request)
    {
        $user        = $request->user();
        $search      = $request->query('search');
        $classroomId = $request->query('classroom_id');

        // Un élève n'a pas accès à la liste
        if ($user->isStudent()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $query = Student::with('activeEnrollment.classroom:id,name')
            ->select('id', 'user_id', 'first_name', 'last_name', 'email', 'phone', 'birth_date', 'created_at', 'updated_at')
            ->latest();

        // Un teacher ne voit que les élèves de ses classes
        if ($user->isTeacher()) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher) {
                return response()->json(['data' => [], 'total' => 0]);
            }
            $allowedClassroomIds = $teacher->classrooms()->pluck('classrooms.id');
            $query->whereHas('activeEnrollment', fn($q) => $q->whereIn('classroom_id', $allowedClassroomIds));

            // Filtrer par classe uniquement si elle appartient au teacher
            if ($classroomId && $allowedClassroomIds->contains($classroomId)) {
                $query->whereHas('activeEnrollment', fn($q) => $q->where('classroom_id', $classroomId));
            }
        } else {
            // Admin : filtre libre
            $query->when($classroomId, fn($q) => $q->whereHas('activeEnrollment', fn($q2) => $q2->where('classroom_id', $classroomId)));
        }

        $query->when($search, function ($q) use ($search) {
            $q->where(function ($q2) use ($search) {
                $q2->where('first_name', 'like', "%{$search}%")
                   ->orWhere('last_name',  'like', "%{$search}%")
                   ->orWhere('email',      'like', "%{$search}%");
            });
        });

        $students = $query->paginate(10);
        $students->getCollection()->transform(fn($s) => $this->formatStudent($s));

        return response()->json($students);
    }

    // GET /api/students/{id}
    public function show(Request $request, Student $student)
    {
        $user = $request->user();

        // Un élève ne voit que son propre profil
        if ($user->isStudent() && $user->student?->id !== $student->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Un teacher ne voit que ses propres élèves
        if ($user->isTeacher()) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher) {
                return response()->json(['message' => 'Accès refusé.'], 403);
            }
            $classroomIds = $teacher->classrooms()->pluck('classrooms.id');
            if (! $student->enrollments()->whereIn('classroom_id', $classroomIds)->exists()) {
                return response()->json(['message' => 'Cet élève n\'est pas dans vos classes.'], 403);
            }
        }

        $student->load('activeEnrollment.classroom:id,name');
        return response()->json($this->formatStudent($student));
    }

    // POST /api/students
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'required|string|max:100',
            'cne'          => 'nullable|string|max:20|unique:students,cne',
            'gender'       => 'required|in:M,F',
            'birth_date'   => 'nullable|date',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email|unique:students,email',
            'address'      => 'nullable|string',
            'classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        $student = Student::create([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'cne'        => $validated['cne'] ?? null,
            'gender'     => $validated['gender'],
            'birth_date' => $validated['birth_date'] ?? null,
            'phone'      => $validated['phone'] ?? null,
            'email'      => $validated['email'] ?? null,
            'address'    => $validated['address'] ?? null,
        ]);

        if (!empty($validated['classroom_id'])) {
            $student->enrollments()->create([
                'classroom_id'  => $validated['classroom_id'],
                'academic_year' => $this->currentAcademicYear(),
                'status'        => 'active',
                'enrolled_at'   => now()->toDateString(),
            ]);
            $student->load('activeEnrollment.classroom:id,name');
        }

        return response()->json($this->formatStudent($student), 201);
    }

    // PUT /api/students/{id}
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'required|string|max:100',
            'cne'          => 'nullable|string|max:20|unique:students,cne,' . $student->id,
            'gender'       => 'required|in:M,F',
            'birth_date'   => 'nullable|date',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email|unique:students,email,' . $student->id,
            'address'      => 'nullable|string',
            'classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        $student->update([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'cne'        => $validated['cne'] ?? null,
            'gender'     => $validated['gender'],
            'birth_date' => $validated['birth_date'] ?? null,
            'phone'      => $validated['phone'] ?? null,
            'email'      => $validated['email'] ?? null,
            'address'    => $validated['address'] ?? null,
        ]);

        if (array_key_exists('classroom_id', $validated)) {
            $this->updateEnrollment($student, $validated['classroom_id']);
        }

        $student->load('activeEnrollment.classroom:id,name');
        return response()->json($this->formatStudent($student));
    }

    // DELETE /api/students/{id}
    public function destroy(Student $student)
    {
        $student->delete();
        return response()->json(null, 204);
    }

    // POST /api/students/{id}/account
    public function createAccount(Request $request, Student $student)
    {
        if ($student->user_id) {
            return response()->json(['error' => 'Cet étudiant a déjà un compte utilisateur.'], 422);
        }

        $validated = $request->validate([
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name'     => $student->full_name,
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role'     => 'student',
        ]);

        $student->update(['user_id' => $user->id]);

        return response()->json([
            'message' => 'Compte étudiant créé avec succès.',
            'email'   => $user->email,
        ], 201);
    }

    // ── Helpers privés ──────────────────────────────────────

    private function formatStudent(Student $student): array
    {
        return [
            'id'           => $student->id,
            'user_id'      => $student->user_id,
            'name'         => $student->full_name,
            'first_name'   => $student->first_name,
            'last_name'    => $student->last_name,
            'cne'          => $student->cne,
            'gender'       => $student->gender,
            'email'        => $student->email,
            'phone'        => $student->phone,
            'birth_date'   => $student->birth_date,
            'address'      => $student->address,
            'class'        => $student->activeEnrollment?->classroom?->name,
            'classroom_id' => $student->activeEnrollment?->classroom_id,
        ];
    }

    private function splitName(string $fullName): array
    {
        $parts = explode(' ', trim($fullName), 2);
        return [$parts[0], $parts[1] ?? ''];
    }

    private function currentAcademicYear(): string
    {
        $year = now()->month >= 9 ? now()->year : now()->year - 1;
        return $year . '-' . ($year + 1);
    }

    private function updateEnrollment(Student $student, ?string $classroomId): void
    {
        $active = $student->activeEnrollment;

        if ($classroomId) {
            if ($active) {
                $active->update(['classroom_id' => $classroomId]);
            } else {
                $student->enrollments()->create([
                    'classroom_id'  => $classroomId,
                    'academic_year' => $this->currentAcademicYear(),
                    'status'        => 'active',
                    'enrolled_at'   => now()->toDateString(),
                ]);
            }
        }
    }
}

