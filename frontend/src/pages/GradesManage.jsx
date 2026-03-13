import { useEffect, useState } from "react";
import { getClassrooms } from "@/api/classrooms";
import { getStudents } from "@/api/students";
import { addGrade, getGrades, deleteGrade } from "@/api/grades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPES    = ["contrôle", "examen", "devoir"];
const SUBJECTS = ["Maths", "Physique", "Chimie", "Français", "Histoire", "Anglais", "SVT", "Philosophie"];

export default function GradesManage() {
  const [classrooms, setClassrooms]     = useState([]);
  const [students, setStudents]         = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [form, setForm] = useState({
    student_id: "", subject: "", grade: "", max_grade: "20",
    type: "contrôle", date: new Date().toISOString().split("T")[0], comment: "",
  });

  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  // Charger les classes au montage
  useEffect(() => {
    getClassrooms().then((r) => setClassrooms(r.data));
    getGrades().then((r) => setRecentGrades(r.data.slice(0, 10)));
  }, []);

  // Charger les élèves quand on choisit une classe
  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    getStudents(1, "", selectedClass).then((r) => setStudents(r.data.data));
  }, [selectedClass]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.student_id) return setError("Choisissez un étudiant.");
    setSaving(true);
    try {
      const res = await addGrade({ ...form, classroom_id: selectedClass || null });
      setSuccess(`✅ Note ajoutée pour ${res.data.student.name} !`);
      // Reset note/commentaire mais garder la classe et matière
      setForm((f) => ({ ...f, student_id: "", grade: "", comment: "" }));
      // Rafraîchir les notes récentes
      getGrades().then((r) => setRecentGrades(r.data.slice(0, 10)));
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer cette note ?")) return;
    await deleteGrade(id);
    setRecentGrades((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Saisir des notes</h1>
        <p className="text-muted-foreground mt-1">Choisissez une classe, puis notez un élève</p>
      </div>

      {/* ── Formulaire ── */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Nouvelle note</h2>

        {error   && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{success}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Classe */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Classe</label>
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setForm(f => ({...f, student_id:""})); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">— Toutes les classes —</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Étudiant */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Étudiant *</label>
            <select value={form.student_id} onChange={(e) => setForm(f => ({...f, student_id: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
              <option value="">— Choisir un étudiant —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {!selectedClass && <p className="text-xs text-muted-foreground">Choisissez d'abord une classe</p>}
          </div>

          {/* Matière */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Matière *</label>
            <select value={form.subject} onChange={(e) => setForm(f => ({...f, subject: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
              <option value="">— Choisir —</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Type *</label>
            <select value={form.type} onChange={(e) => setForm(f => ({...f, type: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Note *</label>
            <div className="flex gap-2 items-center">
              <Input type="number" min="0" step="0.5" value={form.grade}
                onChange={(e) => setForm(f => ({...f, grade: e.target.value}))}
                placeholder="ex: 15" required className="flex-1"/>
              <span className="text-muted-foreground text-sm">/</span>
              <Input type="number" min="1" step="1" value={form.max_grade}
                onChange={(e) => setForm(f => ({...f, max_grade: e.target.value}))}
                className="w-20"/>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" value={form.date}
              onChange={(e) => setForm(f => ({...f, date: e.target.value}))} required/>
          </div>
        </div>

        {/* Commentaire */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Commentaire (optionnel)</label>
          <textarea value={form.comment} onChange={(e) => setForm(f => ({...f, comment: e.target.value}))}
            placeholder="Appréciation du professeur..." rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" maxLength={500}/>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Ajouter la note"}
        </Button>
      </form>

      {/* ── Notes récentes ── */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Notes récentes</h2>
        {recentGrades.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune note enregistrée.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Étudiant</th>
                  <th className="text-left px-4 py-3 font-medium">Matière</th>
                  <th className="text-left px-4 py-3 font-medium">Note</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentGrades.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{g.student?.name ?? "—"}</td>
                    <td className="px-4 py-3">{g.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        (g.grade / g.max_grade) >= 0.5 ? "text-green-600" : "text-red-500"
                      }`}>
                        {g.grade}/{g.max_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{g.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(g.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(g.id)}
                        className="text-xs text-red-500 hover:underline">
                        Supprimer
                      </button>
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
