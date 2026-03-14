import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getClassroom, assignTeachers } from "@/api/classrooms";
import { getTeachers } from "@/api/teachers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/useRole";

export default function ClassroomShow() {
  const { id } = useParams();
  const { canManageAcademics: isAdmin } = useRole();

  const [classroom, setClassroom] = useState(null);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Affectation profs
  const [allTeachers, setAllTeachers]       = useState([]);
  const [selectedIds, setSelectedIds]       = useState([]); // IDs actuellement affectés
  const [assigning, setAssigning]           = useState(false);
  const [assignSuccess, setAssignSuccess]   = useState("");
  const [assignError, setAssignError]       = useState("");
  const [teacherSearch, setTeacherSearch]   = useState("");

  function reload() {
    return getClassroom(id)
      .then((res) => {
        setClassroom(res.data);
        setSelectedIds(res.data.teachers?.map((t) => t.id) ?? []);
      })
      .catch(() => setError("Impossible de charger la classe."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    if (isAdmin) {
      // Charger tous les profs pour le panneau d'affectation
      getTeachers(1, "", "").then((r) => setAllTeachers(r.data.data ?? []));
    }
  }, [id, isAdmin]);

  function toggleTeacher(teacherId) {
    setSelectedIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  }

  async function handleAssign() {
    setAssignError(""); setAssignSuccess("");
    setAssigning(true);
    try {
      await assignTeachers(id, selectedIds);
      setAssignSuccess("✅ Affectation enregistrée !");
      reload();
    } catch {
      setAssignError("Erreur lors de l'affectation.");
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (error)   return <p className="text-red-500">{error}</p>;
  if (!classroom) return null;

  const filteredStudents = (classroom.students ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAllTeachers = allTeachers.filter((t) =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (t.subject ?? "").toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
          <p className="text-muted-foreground mt-1">
            Niveau : <strong>{classroom.stream?.school_level?.name ?? "—"}</strong>
            {" — "}Filière : <strong>{classroom.stream?.name ?? "—"}</strong>
            {" — "}Année : <strong>{classroom.academic_year}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild variant="outline">
              <Link to={`/classrooms/${id}/edit`}>Modifier</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/classrooms">← Retour</Link>
          </Button>
        </div>
      </div>

      {/* ── Section Professeurs affectés ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Professeurs affectés</h2>
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

      {/* ── Panneau d'affectation (admin uniquement) ── */}
      {isAdmin && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Gérer les professeurs</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cochez les professeurs à affecter à cette classe. Les autres seront retirés.
            </p>
          </div>

          {assignError   && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{assignError}</p>}
          {assignSuccess && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{assignSuccess}</p>}

          {/* Recherche */}
          <Input
            placeholder="Filtrer par nom ou matière..."
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            className="max-w-sm"
          />

          {/* Liste des profs avec checkboxes */}
          <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
            {filteredAllTeachers.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun professeur trouvé.</p>
            ) : filteredAllTeachers.map((teacher) => {
              const checked = selectedIds.includes(teacher.id);
              return (
                <label
                  key={teacher.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    checked ? "bg-primary/5" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    checked={checked}
                    onChange={() => toggleTeacher(teacher.id)}
                  />
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{teacher.subject ?? "—"}</p>
                  </div>
                  {checked && (
                    <span className="text-xs font-medium text-primary shrink-0">Affecté</span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Résumé + bouton */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} professeur{selectedIds.length !== 1 ? "s" : ""} sélectionné{selectedIds.length !== 1 ? "s" : ""}
            </p>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? "Enregistrement..." : "Enregistrer l'affectation"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Section Étudiants ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Étudiants</h2>
          <span className="text-sm bg-muted px-2 py-0.5 rounded-full">
            {classroom.students?.length ?? 0}
          </span>
        </div>

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
