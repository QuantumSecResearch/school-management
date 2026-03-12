import { useState } from "react";
import { useNavigate } from "react-router";
import { createStudent } from "@/api/students";
import StudentForm from "@/components/student/StudentForm";

export default function StudentCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await createStudent(values);
      navigate("/students"); // retour à la liste après création
    } catch (error) {
      const msg = error.response?.data?.message || "Erreur lors de la création.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nouvel étudiant</h1>
        <p className="text-muted-foreground">Remplis le formulaire pour ajouter un étudiant.</p>
      </div>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">
          {serverError}
        </p>
      )}

      <StudentForm
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Créer l'étudiant"
      />
    </div>
  );
}
