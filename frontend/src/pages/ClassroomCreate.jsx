import { useState } from "react";
import { useNavigate } from "react-router";
import { createClassroom } from "@/api/classrooms";
import ClassroomForm from "@/components/classroom/ClassroomForm";

export default function ClassroomCreate() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  async function handleSubmit(values) {
    setServerErrors({});
    setLoading(true);
    try {
      await createClassroom(values);
      navigate("/classrooms");
    } catch (error) {
      const data = error.response?.data;
      if (data?.errors) {
        setServerErrors(data.errors);
      } else {
        setServerErrors({ _general: data?.message || "Erreur lors de la création." });
      }
    } finally {
      setLoading(false);
    }
  }

  const generalError = serverErrors._general;
  const fieldErrors  = Object.entries(serverErrors)
    .filter(([k]) => k !== "_general")
    .map(([, msgs]) => msgs[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nouvelle classe</h1>
        <p className="text-muted-foreground">Crée une classe puis affecte des professeurs.</p>
      </div>

      {(generalError || fieldErrors.length > 0) && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3 space-y-1">
          {generalError && <p>{generalError}</p>}
          {fieldErrors.map((msg, i) => <p key={i}>• {msg}</p>)}
        </div>
      )}

      <ClassroomForm onSubmit={handleSubmit} loading={loading} submitLabel="Créer la classe" />
    </div>
  );
}
