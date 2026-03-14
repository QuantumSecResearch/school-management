<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = ['stream_id', 'name', 'academic_year', 'capacity'];

    // Une classe appartient à une filière
    public function stream()
    {
        return $this->belongsTo(Stream::class);
    }

    // Accès rapide au niveau via la filière
    public function schoolLevel()
    {
        return $this->hasOneThrough(SchoolLevel::class, Stream::class, 'id', 'id', 'stream_id', 'school_level_id');
    }

    // Une classe a plusieurs inscriptions
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // Les étudiants actuellement inscrits (actifs)
    public function activeStudents()
    {
        return $this->hasManyThrough(Student::class, Enrollment::class, 'classroom_id', 'id', 'id', 'student_id')
                    ->where('enrollments.status', 'active');
    }

    // Alias pour withCount('students') — renvoie les étudiants actifs
    public function students()
    {
        return $this->hasManyThrough(Student::class, Enrollment::class, 'classroom_id', 'id', 'id', 'student_id')
                    ->where('enrollments.status', 'active');
    }

    // Compatibilité avec l'ancien code (teachers pivot)
    public function teachers()
    {
        return $this->belongsToMany(Teacher::class);
    }
}
