<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Niveaux scolaires du lycée marocain.
 * Exemples : Tronc Commun, 1ère Bac, 2ème Bac
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');           // "Tronc Commun", "1ère Bac", "2ème Bac"
            $table->string('code')->unique(); // "TC", "1BAC", "2BAC"
            $table->unsignedTinyInteger('order')->default(0); // pour trier l'affichage
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_levels');
    }
};
