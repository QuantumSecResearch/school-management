<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Obsolète — classroom_id retiré de students car géré par enrollments.
 * Cette migration est conservée vide pour ne pas casser l'historique.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Rien — l'affectation est maintenant dans la table enrollments
    }

    public function down(): void
    {
        //
    }
};

