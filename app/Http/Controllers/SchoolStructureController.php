<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\SchoolLevel;
use App\Models\Stream;
use Illuminate\Http\Request;

class SchoolStructureController extends Controller
{
    // GET /api/school-levels — tous les niveaux triés
    public function levels()
    {
        $levels = SchoolLevel::orderBy('order')->get(['id', 'name', 'code']);
        return response()->json($levels);
    }

    // GET /api/streams?school_level_id=1 — filières d'un niveau
    public function streams(Request $request)
    {
        $streams = Stream::with('schoolLevel:id,name,code')
            ->when(
                $request->query('school_level_id'),
                fn($q, $id) => $q->where('school_level_id', $id)
            )
            ->orderBy('name')
            ->get(['id', 'school_level_id', 'name', 'code']);

        return response()->json($streams);
    }

    // GET /api/classrooms-by-stream?stream_id=3&year=2025-2026 — classes d'une filière
    public function classroomsByStream(Request $request)
    {
        $classrooms = Classroom::withCount('students')
            ->when(
                $request->query('stream_id'),
                fn($q, $id) => $q->where('stream_id', $id)
            )
            ->when(
                $request->query('year'),
                fn($q, $year) => $q->where('academic_year', $year)
            )
            ->orderBy('name')
            ->get(['id', 'stream_id', 'name', 'academic_year', 'capacity']);

        return response()->json($classrooms);
    }
}
