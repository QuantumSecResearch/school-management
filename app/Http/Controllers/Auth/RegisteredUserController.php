<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * - Si aucun utilisateur n'existe encore : le premier compte est créé en admin (bootstrap).
     * - Sinon : seul un admin connecté peut créer un nouveau compte.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): Response
    {
        $caller = $request->user();

        // Autoriser si la base est vide (bootstrap) OU si l'appelant est admin ou super_admin
        if (User::exists() && (! $caller || ! $caller->isAdmin())) {
            abort(403, 'L\'inscription publique est désactivée. Contactez un administrateur.');
        }

        // Rôles autorisés à la création
        $allowedRoles = ['super_admin', 'director', 'school_admin', 'finance_manager', 'teacher', 'student'];

        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role'     => ['nullable', 'string', 'in:'.implode(',', $allowedRoles)],
        ]);

        // Déterminer le rôle :
        // - Premier compte (bootstrap) → super_admin
        // - super_admin peut choisir n'importe quel rôle de la liste
        // - Autres admins (legacy "admin") → teacher par défaut si non précisé
        if (! User::exists()) {
            $role = 'super_admin';
        } elseif ($caller->isSuperAdmin()) {
            $role = $request->input('role', 'teacher');
        } else {
            // legacy admin : peut uniquement créer teacher/student
            $legacyAllowed = ['teacher', 'student'];
            $requested     = $request->input('role', 'teacher');
            $role          = in_array($requested, $legacyAllowed) ? $requested : 'teacher';
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->string('password')),
            'role'     => $role,
        ]);

        event(new Registered($user));

        // Connecter automatiquement uniquement lors du bootstrap (premier compte)
        if (! $caller) {
            Auth::login($user);
        }

        return response()->noContent();
    }
}
