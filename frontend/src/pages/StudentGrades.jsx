import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getStudentGrades } from "@/api/grades";

// Couleur selon la note
function gradeColor(grade, max) {
  const pct = max > 0 ? grade / max : 0;
  if (pct >= 0.8)  return "text-green-600";
  if (pct >= 0.5)  return "text-yellow-600";
  return "text-red-500";
}

export default function StudentGrades() {
  const { id } = useParams();               // /students/:id/grades
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getStudentGrades(id)
      .then((r) => setData(r.data))
      .catch(() => setError("Impossible de charger les notes."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (error)   return <p className="text-red-500">{error}</p>;
  if (!data)   return null;

  const { student, by_subject, average } = data;

  return (
    <div className="space-y-6">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Notes de {student.name}</h1>
          <p className="text-muted-foreground">{student.email}</p>
        </div>
        {/* Moyenne générale */}
        <div className="text-center rounded-xl border bg-card px-6 py-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Moyenne générale</p>
          <p className={`text-4xl font-bold mt-1 ${gradeColor(average ?? 0, 20)}`}>
            {average !== null ? `${average}/20` : "—"}
          </p>
        </div>
      </div>

      {/* ── Par matière ── */}
      {Object.keys(by_subject).length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Aucune note pour cet étudiant.
        </div>
      ) : (
        Object.entries(by_subject).map(([subject, { grades, average: avg }]) => (
          <div key={subject} className="space-y-2">
            {/* En-tête matière */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{subject}</h2>
              <span className={`text-sm font-medium px-3 py-1 rounded-full bg-muted ${gradeColor(avg, 20)}`}>
                Moyenne : {avg}/20
              </span>
            </div>

            {/* Tableau des notes de cette matière */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Note</th>
                    <th className="text-left px-4 py-2 font-medium">Sur 20</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Prof</th>
                    <th className="text-left px-4 py-2 font-medium">Commentaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grades.map((g) => (
                    <tr key={g.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2 capitalize">{g.type}</td>
                      <td className={`px-4 py-2 font-semibold ${gradeColor(g.grade, g.max_grade)}`}>
                        {g.grade}/{g.max_grade}
                      </td>
                      <td className={`px-4 py-2 ${gradeColor(g.grade, g.max_grade)}`}>
                        {g.max_grade > 0 ? Math.round((g.grade / g.max_grade) * 20 * 100) / 100 : "—"}/20
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(g.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{g.teacher?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground italic">{g.comment ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
