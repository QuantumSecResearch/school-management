<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    // ── Helpers de rôle — rôles simples ─────────────────────
    public function isSuperAdmin(): bool    { return $this->role === 'super_admin'; }
    public function isDirector(): bool      { return $this->role === 'director'; }
    public function isSchoolAdmin(): bool   { return $this->role === 'school_admin'; }
    public function isFinanceManager(): bool{ return $this->role === 'finance_manager'; }
    public function isTeacher(): bool       { return $this->role === 'teacher'; }
    public function isStudent(): bool       { return $this->role === 'student'; }

    /** @deprecated Utiliser isSuperAdmin() — conservé pour compatibilité descendante */
    public function isAdmin(): bool         { return $this->role === 'admin' || $this->isSuperAdmin(); }

    /**
     * Vrai pour tout rôle ayant des droits d'administration élargie.
     * Remplace les vérifications isAdmin() dans les controllers.
     */
    public function isAdminLike(): bool
    {
        return in_array($this->role, ['admin', 'super_admin', 'school_admin', 'finance_manager', 'director']);
    }

    /**
     * Vrai pour les rôles qui gèrent la scolarité (étudiants, profs, classes, EDT).
     */
    public function canManageAcademics(): bool
    {
        return in_array($this->role, ['admin', 'super_admin', 'school_admin']);
    }

    /**
     * Vrai pour les rôles qui gèrent les finances (factures, paiements).
     */
    public function canManageFinance(): bool
    {
        return in_array($this->role, ['admin', 'super_admin', 'finance_manager']);
    }

    // Relation : un user peut être lié à un Teacher
    public function teacher()
    {
        return $this->hasOne(\App\Models\Teacher::class);
    }

    // Relation : un user peut être lié à un Student
    public function student()
    {
        return $this->hasOne(\App\Models\Student::class);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
