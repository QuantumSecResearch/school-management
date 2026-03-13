<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = [
        'student_id',
        'teacher_id',
        'classroom_id',
        'subject',
        'grade',
        'max_grade',
        'type',
        'date',
        'comment',
    ];

    protected $casts = [
        'grade'     => 'float',
        'max_grade' => 'float',
        'date'      => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    // Retourne la note sur 20 (normalisée)
    public function getOn20Attribute(): float
    {
        if ($this->max_grade == 0) return 0;
        return round(($this->grade / $this->max_grade) * 20, 2);
    }
}
