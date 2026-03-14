<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table students — données personnelles uniquement.
 * L'affectation (niveau/filière/classe) est dans enrollments.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('first_name');                    // prénom
            $table->string('last_name');                     // nom de famille
            $table->string('cne')->unique()->nullable();     // Code National de l'Étudiant
            $table->enum('gender', ['M', 'F']);
            $table->date('birth_date')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->unique()->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
