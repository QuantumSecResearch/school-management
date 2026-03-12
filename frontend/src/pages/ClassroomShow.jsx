import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getClassroom } from "@/api/classrooms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ClassroomShow() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    getClassroom(id)
      .then((res) => setClassroom(res.data))
      .catch(() => setError("Impossible de charger la classe."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (error)   return <p className="text-red-500">{error}</p>;
  if (!classroom) return null;

  // Filtre les étudiants selon la recherche
  const filteredStudents = (classroom.students ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
          <p className="text-muted-foreground mt-1">
            Niveau : <strong>{classroom.level}</strong> — Année : <strong>{classroom.year}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/classrooms/${id}/edit`}>Modifier</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/classrooms">← Retour</Link>
          </Button>
        </div>
      </div>

      {/* ── Section Professeurs ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Professeurs</h2>
          <span className="text-sm bg-muted px-2 py-0.5 rounded-full">
            {classroom.teachers?.length ?? 0}
          </span>
        </div>

        {classroom.teachers?.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun professeur affecté.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classroom.teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-3 rounded-lg border p-4 bg-card">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section Étudiants ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Étudiants</h2>
          <span className="text-sm bg-muted px-2 py-0.5 rounded-full">
            {classroom.students?.length ?? 0}
          </span>
        </div>

        {/* Barre de recherche */}
        <Input
          placeholder="Rechercher un étudiant par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {classroom.students?.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun étudiant dans cette classe.</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun résultat pour « {search} ».</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/students/${student.id}/edit`}
                        className="text-primary hover:underline text-xs"
                      >
                        Voir / Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
