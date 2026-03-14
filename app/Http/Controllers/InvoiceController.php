<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Student;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    // GET /api/invoices?status=&student_id=&classroom_id=
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Invoice::with('student:id,first_name,last_name,email');

        if ($user->isStudent()) {
            // Un élève ne voit que ses propres factures
            $studentId = $user->student?->id;
            if (! $studentId) {
                return response()->json([]);
            }
            $query->where('student_id', $studentId);
        } elseif ($user->isTeacher() || $user->isSchoolAdmin() || $user->isDirector()) {
            // enseignants et school_admin n'ont pas accès aux factures
            return response()->json(['message' => 'Accès refusé.'], 403);
        } else {
            // super_admin, finance_manager, admin (legacy) : accès complet avec filtres optionnels
            $query->when($request->status,       fn($q) => $q->where('status', $request->status))
                  ->when($request->student_id,   fn($q) => $q->where('student_id', $request->student_id))
                  ->when($request->classroom_id, fn($q) => $q->whereHas('student.activeEnrollment',
                      fn($s) => $s->where('classroom_id', $request->classroom_id)
                  ));
        }

        $invoices = $query->orderBy('due_date')->get();

        // Auto-marquer overdue les factures en retard
        $invoices->each(function ($inv) {
            if ($inv->status === 'pending' && $inv->due_date->isPast()) {
                $inv->update(['status' => 'overdue']);
                $inv->status = 'overdue';
            }
        });

        return response()->json($invoices);
    }

    // POST /api/invoices — créer une facture
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id'  => 'required|exists:students,id',
            'amount'      => 'required|numeric|min:0',
            'description' => 'required|string|max:255',
            'due_date'    => 'required|date',
            'note'        => 'nullable|string|max:500',
        ]);

        $invoice = Invoice::create($validated);
        $invoice->load('student:id,first_name,last_name,email');

        return response()->json($invoice, 201);
    }

    // POST /api/invoices/bulk — créer une facture pour toute une classe
    public function bulk(Request $request)
    {
        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'amount'       => 'required|numeric|min:0',
            'description'  => 'required|string|max:255',
            'due_date'     => 'required|date',
        ]);

        $students = Student::whereHas('activeEnrollment',
            fn($q) => $q->where('classroom_id', $validated['classroom_id'])
        )->get();

        $invoices = $students->map(fn($s) => Invoice::create([
            'student_id'  => $s->id,
            'amount'      => $validated['amount'],
            'description' => $validated['description'],
            'due_date'    => $validated['due_date'],
        ]));

        return response()->json([
            'message' => "{$invoices->count()} factures créées.",
            'count'   => $invoices->count(),
        ], 201);
    }

    // PUT /api/invoices/{invoice} — modifier ou marquer payée
    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'status'      => 'sometimes|in:pending,paid,overdue',
            'amount'      => 'sometimes|numeric|min:0',
            'description' => 'sometimes|string|max:255',
            'due_date'    => 'sometimes|date',
            'note'        => 'nullable|string|max:500',
        ]);

        // Si on marque comme payé, enregistrer la date
        if (isset($validated['status']) && $validated['status'] === 'paid') {
            $validated['paid_at'] = now();
        }

        $invoice->update($validated);

        return response()->json($invoice->load('student:id,first_name,last_name,email'));
    }

    // DELETE /api/invoices/{invoice}
    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(null, 204);
    }

    // GET /api/invoices/stats — résumé financier pour le dashboard admin
    public function stats(Request $request)
    {
        if (! $request->user()->canManageFinance()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $total   = Invoice::sum('amount');
        $paid     = Invoice::paid()->sum('amount');
        $pending  = Invoice::pending()->sum('amount');
        $overdue  = Invoice::overdue()->sum('amount');

        return response()->json([
            'total_expected' => $total,
            'total_paid'     => $paid,
            'total_pending'  => $pending,
            'total_overdue'  => $overdue,
            'count_paid'     => Invoice::paid()->count(),
            'count_pending'  => Invoice::pending()->count(),
            'count_overdue'  => Invoice::overdue()->count(),
        ]);
    }
}
