<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SchoolLevel extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'order'];

    // Un niveau a plusieurs filières
    public function streams()
    {
        return $this->hasMany(Stream::class);
    }
}
