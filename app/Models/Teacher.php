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
        'user_id',
    ];

    // Lié à un compte utilisateur (optionnel)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Un prof enseigne dans plusieurs classes (via table pivot)
    public function classrooms()
    {
        return $this->belongsToMany(Classroom::class);
    }

    public function grades()
    {
        return $this->hasMany(\App\Models\Grade::class);
    }
}
