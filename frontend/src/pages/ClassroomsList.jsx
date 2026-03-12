import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { getClassrooms, deleteClassroom } from "@/api/classrooms";
import { Button } from "@/components/ui/button";

export default function ClassroomsList() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    getClassrooms()
      .then((res) => setClassrooms(res.data))
      .catch(() => setError("Impossible de charger les classes."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Supprimer la classe "${name}" ? Ses étudiants seront sans classe.`)) return;
    try {
      await deleteClassroom(id);
      setClassrooms((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  }

  if (loading) return <p className="text-muted-foreground py-10 text-center">Chargement...</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">{classrooms.length} classe{classrooms.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => navigate("/classrooms/create")}>
          + Ajouter une classe
        </Button>
      </div>

      {classrooms.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Aucune classe. <button className="underline text-primary" onClick={() => navigate("/classrooms/create")}>Créer la première</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <div key={classroom.id} className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{classroom.name}</h2>
                  <p className="text-sm text-muted-foreground">{classroom.level} — {classroom.year}</p>
                </div>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                  {classroom.students_count} élève{classroom.students_count !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Profs affectés */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Professeurs :</p>
                {classroom.teachers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun prof affecté</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {classroom.teachers.map((t) => (
                      <span key={t.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {t.name} <span className="text-muted-foreground">({t.subject})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button asChild variant="secondary" size="sm" className="flex-1">
                  <Link to={`/classrooms/${classroom.id}`}>👁 Voir</Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/classrooms/${classroom.id}/edit`)}>
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(classroom.id, classroom.name)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
