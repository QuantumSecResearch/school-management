import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getTeacher, updateTeacher } from "@/api/teachers";
import TeacherForm from "@/components/teacher/TeacherForm";

export default function TeacherEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    getTeacher(id)
      .then((res) => setTeacher(res.data))
      .catch(() => setServerError("Professeur introuvable."))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await updateTeacher(id, values);
      navigate("/teachers");
    } catch (error) {
      setServerError(error.response?.data?.message || "Erreur lors de la modification.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Modifier le professeur</h1>
        <p className="text-muted-foreground">Modification de {teacher?.name}.</p>
      </div>
      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{serverError}</p>
      )}
      {teacher && (
        <TeacherForm
          defaultValues={{
            name:    teacher.name,
            email:   teacher.email,
            phone:   teacher.phone ?? "",
            subject: teacher.subject,
            status:  teacher.status,
          }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Enregistrer les modifications"
        />
      )}
    </div>
  );
}
