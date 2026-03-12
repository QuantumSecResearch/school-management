<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'       => fake()->name(),
            'email'      => fake()->unique()->safeEmail(),
            'phone'      => fake()->phoneNumber(),
            'class'      => fake()->randomElement(['3ème A', '3ème B', 'Terminale A', 'Terminale B', '2nde C', '1ère S']),
            'birth_date' => fake()->dateTimeBetween('-20 years', '-15 years')->format('Y-m-d'),
        ];
    }
}
