<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Classes — appartiennent à une filière.
 * Exemples : "2ème Bac Sciences Maths - Classe 1", "Classe 2"...
 * On remplace l'ancienne migration qui avait level/year comme strings.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')
                  ->constrained('streams')
                  ->cascadeOnDelete();
            $table->string('name');                          // "Classe 1", "Classe 2", "Groupe A"
            $table->string('academic_year')->default('2025-2026');
            $table->unsignedSmallInteger('capacity')->default(35);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};

