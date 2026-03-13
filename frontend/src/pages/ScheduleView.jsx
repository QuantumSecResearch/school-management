import { useEffect, useState } from "react";
import { getSchedules } from "@/api/schedules";
import { getClassrooms } from "@/api/classrooms";
import { Link } from "react-router";
import { useRole } from "@/context/useRole";

const DAYS  = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

export default function ScheduleView() {
  const [classrooms, setClassrooms]   = useState([]);
  const [schedules, setSchedules]     = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading]         = useState(false);
  const { isAdmin } = useRole();

  useEffect(() => {
    getClassrooms().then((r) => {
      setClassrooms(r.data);
      if (r.data.length > 0) setSelectedClass(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    getSchedules({ classroom_id: selectedClass })
      .then((r) => setSchedules(r.data))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  // Trouve les créneaux pour un jour + heure donnée
  function slotsAt(day, hour) {
    return schedules.filter((s) => {
      if (s.day !== day) return false;
      return s.start_time.slice(0, 5) === hour;
    });
  }

  const className = classrooms.find((c) => String(c.id) === selectedClass)?.name ?? "";

  return (
    <div className="space-y-4">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Emploi du temps</h1>
          {className && <p className="text-muted-foreground mt-1">{className}</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm">
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {isAdmin && (
            <Link to="/schedule/manage"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              + Ajouter un créneau
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : schedules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Aucun créneau pour cette classe.
        </div>
      ) : (
        /* ── Grille ── */
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left font-medium text-muted-foreground w-20">Heure</th>
                {DAYS.map((d) => (
                  <th key={d} className="border px-3 py-2 text-center font-medium">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="hover:bg-muted/30">
                  <td className="border px-3 py-2 text-xs text-muted-foreground font-mono">{hour}</td>
                  {DAYS.map((day) => {
                    const slots = slotsAt(day, hour);
                    return (
                      <td key={day} className="border px-2 py-1 min-w-[130px]">
                        {slots.map((s) => (
                          <div key={s.id}
                            className="rounded-md px-2 py-1.5 text-white text-xs mb-1"
                            style={{ backgroundColor: s.color || "#3b82f6" }}>
                            <p className="font-semibold">{s.subject}</p>
                            <p className="opacity-90">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</p>
                            {s.teacher && <p className="opacity-80">{s.teacher.name}</p>}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
