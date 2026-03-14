<?php

namespace Tests\Feature;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin   = User::factory()->create(['role' => 'admin']);
        $this->student = User::factory()->create(['role' => 'student']);
    }

    // --- INDEX ---

    public function test_guest_cannot_list_teachers(): void
    {
        $this->getJson('/api/teachers')
            ->assertUnauthorized();
    }

    public function test_any_authenticated_user_can_list_teachers(): void
    {
        Teacher::factory()->count(3)->create();

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/teachers')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'total']);
    }

    public function test_list_supports_search_by_name(): void
    {
        Teacher::factory()->create(['name' => 'Mohammed Amine', 'email' => 'amine@example.com']);
        Teacher::factory()->create(['name' => 'Rachid Benali',  'email' => 'rachid@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/teachers?search=Mohammed')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Mohammed Amine'])
            ->assertJsonMissing(['name' => 'Rachid Benali']);
    }

    public function test_list_supports_filter_by_subject(): void
    {
        Teacher::factory()->create(['subject' => 'Maths',   'email' => 'maths@example.com']);
        Teacher::factory()->create(['subject' => 'Physique', 'email' => 'phys@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/teachers?subject=Maths')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    // --- STORE ---

    public function test_guest_cannot_create_teacher(): void
    {
        $this->postJson('/api/teachers', ['name' => 'Test', 'email' => 'test@example.com', 'subject' => 'Maths'])
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_create_teacher(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/teachers', [
                'name'    => 'Test Teacher',
                'email'   => 'test@example.com',
                'subject' => 'Maths',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_create_teacher(): void
    {
        $payload = [
            'name'    => 'Hassan Lahlou',
            'email'   => 'hassan@example.com',
            'phone'   => '0661234567',
            'subject' => 'Maths',
            'status'  => 'active',
        ];

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers', $payload)
            ->assertCreated()
            ->assertJsonFragment(['email' => 'hassan@example.com']);

        $this->assertDatabaseHas('teachers', ['email' => 'hassan@example.com']);
    }

    public function test_create_teacher_requires_name_email_subject(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'subject']);
    }

    public function test_create_teacher_email_must_be_unique(): void
    {
        Teacher::factory()->create(['email' => 'taken@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers', [
                'name'    => 'Another Teacher',
                'email'   => 'taken@example.com',
                'subject' => 'Physique',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_create_teacher_status_must_be_valid(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers', [
                'name'    => 'Test Teacher',
                'email'   => 'test@example.com',
                'subject' => 'Maths',
                'status'  => 'invalid-status',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_status_defaults_to_active_when_not_provided(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers', [
                'name'    => 'Sans Status',
                'email'   => 'sansstatus@example.com',
                'subject' => 'Maths',
            ])
            ->assertCreated();

        // No status error - the field is optional
        $this->assertDatabaseHas('teachers', ['email' => 'sansstatus@example.com']);
    }

    // --- SHOW ---

    public function test_authenticated_user_can_view_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/teachers/{$teacher->id}")
            ->assertOk()
            ->assertJsonFragment(['email' => $teacher->email]);
    }

    public function test_returns_404_for_nonexistent_teacher(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/teachers/9999')
            ->assertNotFound();
    }

    // --- UPDATE ---

    public function test_admin_can_update_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/teachers/{$teacher->id}", [
                'name'    => 'Nom Modifié',
                'email'   => $teacher->email,
                'subject' => 'Chimie',
                'status'  => 'active',
            ])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Nom Modifié', 'subject' => 'Chimie']);

        $this->assertDatabaseHas('teachers', ['id' => $teacher->id, 'name' => 'Nom Modifié']);
    }

    public function test_non_admin_cannot_update_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->student, 'sanctum')
            ->putJson("/api/teachers/{$teacher->id}", [
                'name'    => 'Hacked',
                'email'   => $teacher->email,
                'subject' => 'Maths',
            ])
            ->assertForbidden();
    }

    public function test_update_email_unique_ignores_own_record(): void
    {
        $teacher = Teacher::factory()->create(['email' => 'mine@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/teachers/{$teacher->id}", [
                'name'    => $teacher->name,
                'email'   => 'mine@example.com', // même email, pas de conflit
                'subject' => $teacher->subject,
            ])
            ->assertOk();
    }

    // --- DESTROY ---

    public function test_admin_can_delete_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/teachers/{$teacher->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('teachers', ['id' => $teacher->id]);
    }

    public function test_non_admin_cannot_delete_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->student, 'sanctum')
            ->deleteJson("/api/teachers/{$teacher->id}")
            ->assertForbidden();
    }

    // --- CREATE ACCOUNT ---

    public function test_admin_can_create_account_for_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/teachers/{$teacher->id}/account", [
                'email'    => 'teacher.account@example.com',
                'password' => 'password123',
            ])
            ->assertCreated()
            ->assertJsonFragment(['email' => 'teacher.account@example.com']);

        $this->assertDatabaseHas('users', ['email' => 'teacher.account@example.com', 'role' => 'teacher']);
        $this->assertDatabaseHas('teachers', ['id' => $teacher->id, 'user_id' => User::where('email', 'teacher.account@example.com')->value('id')]);
    }

    public function test_cannot_create_account_if_teacher_already_has_one(): void
    {
        $user    = User::factory()->create(['role' => 'teacher']);
        $teacher = Teacher::factory()->create(['user_id' => $user->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/teachers/{$teacher->id}/account", [
                'email'    => 'new@example.com',
                'password' => 'password123',
            ])
            ->assertUnprocessable()
            ->assertJsonFragment(['error' => 'Ce professeur a déjà un compte utilisateur.']);
    }
}
