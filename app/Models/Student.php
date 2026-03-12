<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'classroom_id',
        'birth_date',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    // Un étudiant appartient à une classe
    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }
}

