<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClassroomFactory extends Factory
{
    public function definition(): array
    {
        $levels = ['Sixième', 'Cinquième', 'Quatrième', 'Troisième', 'Seconde', 'Première', 'Terminale'];
        $level  = fake()->randomElement($levels);
        $letter = fake()->randomElement(['A', 'B', 'C']);

        return [
            'name'  => "{$level} {$letter}",
            'level' => $level,
            'year'  => '2025-2026',
        ];
    }
}
