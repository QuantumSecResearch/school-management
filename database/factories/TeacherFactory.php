<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TeacherFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'    => fake()->name(),
            'email'   => fake()->unique()->safeEmail(),
            'phone'   => fake()->phoneNumber(),
            'subject' => fake()->randomElement(['Maths', 'Physique', 'Chimie', 'Français', 'Histoire', 'Anglais', 'SVT', 'Philosophie']),
            'status'  => fake()->randomElement(['active', 'active', 'active', 'inactive']), // 75% actif
        ];
    }
}
