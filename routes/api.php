<?php

use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SchoolStructureController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rôles admin élargis — utilisés comme constantes lisibles
// Scolarité : super_admin, school_admin (+ admin legacy)
// Finance   : super_admin, finance_manager (+ admin legacy)
// Lecture   : super_admin, director, school_admin (+ admin legacy)
// Notes     : super_admin, school_admin¹ via teacher (+ admin legacy)  ¹ teacher garde ses droits

Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/user', fn(Request $request) => $request->user());

    // ── Dashboards — chaque rôle a son propre endpoint ──────
    Route::get('/dashboard',                [DashboardController::class, 'index'])        ->middleware('role:admin,super_admin,director,school_admin,finance_manager');
    Route::get('/dashboard/super-admin',    [DashboardController::class, 'superAdmin'])   ->middleware('role:admin,super_admin');
    Route::get('/dashboard/director',       [DashboardController::class, 'director'])     ->middleware('role:director');
    Route::get('/dashboard/school-admin',   [DashboardController::class, 'schoolAdmin'])  ->middleware('role:admin,super_admin,school_admin');
    Route::get('/dashboard/finance',        [DashboardController::class, 'financeManager'])->middleware('role:admin,super_admin,finance_manager');
    Route::get('/dashboard/teacher',        [DashboardController::class, 'teacher'])      ->middleware('role:teacher');
    Route::get('/dashboard/student',        [DashboardController::class, 'student'])      ->middleware('role:student');

    // ── Structure scolaire — lecture tous les rôles admin ───
    Route::get('/school-levels',        [SchoolStructureController::class, 'levels']);
    Route::get('/streams',              [SchoolStructureController::class, 'streams']);
    Route::get('/classrooms-by-stream', [SchoolStructureController::class, 'classroomsByStream']);

    // ── Lecture — tous les utilisateurs connectés ────────────
    Route::get('students',                  [StudentController::class,  'index']);
    Route::get('students/{student}',        [StudentController::class,  'show']);
    Route::get('students/{student}/grades', [GradeController::class,   'studentGrades']);
    Route::get('grades',                    [GradeController::class,   'index']);
    Route::get('teachers',                  [TeacherController::class,  'index']);
    Route::get('teachers/{teacher}',        [TeacherController::class,  'show']);
    Route::get('classrooms',               [ClassroomController::class,'index']);
    Route::get('classrooms/{classroom}',   [ClassroomController::class,'show']);
    Route::get('schedules',                [ScheduleController::class, 'index']);
    Route::get('invoices',                 [InvoiceController::class,  'index']);
    Route::get('invoices/stats',           [InvoiceController::class,  'stats']);

    // ── Notes — teacher + rôles académiques ─────────────────
    Route::middleware('role:admin,super_admin,school_admin,teacher')->group(function () {
        Route::post('grades',              [GradeController::class, 'store']);
        Route::put('grades/{grade}',       [GradeController::class, 'update']);
        Route::delete('grades/{grade}',    [GradeController::class, 'destroy']);
    });

    // ── Scolarité — school_admin + super_admin ───────────────
    Route::middleware('role:admin,super_admin,school_admin')->group(function () {
        Route::post('students',                     [StudentController::class,  'store']);
        Route::put('students/{student}',            [StudentController::class,  'update']);
        Route::delete('students/{student}',         [StudentController::class,  'destroy']);
        Route::post('students/{student}/account',   [StudentController::class,  'createAccount']);

        Route::post('teachers',                     [TeacherController::class,  'store']);
        Route::put('teachers/{teacher}',            [TeacherController::class,  'update']);
        Route::delete('teachers/{teacher}',         [TeacherController::class,  'destroy']);
        Route::post('teachers/{teacher}/account',   [TeacherController::class,  'createAccount']);

        Route::post('classrooms',                   [ClassroomController::class,'store']);
        Route::put('classrooms/{classroom}',        [ClassroomController::class,'update']);
        Route::delete('classrooms/{classroom}',     [ClassroomController::class,'destroy']);
        Route::post('classrooms/{classroom}/teachers', [ClassroomController::class,'assignTeachers']);
        Route::post('classrooms/{classroom}/students', [ClassroomController::class,'assignStudents']);

        Route::post('schedules',                    [ScheduleController::class, 'store']);
        Route::put('schedules/{schedule}',          [ScheduleController::class, 'update']);
        Route::delete('schedules/{schedule}',       [ScheduleController::class, 'destroy']);
    });

    // ── Finance — finance_manager + super_admin ──────────────
    Route::middleware('role:admin,super_admin,finance_manager')->group(function () {
        Route::post('invoices',            [InvoiceController::class, 'store']);
        Route::post('invoices/bulk',       [InvoiceController::class, 'bulk']);
        Route::put('invoices/{invoice}',   [InvoiceController::class, 'update']);
        Route::delete('invoices/{invoice}',[InvoiceController::class, 'destroy']);
    });
});
