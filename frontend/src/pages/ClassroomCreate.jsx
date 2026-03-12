import { useState } from "react";
import { useNavigate } from "react-router";
import { createClassroom } from "@/api/classrooms";
import ClassroomForm from "@/components/classroom/ClassroomForm";

export default function ClassroomCreate() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await createClassroom(values);
      navigate("/classrooms");
    } catch (error) {
      setServerError(error.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nouvelle classe</h1>
        <p className="text-muted-foreground">Crée une classe puis affecte des professeurs.</p>
      </div>
      {serverError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{serverError}</p>}
      <ClassroomForm onSubmit={handleSubmit} loading={loading} submitLabel="Créer la classe" />
    </div>
  );
}
