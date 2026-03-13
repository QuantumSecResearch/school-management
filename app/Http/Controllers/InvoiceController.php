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
        $invoices = Invoice::with('student:id,name,email,classroom_id')
            ->when($request->status,     fn($q) => $q->where('status', $request->status))
            ->when($request->student_id, fn($q) => $q->where('student_id', $request->student_id))
            ->when($request->classroom_id, fn($q) => $q->whereHas('student', fn($s) =>
                $s->where('classroom_id', $request->classroom_id)
            ))
            ->orderBy('due_date')
            ->get();

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
        $invoice->load('student:id,name,email');

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

        $students = Student::where('classroom_id', $validated['classroom_id'])->get();

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

        return response()->json($invoice->load('student:id,name,email'));
    }

    // DELETE /api/invoices/{invoice}
    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(null, 204);
    }

    // GET /api/invoices/stats — résumé financier pour le dashboard admin
    public function stats()
    {
        $total    = Invoice::sum('amount');
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
