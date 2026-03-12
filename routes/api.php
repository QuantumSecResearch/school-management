<?php

use App\Http\Controllers\StudentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // GET /api/user — utilisateur connecté
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // CRUD Students
    // GET    /api/students         → index   (liste)
    // POST   /api/students         → store   (créer)
    // GET    /api/students/{id}    → show    (détail)
    // PUT    /api/students/{id}    → update  (modifier)
    // DELETE /api/students/{id}    → destroy (supprimer)
    Route::apiResource('students', StudentController::class);
});

