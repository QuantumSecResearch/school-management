<?php

use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('students', StudentController::class);
    Route::apiResource('teachers', TeacherController::class);
    Route::apiResource('classrooms', ClassroomController::class);

    // Affecter des profs à une classe
    // POST /api/classrooms/{id}/teachers  body: { teacher_ids: [1,2,3] }
    Route::post('classrooms/{classroom}/teachers', [ClassroomController::class, 'assignTeachers']);
    Route::post('classrooms/{classroom}/students', [ClassroomController::class, 'assignStudents']);
});

