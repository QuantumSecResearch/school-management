import { useState } from "react";
import { useNavigate } from "react-router";
import { createTeacher } from "@/api/teachers";
import TeacherForm from "@/components/teacher/TeacherForm";

export default function TeacherCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await createTeacher(values);
      navigate("/teachers");
    } catch (error) {
      setServerError(error.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nouveau professeur</h1>
        <p className="text-muted-foreground">Remplis le formulaire pour ajouter un professeur.</p>
      </div>
      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{serverError}</p>
      )}
      <TeacherForm onSubmit={handleSubmit} loading={loading} submitLabel="Créer le professeur" />
    </div>
  );
}
