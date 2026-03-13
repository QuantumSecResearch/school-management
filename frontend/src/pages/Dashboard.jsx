import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getDashboard, getTeacherDashboard, getStudentDashboard } from "@/api/dashboard";
import { useRole } from "@/context/useRole";

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm space-y-1 border-l-4 ${color}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════
function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError("Impossible de charger le dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-20 text-center text-muted-foreground">Chargement...</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

  const { stats, invoices, classrooms } = data;
  const affectation = stats.students > 0
    ? Math.round(((stats.students - stats.students_without_class) / stats.students) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de l'établissement</p>
      </div>

      {/* Stats école */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">École</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Étudiants"    value={stats.students}   sub={stats.students_without_class > 0 ? `${stats.students_without_class} sans classe` : "Tous affectés ✅"} color="border-l-blue-500" />
          <StatCard label="Professeurs"  value={stats.teachers}   sub={stats.teachers_without_class > 0 ? `${stats.teachers_without_class} sans classe` : "Tous affectés ✅"} color="border-l-green-500" />
          <StatCard label="Classes"      value={stats.classrooms} sub="cette année scolaire" color="border-l-purple-500" />
          <StatCard label="Affectation"  value={`${affectation}%`} sub="étudiants avec classe" color="border-l-orange-500" />
        </div>
      </div>

      {/* Stats finances */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Finances</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total factures" value={invoices.total}   sub="émises" color="border-l-slate-400" />
          <StatCard label="Payées"          value={invoices.paid}    sub="règlements reçus" color="border-l-emerald-500" />
          <StatCard label="En attente"      value={invoices.pending} sub="à percevoir" color="border-l-yellow-500" />
          <StatCard label="Revenus"         value={`${Number(invoices.revenue).toLocaleString()} MAD`} sub="total encaissé" color="border-l-teal-500" />
        </div>
        {invoices.overdue > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
            ⚠️ <strong>{invoices.overdue}</strong> facture(s) en retard —{" "}
            <Link to="/invoices" className="underline font-medium">Voir les paiements</Link>
          </div>
        )}
      </div>

      {/* Tableau des classes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Classes</h2>
          <Link to="/classrooms/create" className="text-sm text-primary hover:underline">+ Nouvelle classe</Link>
        </div>
        {classrooms.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            Aucune classe.{" "}<Link to="/classrooms/create" className="underline text-primary">Créer</Link>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Classe</th>
                  <th className="text-left px-4 py-3 font-medium">Niveau</th>
                  <th className="text-center px-4 py-3 font-medium">Élèves</th>
                  <th className="text-left px-4 py-3 font-medium">Professeurs</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classrooms.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.level}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.students_count === 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.students_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.teachers.length === 0
                        ? <span className="text-xs text-muted-foreground italic">Aucun</span>
                        : <div className="flex flex-wrap gap-1">{c.teachers.map((t) => (
                            <span key={t.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.name}</span>
                          ))}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/classrooms/${c.id}`}       className="text-xs text-primary hover:underline">Voir</Link>
                        <Link to={`/classrooms/${c.id}/edit`}  className="text-xs text-muted-foreground hover:underline">Modifier</Link>
                      </div>
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

// ══════════════════════════════════════════
//  TEACHER DASHBOARD
// ══════════════════════════════════════════
function TeacherDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getTeacherDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error ?? "Impossible de charger le dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-20 text-center text-muted-foreground">Chargement...</p>;
  if (error)   return (
    <div className="py-20 text-center space-y-3">
      <p className="text-red-500">{error}</p>
      <p className="text-sm text-muted-foreground">
        Demandez à l'admin de lier votre compte à un profil professeur.
      </p>
    </div>
  );

  const { teacher, stats, classrooms, today_schedule, today, recent_grades } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bonjour, {teacher.name} 👋</h1>
        <p className="text-muted-foreground mt-1">Votre espace professeur</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mes classes"    value={stats.classrooms}     sub="assignées" color="border-l-purple-500" />
        <StatCard label="Mes étudiants"  value={stats.total_students} sub="au total"  color="border-l-blue-500" />
        <StatCard label="Notes saisies"  value={stats.grades_given}   sub="au total"  color="border-l-green-500" />
      </div>

      {/* Emploi du temps aujourd'hui */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Aujourd'hui — {today}</h2>
        {today_schedule.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
            Aucun cours aujourd'hui 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {today_schedule.map((s) => (
              <div key={s.id}
                className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3"
                style={{ borderLeftColor: s.color || "#6366f1", borderLeftWidth: 4 }}>
                <div className="text-sm font-mono text-muted-foreground w-28 shrink-0">
                  {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                </div>
                <div>
                  <p className="font-medium text-sm">{s.subject}</p>
                  <p className="text-xs text-muted-foreground">{s.classroom}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/schedule" className="text-sm text-primary hover:underline">Voir tout l'emploi du temps →</Link>
      </div>

      {/* Mes classes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mes classes</h2>
          <Link to="/grades" className="text-sm text-primary hover:underline">Saisir des notes →</Link>
        </div>
        {classrooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">Vous n'êtes assigné à aucune classe pour l'instant.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((c) => (
              <Link key={c.id} to={`/classrooms/${c.id}`}
                className="rounded-xl border bg-card p-4 hover:border-primary transition-colors">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.level}</p>
                <p className="mt-2 text-2xl font-bold">{c.students_count}
                  <span className="text-sm font-normal text-muted-foreground ml-1">élèves</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notes récentes */}
      {recent_grades.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Notes récentes</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Étudiant</th>
                  <th className="text-left px-4 py-2 font-medium">Classe</th>
                  <th className="text-left px-4 py-2 font-medium">Matière</th>
                  <th className="text-center px-4 py-2 font-medium">Note</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent_grades.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2">{g.student}</td>
                    <td className="px-4 py-2 text-muted-foreground">{g.classroom}</td>
                    <td className="px-4 py-2">{g.subject}</td>
                    <td className="px-4 py-2 text-center font-mono font-medium">{g.grade}</td>
                    <td className="px-4 py-2 text-muted-foreground">{g.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
//  STUDENT DASHBOARD
// ══════════════════════════════════════════
function StudentDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [openSubject, setOpenSubject] = useState(null);

  useEffect(() => {
    getStudentDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error ?? "Impossible de charger le dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-20 text-center text-muted-foreground">Chargement...</p>;
  if (error)   return <p className="py-20 text-center text-red-500">{error}</p>;

  const { student, stats, grades, schedule, invoices, invoice_stats } = data;

  function avgColor(avg) {
    if (avg === null) return "text-muted-foreground";
    if (avg >= 14) return "text-emerald-600 dark:text-emerald-400";
    if (avg >= 10) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  }

  return (
    <div className="space-y-8">

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bonjour, {student.name} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {student.classroom ? `Classe : ${student.classroom}` : "Aucune classe assignée"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Matières"     value={stats.subjects}    sub="évaluées"    color="border-l-purple-500" />
        <StatCard
          label="Moyenne générale"
          value={stats.overall_avg !== null ? `${stats.overall_avg}/20` : "—"}
          sub={stats.overall_avg !== null
            ? stats.overall_avg >= 10 ? "✅ Validé" : "⚠️ En dessous du seuil"
            : "pas encore de notes"}
          color="border-l-blue-500"
        />
        <StatCard
          label="À payer"
          value={invoice_stats.due_amount > 0 ? `${Number(invoice_stats.due_amount).toLocaleString()} MAD` : "0 MAD"}
          sub={invoice_stats.overdue > 0 ? `⚠️ ${invoice_stats.overdue} en retard` : "À jour ✅"}
          color={invoice_stats.overdue > 0 ? "border-l-red-500" : "border-l-green-500"}
        />
      </div>

      {/* Notes par matière */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Mes notes</h2>
        {grades.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune note enregistrée pour l'instant.
          </div>
        ) : (
          <div className="space-y-2">
            {grades.map((s) => (
              <div key={s.subject} className="rounded-lg border overflow-hidden">
                {/* Ligne matière */}
                <button
                  onClick={() => setOpenSubject(openSubject === s.subject ? null : s.subject)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-xs text-muted-foreground">{s.count} note{s.count > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${avgColor(s.average)}`}>{s.average}/20</span>
                    <span className="text-muted-foreground text-sm">{openSubject === s.subject ? "▲" : "▼"}</span>
                  </div>
                </button>
                {/* Détail des notes */}
                {openSubject === s.subject && (
                  <div className="border-t bg-muted/30">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-center px-4 py-2 font-medium">Note</th>
                          <th className="text-center px-4 py-2 font-medium">/20</th>
                          <th className="text-left px-4 py-2 font-medium">Date</th>
                          <th className="text-left px-4 py-2 font-medium">Commentaire</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {s.grades.map((g, i) => (
                          <tr key={i} className="hover:bg-muted/50">
                            <td className="px-4 py-2 capitalize">{g.type}</td>
                            <td className="px-4 py-2 text-center font-mono">{g.grade}/{g.max_grade}</td>
                            <td className={`px-4 py-2 text-center font-bold ${avgColor(g.on20)}`}>{g.on20}</td>
                            <td className="px-4 py-2 text-muted-foreground">{g.date}</td>
                            <td className="px-4 py-2 text-muted-foreground italic">{g.comment || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emploi du temps */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Mon emploi du temps</h2>
        {schedule.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {student.classroom ? "Aucun créneau planifié." : "Aucune classe assignée."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.map((day) => (
              <div key={day.day} className="rounded-lg border bg-card p-4 space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{day.day}</h3>
                {day.slots.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-muted/50 px-3 py-2"
                    style={{ borderLeftColor: s.color || "#6366f1", borderLeftWidth: 3 }}>
                    <div className="text-xs font-mono text-muted-foreground w-20 shrink-0 pt-0.5">
                      {s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">{s.teacher}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Factures */}
      {invoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Mes factures</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-right px-4 py-2 font-medium">Montant</th>
                  <th className="text-center px-4 py-2 font-medium">Échéance</th>
                  <th className="text-center px-4 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2">{inv.description}</td>
                    <td className="px-4 py-2 text-right font-mono">{Number(inv.amount).toLocaleString()} MAD</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{inv.due_date}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                        ${inv.status === 'paid'    ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                      'bg-yellow-100 text-yellow-700'}`}>
                        {inv.status === 'paid' ? 'Payé' : inv.status === 'overdue' ? 'En retard' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════
//  WRAPPER — choisit le bon dashboard
// ══════════════════════════════════════════
export default function Dashboard() {
  const { isAdmin, isStudent } = useRole();
  if (isAdmin)   return <AdminDashboard />;
  if (isStudent) return <StudentDashboard />;
  return <TeacherDashboard />;
}
