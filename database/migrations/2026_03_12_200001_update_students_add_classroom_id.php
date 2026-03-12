<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Supprime l'ancienne colonne "class" (texte libre)
            $table->dropColumn('class');

            // Ajoute classroom_id qui pointe vers la table classrooms
            // nullable() = un étudiant peut exister sans classe (au moment de la création)
            // nullOnDelete() = si la classe est supprimée, classroom_id devient null
            $table->foreignId('classroom_id')
                  ->nullable()
                  ->constrained('classrooms')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropColumn('classroom_id');
            $table->string('class')->nullable();
        });
    }
};
