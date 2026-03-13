<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'classroom_id',
        'teacher_id',
        'subject',
        'day',
        'start_time',
        'end_time',
        'color',
    ];

    protected $casts = [
        'start_time' => 'string',
        'end_time'   => 'string',
    ];

    const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}
