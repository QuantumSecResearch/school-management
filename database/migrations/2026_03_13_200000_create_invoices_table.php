<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);          // montant en €
            $table->string('description');             // ex: "Frais de scolarité T1 2025-2026"
            $table->date('due_date');                  // date limite de paiement
            $table->string('status')->default('pending'); // "pending"|"paid"|"overdue"
            $table->timestamp('paid_at')->nullable();  // date du paiement
            $table->text('note')->nullable();          // note admin
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
