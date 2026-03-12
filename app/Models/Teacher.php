<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'status',
    ];
    // Un prof enseigne dans plusieurs classes (via table pivot)
    public function classrooms()
    {
        return $this->belongsToMany(Classroom::class);
    }
}
