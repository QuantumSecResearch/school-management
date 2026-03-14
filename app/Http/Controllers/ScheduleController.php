<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Teacher;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    // GET /api/schedules?classroom_id=&teacher_id=
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Schedule::with(['classroom:id,name', 'teacher:id,name']);

        if ($user->isTeacher()) {
            // Un prof ne voit que son propre emploi du temps
            $teacher = Teacher::where('user_id', $user->id)->first();
            if (! $teacher) {
                return response()->json([]);
            }
            $query->where('teacher_id', $teacher->id);
        } elseif ($user->isStudent()) {
            // Un élève voit l'emploi du temps de sa classe active
            $classroomId = $user->student?->activeEnrollment?->classroom_id;
            if (! $classroomId) {
                return response()->json([]);
            }
            $query->where('classroom_id', $classroomId);
        } else {
            // Admin : accès complet avec filtres optionnels
            $query->when($request->classroom_id, fn($q) => $q->where('classroom_id', $request->classroom_id))
                  ->when($request->teacher_id,   fn($q) => $q->where('teacher_id',   $request->teacher_id));
        }

        $schedules = $query->orderByRaw("CASE day
                WHEN 'Lundi'    THEN 1
                WHEN 'Mardi'    THEN 2
                WHEN 'Mercredi' THEN 3
                WHEN 'Jeudi'    THEN 4
                WHEN 'Vendredi' THEN 5
                WHEN 'Samedi'   THEN 6
                ELSE 7 END")
            ->orderBy('start_time')
            ->get();

        return response()->json($schedules);
    }

    // POST /api/schedules
    public function store(Request $request)
    {
        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'teacher_id'   => 'nullable|exists:teachers,id',
            'subject'      => 'required|string|max:100',
            'day'          => 'required|in:Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi',
            'start_time'   => 'required|date_format:H:i',
            'end_time'     => 'required|date_format:H:i|after:start_time',
            'color'        => 'nullable|string|max:20',
        ]);

        $schedule = Schedule::create($validated);
        $schedule->load(['classroom:id,name', 'teacher:id,name']);

        return response()->json($schedule, 201);
    }

    // PUT /api/schedules/{schedule}
    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'classroom_id' => 'sometimes|exists:classrooms,id',
            'teacher_id'   => 'nullable|exists:teachers,id',
            'subject'      => 'sometimes|string|max:100',
            'day'          => 'sometimes|in:Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi',
            'start_time'   => 'sometimes|date_format:H:i',
            'end_time'     => 'sometimes|date_format:H:i',
            'color'        => 'nullable|string|max:20',
        ]);

        $schedule->update($validated);
        $schedule->load(['classroom:id,name', 'teacher:id,name']);

        return response()->json($schedule);
    }

    // DELETE /api/schedules/{schedule}
    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return response()->json(null, 204);
    }
}
