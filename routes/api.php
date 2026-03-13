<?php

use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/teacher', [DashboardController::class, 'teacher']);
    Route::get('/dashboard/student', [DashboardController::class, 'student']);

    // ── Lecture : tous les utilisateurs connectés ──
    Route::get('students',                        [StudentController::class,  'index']);
    Route::get('students/{student}',              [StudentController::class,  'show']);
    Route::get('students/{student}/grades',       [GradeController::class,   'studentGrades']);
    Route::get('grades',                          [GradeController::class,   'index']);
    Route::get('teachers',                        [TeacherController::class,  'index']);
    Route::get('teachers/{teacher}',              [TeacherController::class,  'show']);
    Route::get('classrooms',                      [ClassroomController::class,'index']);
    Route::get('classrooms/{classroom}',          [ClassroomController::class,'show']);
    Route::get('schedules',                       [ScheduleController::class, 'index']);
    Route::get('invoices',                        [InvoiceController::class,  'index']);
    Route::get('invoices/stats',                  [InvoiceController::class,  'stats']);

    // ── Notes : teacher + admin ──
    Route::middleware('role:admin,teacher')->group(function () {
        Route::post('grades',         [GradeController::class, 'store']);
        Route::put('grades/{grade}',  [GradeController::class, 'update']);
        Route::delete('grades/{grade}',[GradeController::class,'destroy']);
    });

    // ── Écriture : admin seulement ──
    Route::middleware('role:admin')->group(function () {
        Route::post('students',              [StudentController::class,  'store']);
        Route::put('students/{student}',     [StudentController::class,  'update']);
        Route::delete('students/{student}',  [StudentController::class,  'destroy']);
        Route::post('students/{student}/account', [StudentController::class, 'createAccount']);

        Route::post('teachers',              [TeacherController::class,  'store']);
        Route::put('teachers/{teacher}',     [TeacherController::class,  'update']);
        Route::delete('teachers/{teacher}',  [TeacherController::class,  'destroy']);
        Route::post('teachers/{teacher}/account', [TeacherController::class, 'createAccount']);

        Route::post('classrooms',            [ClassroomController::class,'store']);
        Route::put('classrooms/{classroom}', [ClassroomController::class,'update']);
        Route::delete('classrooms/{classroom}',[ClassroomController::class,'destroy']);

        Route::post('classrooms/{classroom}/teachers', [ClassroomController::class,'assignTeachers']);
        Route::post('classrooms/{classroom}/students', [ClassroomController::class,'assignStudents']);

        Route::post('schedules',               [ScheduleController::class, 'store']);
        Route::put('schedules/{schedule}',     [ScheduleController::class, 'update']);
        Route::delete('schedules/{schedule}',  [ScheduleController::class, 'destroy']);

        Route::post('invoices',                [InvoiceController::class, 'store']);
        Route::post('invoices/bulk',           [InvoiceController::class, 'bulk']);
        Route::put('invoices/{invoice}',       [InvoiceController::class, 'update']);
        Route::delete('invoices/{invoice}',    [InvoiceController::class, 'destroy']);
    });
});


