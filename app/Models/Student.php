<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'class',
        'birth_date',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];
}
