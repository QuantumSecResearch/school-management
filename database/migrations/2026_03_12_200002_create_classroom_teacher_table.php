<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classroom_teacher', function (Blueprint $table) {
            // Clé primaire composite : la combinaison classroom_id + teacher_id doit être unique
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->primary(['classroom_id', 'teacher_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_teacher');
    }
};
