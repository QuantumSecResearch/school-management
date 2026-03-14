<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolLevel;
use App\Models\Stream;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Comptes utilisateurs ────────────────────────────
        // Legacy admin (backward compat)
        $admin = User::firstOrCreate(['email' => 'admin@gmail.com'], [
            'name'              => 'Admin Legacy',
            'password'          => Hash::make('password123'),
            'role'              => 'admin',
            'email_verified_at' => now(),
        ]);

        // Nouveaux rôles métier
        User::firstOrCreate(['email' => 'superadmin@gmail.com'], [
            'name'              => 'Super Administrateur',
            'password'          => Hash::make('password123'),
            'role'              => 'super_admin',
            'email_verified_at' => now(),
        ]);

        User::firstOrCreate(['email' => 'directeur@gmail.com'], [
            'name'              => 'M. Directeur Lycée',
            'password'          => Hash::make('password123'),
            'role'              => 'director',
            'email_verified_at' => now(),
        ]);

        User::firstOrCreate(['email' => 'scolarite@gmail.com'], [
            'name'              => 'Responsable Scolarité',
            'password'          => Hash::make('password123'),
            'role'              => 'school_admin',
            'email_verified_at' => now(),
        ]);

        User::firstOrCreate(['email' => 'finance@gmail.com'], [
            'name'              => 'Responsable Finances',
            'password'          => Hash::make('password123'),
            'role'              => 'finance_manager',
            'email_verified_at' => now(),
        ]);

        $teacherUser = User::firstOrCreate(['email' => 'hassan@gmail.com'], [
            'name'              => 'M. Hassan Lahlou',
            'password'          => Hash::make('password123'),
            'role'              => 'teacher',
            'email_verified_at' => now(),
        ]);

        // ── 2. Niveaux scolaires ───────────────────────────────
        $tc   = SchoolLevel::firstOrCreate(['code' => 'TC'],   ['name' => 'Tronc Commun',           'order' => 1]);
        $bac1 = SchoolLevel::firstOrCreate(['code' => '1BAC'], ['name' => 'Premiere Baccalaureat',  'order' => 2]);
        $bac2 = SchoolLevel::firstOrCreate(['code' => '2BAC'], ['name' => 'Deuxieme Baccalaureat',  'order' => 3]);

        // ── 3. Filieres ───────────────────────────────────────
        $streamsData = [
            ['level' => $tc,   'code' => 'TC-SC',    'name' => 'Tronc Commun Sciences'],
            ['level' => $tc,   'code' => 'TC-LSH',   'name' => 'Tronc Commun Lettres et Sciences Humaines'],
            ['level' => $bac1, 'code' => '1BAC-SM',  'name' => '1ere Bac Sciences Mathematiques'],
            ['level' => $bac1, 'code' => '1BAC-SE',  'name' => '1ere Bac Sciences Experimentales'],
            ['level' => $bac1, 'code' => '1BAC-SEG', 'name' => '1ere Bac Sciences Economiques et Gestion'],
            ['level' => $bac1, 'code' => '1BAC-LSH', 'name' => '1ere Bac Lettres et Sciences Humaines'],
            ['level' => $bac2, 'code' => '2BAC-SM',  'name' => '2eme Bac Sciences Mathematiques'],
            ['level' => $bac2, 'code' => '2BAC-SP',  'name' => '2eme Bac Sciences Physiques'],
            ['level' => $bac2, 'code' => '2BAC-SVT', 'name' => '2eme Bac Sciences de la Vie et de la Terre'],
            ['level' => $bac2, 'code' => '2BAC-SEC', 'name' => '2eme Bac Sciences Economiques'],
            ['level' => $bac2, 'code' => '2BAC-L',   'name' => '2eme Bac Lettres'],
            ['level' => $bac2, 'code' => '2BAC-SH',  'name' => '2eme Bac Sciences Humaines'],
        ];

        foreach ($streamsData as $s) {
            Stream::firstOrCreate(
                ['code' => $s['code']],
                ['school_level_id' => $s['level']->id, 'name' => $s['name']]
            );
        }

        // ── 4. Classes exemples ────────────────────────────────
        $streamSM = Stream::where('code', '2BAC-SM')->first();
        $class1 = Classroom::firstOrCreate(
            ['stream_id' => $streamSM->id, 'name' => 'Classe 1'],
            ['academic_year' => '2025-2026', 'capacity' => 35]
        );
        $class2 = Classroom::firstOrCreate(
            ['stream_id' => $streamSM->id, 'name' => 'Classe 2'],
            ['academic_year' => '2025-2026', 'capacity' => 35]
        );

        // ── 5. Etudiants exemples avec inscriptions ────────────
        $studentsData = [
            ['first_name' => 'Ahmed', 'last_name' => 'Benali',    'cne' => 'G123456', 'gender' => 'M', 'email' => 'ahmed@gmail.com', 'class' => $class1],
            ['first_name' => 'Nadia', 'last_name' => 'Cherkaoui', 'cne' => 'G123457', 'gender' => 'F', 'email' => 'nadia@gmail.com', 'class' => $class1],
            ['first_name' => 'Omar',  'last_name' => 'Fassi',     'cne' => 'G123458', 'gender' => 'M', 'email' => 'omar@gmail.com',  'class' => $class2],
            ['first_name' => 'Zineb', 'last_name' => 'Moussaoui', 'cne' => 'G123459', 'gender' => 'F', 'email' => 'zineb@gmail.com', 'class' => $class2],
        ];

        foreach ($studentsData as $s) {
            $student = Student::firstOrCreate(
                ['email' => $s['email']],
                [
                    'first_name' => $s['first_name'],
                    'last_name'  => $s['last_name'],
                    'cne'        => $s['cne'],
                    'gender'     => $s['gender'],
                    'birth_date' => '2007-05-10',
                    'phone'      => '0612345678',
                ]
            );
            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'academic_year' => '2025-2026'],
                [
                    'classroom_id' => $s['class']->id,
                    'status'       => 'active',
                    'enrolled_at'  => '2025-09-01',
                ]
            );
        }

        // ── 6. Compte etudiant pour tester le role student ────
        $studentUser = User::firstOrCreate(['email' => 'ahmed@gmail.com'], [
            'name'              => 'Ahmed Benali',
            'password'          => Hash::make('password123'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);
        Student::where('email', 'ahmed@gmail.com')->update(['user_id' => $studentUser->id]);

        $this->command->info('OK Donnees de test creees !');
        $this->command->table(
            ['Rôle', 'Email', 'Mot de passe'],
            [
                ['admin (legacy)',   'admin@gmail.com',       'password123'],
                ['super_admin',      'superadmin@gmail.com',  'password123'],
                ['director',         'directeur@gmail.com',   'password123'],
                ['school_admin',     'scolarite@gmail.com',   'password123'],
                ['finance_manager',  'finance@gmail.com',     'password123'],
                ['teacher',          'hassan@gmail.com',      'password123'],
                ['student',          'ahmed@gmail.com',       'password123'],
            ]
        );
    }
}

