<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Filières (streams) — appartiennent à un niveau scolaire.
 * Exemples : Sciences Mathématiques, Sciences Expérimentales...
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('streams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_level_id')
                  ->constrained('school_levels')
                  ->cascadeOnDelete();
            $table->string('name');           // "Sciences Mathématiques"
            $table->string('code')->unique(); // "SM", "SE", "SEG"...
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('streams');
    }
};
