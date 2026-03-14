<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassroomTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin   = User::factory()->create(['role' => 'admin']);
        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    // --- INDEX ---

    public function test_guest_cannot_list_classrooms(): void
    {
        $this->getJson('/api/classrooms')
            ->assertUnauthorized();
    }

    public function test_any_authenticated_user_can_list_classrooms(): void
    {
        Classroom::factory()->count(3)->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/classrooms')
            ->assertOk()
            ->assertJsonCount(3);
    }

    public function test_list_includes_student_count_and_teachers(): void
    {
        $classroom = Classroom::factory()->create();
        Student::factory()->count(5)->create(['classroom_id' => $classroom->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/classrooms')
            ->assertOk();

        $response->assertJsonFragment(['students_count' => 5]);
    }

    // --- STORE ---

    public function test_guest_cannot_create_classroom(): void
    {
        $this->postJson('/api/classrooms', ['name' => 'Test', 'level' => 'X', 'year' => '2025'])
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_create_classroom(): void
    {
        $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/classrooms', [
                'name'  => '3ème B',
                'level' => 'Troisième',
                'year'  => '2025-2026',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_create_classroom(): void
    {
        $payload = [
            'name'  => 'Terminale S',
            'level' => 'Terminale',
            'year'  => '2025-2026',
        ];

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/classrooms', $payload)
            ->assertCreated()
            ->assertJsonFragment(['name' => 'Terminale S']);

        $this->assertDatabaseHas('classrooms', ['name' => 'Terminale S']);
    }

    public function test_create_classroom_requires_all_fields(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/classrooms', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'level', 'year']);
    }

    // --- SHOW ---

    public function test_authenticated_user_can_view_classroom(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->id}")
            ->assertOk()
            ->assertJsonFragment(['name' => $classroom->name]);
    }

    public function test_show_includes_students_and_teachers(): void
    {
        $classroom = Classroom::factory()->create();
        Student::factory()->count(2)->create(['classroom_id' => $classroom->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->id}")
            ->assertOk()
            ->assertJsonStructure(['id', 'name', 'level', 'year', 'students', 'teachers']);
    }

    public function test_returns_404_for_nonexistent_classroom(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/classrooms/9999')
            ->assertNotFound();
    }

    // --- UPDATE ---

    public function test_admin_can_update_classroom(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/classrooms/{$classroom->id}", [
                'name'  => 'Première A',
                'level' => 'Première',
                'year'  => '2025-2026',
            ])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Première A']);

        $this->assertDatabaseHas('classrooms', ['id' => $classroom->id, 'name' => 'Première A']);
    }

    public function test_non_admin_cannot_update_classroom(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->putJson("/api/classrooms/{$classroom->id}", [
                'name'  => 'Hacked',
                'level' => 'X',
                'year'  => '2025',
            ])
            ->assertForbidden();
    }

    // --- DESTROY ---

    public function test_admin_can_delete_classroom(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/classrooms/{$classroom->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('classrooms', ['id' => $classroom->id]);
    }

    public function test_non_admin_cannot_delete_classroom(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->deleteJson("/api/classrooms/{$classroom->id}")
            ->assertForbidden();
    }

    // --- ASSIGN TEACHERS ---

    public function test_admin_can_assign_teachers_to_classroom(): void
    {
        $classroom = Classroom::factory()->create();
        $teachers  = Teacher::factory()->count(2)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/teachers", [
                'teacher_ids' => $teachers->pluck('id')->toArray(),
            ])
            ->assertOk()
            ->assertJsonFragment(['message' => 'Professeurs affectés avec succès.']);

        $this->assertCount(2, $classroom->teachers()->get());
    }

    public function test_assign_teachers_syncs_replacing_previous(): void
    {
        $classroom     = Classroom::factory()->create();
        $oldTeacher    = Teacher::factory()->create();
        $newTeachers   = Teacher::factory()->count(2)->create();
        $classroom->teachers()->attach($oldTeacher->id);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/teachers", [
                'teacher_ids' => $newTeachers->pluck('id')->toArray(),
            ])
            ->assertOk();

        $assignedIds = $classroom->teachers()->pluck('teachers.id')->toArray();
        $this->assertNotContains($oldTeacher->id, $assignedIds);
        $this->assertCount(2, $assignedIds);
    }

    public function test_assign_teachers_requires_valid_ids(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/teachers", [
                'teacher_ids' => [9999],
            ])
            ->assertUnprocessable();
    }

    public function test_non_admin_cannot_assign_teachers(): void
    {
        $classroom = Classroom::factory()->create();
        $teacher   = Teacher::factory()->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/teachers", [
                'teacher_ids' => [$teacher->id],
            ])
            ->assertForbidden();
    }

    // --- ASSIGN STUDENTS ---

    public function test_admin_can_assign_students_to_classroom(): void
    {
        $classroom = Classroom::factory()->create();
        $students  = Student::factory()->count(3)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/students", [
                'student_ids' => $students->pluck('id')->toArray(),
            ])
            ->assertOk()
            ->assertJsonFragment(['message' => 'Étudiants affectés avec succès.']);

        $this->assertEquals(3, $classroom->students()->count());
    }

    public function test_assign_students_removes_previous_assignments(): void
    {
        $classroom  = Classroom::factory()->create();
        $oldStudent = Student::factory()->create(['classroom_id' => $classroom->id]);
        $newStudent = Student::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/students", [
                'student_ids' => [$newStudent->id],
            ])
            ->assertOk();

        $this->assertDatabaseHas('students', ['id' => $oldStudent->id, 'classroom_id' => null]);
        $this->assertDatabaseHas('students', ['id' => $newStudent->id, 'classroom_id' => $classroom->id]);
    }

    public function test_assign_students_requires_valid_ids(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/students", [
                'student_ids' => [9999],
            ])
            ->assertUnprocessable();
    }
}
