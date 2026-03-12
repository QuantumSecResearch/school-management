<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'level', 'year'];

    // Une classe a plusieurs étudiants
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    // Une classe a plusieurs professeurs (via table pivot classroom_teacher)
    public function teachers()
    {
        return $this->belongsToMany(Teacher::class);
    }
}
