<?php

namespace App\Http\Controllers;

use App\Models\SchoolLevel;
use App\Models\Stream;
use App\Models\Classroom;
use Illuminate\Http\Request;

class SchoolLevelController extends Controller
{
    // GET /api/school-levels — tous les niveaux avec leurs filières
    public function index()
    {
        $levels = SchoolLevel::orderBy('order')
            ->with(['streams' => fn($q) => $q->orderBy('name')])
            ->get();

        return response()->json($levels);
    }

    // GET /api/school-levels/{level}/streams — filières d'un niveau
    public function streams(SchoolLevel $schoolLevel)
    {
        return response()->json($schoolLevel->streams()->orderBy('name')->get());
    }

    // GET /api/streams/{stream}/classrooms — classes d'une filière (année courante)
    public function classrooms(Request $request, Stream $stream)
    {
        $year = $request->query('year', date('Y') . '-' . (date('Y') + 1));
        

        $classrooms = Classroom::where('stream_id', $stream->id)
            ->where('academic_year', $year)
            ->withCount(['students'])
            ->orderBy('number')
            ->get();

        return response()->json($classrooms);
    }
}
