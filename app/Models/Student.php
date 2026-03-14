<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'cne',
        'gender',
        'birth_date',
        'phone',
        'email',
        'address',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    // Inclus automatiquement dans le JSON (eager loads avec select partiel)
    protected $appends = ['full_name'];

    // Nom complet calculé
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    // Compte utilisateur lié (optionnel)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Toutes les inscriptions (historique)
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // Inscription active (année en cours)
    public function activeEnrollment()
    {
        return $this->hasOne(Enrollment::class)->where('status', 'active')->latest();
    }

    // Classe actuelle via inscription active
    public function currentClassroom()
    {
        return $this->hasOneThrough(Classroom::class, Enrollment::class, 'student_id', 'id', 'id', 'classroom_id')
                    ->where('enrollments.status', 'active');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}

