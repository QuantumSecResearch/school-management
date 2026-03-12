import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getStudent, updateStudent } from "@/api/students";
import StudentForm from "@/components/student/StudentForm";

export default function StudentEdit() {
  const { id } = useParams(); // récupère l'id depuis l'URL /students/:id/edit
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [serverError, setServerError] = useState("");

  // Charge les données de l'étudiant au chargement de la page
  useEffect(() => {
    getStudent(id)
      .then((res) => setStudent(res.data))
      .catch(() => setServerError("Étudiant introuvable."))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await updateStudent(id, values);
      navigate("/students"); // retour à la liste après modification
    } catch (error) {
      const msg = error.response?.data?.message || "Erreur lors de la modification.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Modifier l'étudiant</h1>
        <p className="text-muted-foreground">Modifie les informations de {student?.name}.</p>
      </div>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">
          {serverError}
        </p>
      )}

      {student && (
        <StudentForm
          defaultValues={{
            name:       student.name,
            email:      student.email,
            phone:      student.phone ?? "",
            class:      student.class,
            birth_date: student.birth_date ?? "",
          }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Enregistrer les modifications"
        />
      )}
    </div>
  );
}
