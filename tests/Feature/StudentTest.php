<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin   = User::factory()->create(['role' => 'admin']);
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->student = User::factory()->create(['role' => 'student']);
    }

    // --- INDEX ---

    public function test_guest_cannot_list_students(): void
    {
        $this->getJson('/api/students')
            ->assertUnauthorized();
    }

    public function test_any_authenticated_user_can_list_students(): void
    {
        Student::factory()->count(3)->create();

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/students')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'total']);
    }

    public function test_list_supports_search_by_name(): void
    {
        Student::factory()->create(['name' => 'Youssef Alami',  'email' => 'youssef@example.com']);
        Student::factory()->create(['name' => 'Fatima Zahra',   'email' => 'fatima@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/students?search=Youssef')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Youssef Alami'])
            ->assertJsonMissing(['name' => 'Fatima Zahra']);
    }

    public function test_list_supports_filter_by_classroom(): void
    {
        $classroom = Classroom::factory()->create();
        Student::factory()->create(['classroom_id' => $classroom->id]);
        Student::factory()->create(); // sans classe

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/students?classroom_id={$classroom->id}")
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    // --- STORE ---

    public function test_guest_cannot_create_student(): void
    {
        $this->postJson('/api/students', ['name' => 'Test', 'email' => 'test@example.com'])
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_create_student(): void
    {
        $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/students', [
                'name'  => 'Fatima Zahra',
                'email' => 'fatima@example.com',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_create_student(): void
    {
        $payload = [
            'name'       => 'Youssef Alami',
            'email'      => 'youssef@example.com',
            'phone'      => '0661234567',
            'birth_date' => '2008-05-14',
        ];

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students', $payload)
            ->assertCreated()
            ->assertJsonFragment(['email' => 'youssef@example.com']);

        $this->assertDatabaseHas('students', ['email' => 'youssef@example.com']);
    }

    public function test_admin_can_create_student_with_classroom(): void
    {
        $classroom = Classroom::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students', [
                'name'         => 'Karim Benali',
                'email'        => 'karim@example.com',
                'classroom_id' => $classroom->id,
            ])
            ->assertCreated()
            ->assertJsonFragment(['classroom_id' => $classroom->id]);
    }

    public function test_create_student_requires_name_and_email(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_create_student_email_must_be_unique(): void
    {
        Student::factory()->create(['email' => 'taken@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students', [
                'name'  => 'Another Student',
                'email' => 'taken@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_create_student_classroom_id_must_exist(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students', [
                'name'         => 'Test',
                'email'        => 'test@example.com',
                'classroom_id' => 9999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['classroom_id']);
    }

    // --- SHOW ---

    public function test_authenticated_user_can_view_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/students/{$student->id}")
            ->assertOk()
            ->assertJsonFragment(['email' => $student->email]);
    }

    public function test_returns_404_for_nonexistent_student(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/students/9999')
            ->assertNotFound();
    }

    // --- UPDATE ---

    public function test_non_admin_cannot_update_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->putJson("/api/students/{$student->id}", [
                'name'  => 'Hacked Name',
                'email' => $student->email,
            ])
            ->assertForbidden();
    }

    public function test_admin_can_update_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/students/{$student->id}", [
                'name'  => 'Nom Modifié',
                'email' => $student->email,
            ])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Nom Modifié']);

        $this->assertDatabaseHas('students', ['id' => $student->id, 'name' => 'Nom Modifié']);
    }

    public function test_update_email_unique_ignores_own_record(): void
    {
        $student = Student::factory()->create(['email' => 'mine@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/students/{$student->id}", [
                'name'  => $student->name,
                'email' => 'mine@example.com', // même email, pas de conflit
            ])
            ->assertOk();
    }

    // --- DESTROY ---

    public function test_non_admin_cannot_delete_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->teacher, 'sanctum')
            ->deleteJson("/api/students/{$student->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('students', ['id' => $student->id]);
    }

    public function test_admin_can_delete_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/students/{$student->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('students', ['id' => $student->id]);
    }

    // --- CREATE ACCOUNT ---

    public function test_admin_can_create_account_for_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/students/{$student->id}/account", [
                'email'    => 'student.account@example.com',
                'password' => 'password123',
            ])
            ->assertCreated()
            ->assertJsonFragment(['email' => 'student.account@example.com']);

        $this->assertDatabaseHas('users', ['email' => 'student.account@example.com', 'role' => 'student']);
        $this->assertDatabaseHas('students', ['id' => $student->id, 'user_id' => User::where('email', 'student.account@example.com')->value('id')]);
    }

    public function test_cannot_create_account_if_student_already_has_one(): void
    {
        $user    = User::factory()->create(['role' => 'student']);
        $student = Student::factory()->create(['user_id' => $user->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/students/{$student->id}/account", [
                'email'    => 'new@example.com',
                'password' => 'password123',
            ])
            ->assertUnprocessable()
            ->assertJsonFragment(['error' => 'Cet étudiant a déjà un compte utilisateur.']);
    }
}
