import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getStudents, deleteStudent } from "@/api/students";
import { Button } from "@/components/ui/button";

export default function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Au chargement : récupère la liste depuis l'API
  useEffect(() => {
    getStudents()
      .then((res) => setStudents(res.data))
      .catch(() => setError("Impossible de charger les étudiants."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, name) {
    // Demande confirmation avant de supprimer
    if (!window.confirm(`Supprimer l'étudiant "${name}" ?`)) return;

    try {
      await deleteStudent(id);
      // Retire l'étudiant de la liste sans recharger la page
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  }

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Étudiants</h1>
          <p className="text-muted-foreground">
            {students.length} étudiant{students.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={() => navigate("/students/create")}>
          + Ajouter un étudiant
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Aucun étudiant pour l'instant.{" "}
          <button
            className="underline text-primary"
            onClick={() => navigate("/students/create")}>
            Ajouter le premier
          </button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nom</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Classe</th>
                <th className="px-4 py-3 text-left font-medium">Téléphone</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr
                  key={student.id}
                  className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                  <td className="px-4 py-3">{student.class}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/students/${student.id}/edit`)}>
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(student.id, student.name)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

