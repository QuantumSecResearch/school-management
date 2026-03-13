<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'student_id',
        'amount',
        'description',
        'due_date',
        'status',
        'paid_at',
        'note',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at'  => 'datetime',
        'amount'   => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Auto-marquer comme overdue si date dépassée et non payée
    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'pending' && $this->due_date->isPast();
    }

    // Scopes utiles
    public function scopePending($query)  { return $query->where('status', 'pending'); }
    public function scopePaid($query)     { return $query->where('status', 'paid'); }
    public function scopeOverdue($query)  { return $query->where('status', 'overdue'); }
}
