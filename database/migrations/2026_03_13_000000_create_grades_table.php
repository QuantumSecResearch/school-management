<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('teacher_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();
            $table->foreignId('classroom_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();
            $table->string('subject');            // ex: "Maths", "Physique"
            $table->decimal('grade', 5, 2);       // ex: 15.50
            $table->decimal('max_grade', 5, 2)->default(20); // sur 20 par défaut
            $table->string('type')->default('contrôle'); // "contrôle"|"examen"|"devoir"
            $table->date('date');
            $table->text('comment')->nullable();  // appréciation du prof
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
