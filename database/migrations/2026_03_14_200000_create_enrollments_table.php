<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Inscriptions — relie un étudiant à une classe pour une année scolaire.
 * Permet l'historique complet : redoublement, transfert, diplôme.
 *
 * Un étudiant peut avoir plusieurs inscriptions (une par an),
 * mais une seule ACTIVE à la fois.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')
                  ->constrained('students')
                  ->cascadeOnDelete();
            $table->foreignId('classroom_id')
                  ->constrained('classrooms')
                  ->cascadeOnDelete();
            $table->string('academic_year');  // "2025-2026"
            $table->enum('status', [
                'active',      // inscrit cette année
                'transferred', // transféré dans un autre établissement
                'graduated',   // diplômé
                'dropped',     // abandon
                'repeated',    // redoublant (année suivante créée)
            ])->default('active');
            $table->date('enrolled_at');
            $table->text('notes')->nullable();  // observations admin
            $table->timestamps();

            // Un étudiant ne peut être actif qu'une seule fois par année
            $table->unique(['student_id', 'academic_year', 'status'], 'unique_active_enrollment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
