import { useEffect, useState } from "react";
import { getSchedules, addSchedule, deleteSchedule } from "@/api/schedules";
import { getClassrooms } from "@/api/classrooms";
import { getTeachers } from "@/api/teachers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router";

const DAYS     = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const SUBJECTS = ["Maths", "Physique", "Chimie", "Français", "Histoire", "Anglais", "SVT", "Philosophie"];
const COLORS   = [
  { label: "Bleu",   value: "#3b82f6" },
  { label: "Vert",   value: "#22c55e" },
  { label: "Violet", value: "#a855f7" },
  { label: "Orange", value: "#f97316" },
  { label: "Rose",   value: "#ec4899" },
  { label: "Cyan",   value: "#06b6d4" },
];

export default function ScheduleManage() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers]     = useState([]);
  const [schedules, setSchedules]   = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [form, setForm] = useState({
    classroom_id: "", teacher_id: "", subject: "",
    day: "Lundi", start_time: "08:00", end_time: "10:00", color: "#3b82f6",
  });

  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    getClassrooms().then((r) => {
      setClassrooms(r.data);
      if (r.data.length > 0) {
        setSelectedClass(String(r.data[0].id));
        setForm((f) => ({ ...f, classroom_id: String(r.data[0].id) }));
      }
    });
    getTeachers(1, "", "").then((r) => setTeachers(r.data.data));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    getSchedules({ classroom_id: selectedClass }).then((r) => setSchedules(r.data));
  }, [selectedClass]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const res = await addSchedule({ ...form, classroom_id: selectedClass });
      setSchedules((prev) => [...prev, res.data]);
      setSuccess("✅ Créneau ajouté !");
      setForm((f) => ({ ...f, subject: "", teacher_id: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer ce créneau ?")) return;
    await deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  // Grouper les créneaux par jour
  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {});

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gérer l'emploi du temps</h1>
          <p className="text-muted-foreground mt-1">Créez les créneaux par classe</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setForm(f => ({...f, classroom_id: e.target.value})); }}
            className="rounded-md border bg-background px-3 py-2 text-sm">
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Link to="/schedule"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            ← Voir la grille
          </Link>
        </div>
      </div>

      {/* ── Formulaire ajout ── */}
      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Ajouter un créneau</h2>

        {error   && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{success}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Matière */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Matière *</label>
            <select value={form.subject} onChange={(e) => setForm(f => ({...f, subject: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
              <option value="">— Choisir —</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Professeur */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Professeur</label>
            <select value={form.teacher_id} onChange={(e) => setForm(f => ({...f, teacher_id: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">— Aucun —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
            </select>
          </div>

          {/* Jour */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Jour *</label>
            <select value={form.day} onChange={(e) => setForm(f => ({...f, day: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Heure début */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Heure début *</label>
            <Input type="time" value={form.start_time}
              onChange={(e) => setForm(f => ({...f, start_time: e.target.value}))} required/>
          </div>

          {/* Heure fin */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Heure fin *</label>
            <Input type="time" value={form.end_time}
              onChange={(e) => setForm(f => ({...f, end_time: e.target.value}))} required/>
          </div>

          {/* Couleur */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c.value} type="button"
                  onClick={() => setForm(f => ({...f, color: c.value}))}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${form.color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}/>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "+ Ajouter le créneau"}
        </Button>
      </form>

      {/* ── Créneaux existants par jour ── */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Créneaux de la classe</h2>

        {schedules.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun créneau pour cette classe.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DAYS.filter((d) => byDay[d].length > 0).map((day) => (
              <div key={day} className="rounded-lg border overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold text-sm">{day}</div>
                <div className="divide-y">
                  {byDay[day].map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-2">
                      <div className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}
                          {s.teacher ? ` · ${s.teacher.name}` : ""}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(s.id)}
                        className="text-xs text-red-500 hover:underline flex-shrink-0">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
