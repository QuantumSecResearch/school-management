<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Stream extends Model
{
    use HasFactory;

    protected $fillable = ['school_level_id', 'name', 'code'];

    // Une filière appartient à un niveau
    public function schoolLevel()
    {
        return $this->belongsTo(SchoolLevel::class);
    }

    // Une filière a plusieurs classes
    public function classrooms()
    {
        return $this->hasMany(Classroom::class);
    }
}
