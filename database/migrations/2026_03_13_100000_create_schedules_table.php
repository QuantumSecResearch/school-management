<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject');
            $table->string('day');         // "Lundi"|"Mardi"|"Mercredi"|"Jeudi"|"Vendredi"|"Samedi"
            $table->time('start_time');    // "08:00"
            $table->time('end_time');      // "10:00"
            $table->string('color')->default('#3b82f6'); // couleur hex pour la grille
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
