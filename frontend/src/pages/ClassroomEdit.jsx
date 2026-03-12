import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getClassroom, updateClassroom, assignTeachers, assignStudents } from "@/api/classrooms";
import { getTeachers } from "@/api/teachers";
import { getStudents } from "@/api/students";
import ClassroomForm from "@/components/classroom/ClassroomForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClassroomEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classroom, setClassroom]         = useState(null);
  const [allTeachers, setAllTeachers]     = useState([]);
  const [allStudents, setAllStudents]     = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [fetching, setFetching]           = useState(true);
  const [loading, setLoading]             = useState(false);
  const [savingTeachers, setSavingTeachers] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [serverError, setServerError]     = useState("");
  const [teacherMsg, setTeacherMsg]       = useState("");
  const [studentMsg, setStudentMsg]       = useState("");

  useEffect(() => {
    Promise.all([
      getClassroom(id),
      getTeachers(1, "", ""),
      getStudents(1, "", ""),   // tous les étudiants (première page)
    ]).then(([classRes, teachRes, studRes]) => {
      const c = classRes.data;
      setClassroom(c);
      setAllTeachers(teachRes.data.data);
      setAllStudents(studRes.data.data);
      // Pré-sélectionne les profs et étudiants déjà dans cette classe
      setSelectedTeachers(c.teachers.map((t) => t.id));
      setSelectedStudents(c.students.map((s) => s.id));
    }).catch(() => setServerError("Erreur de chargement."))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await updateClassroom(id, values);
      navigate("/classrooms");
    } catch (error) {
      setServerError(error.response?.data?.message || "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTeachers() {
    setSavingTeachers(true);
    setTeacherMsg("");
    try {
      await assignTeachers(id, selectedTeachers);
      setTeacherMsg("✅ Professeurs mis à jour !");
    } catch { setServerError("Erreur lors de l'affectation des profs."); }
    finally { setSavingTeachers(false); }
  }

  async function handleSaveStudents() {
    setSavingStudents(true);
    setStudentMsg("");
    try {
      await assignStudents(id, selectedStudents);
      setStudentMsg("✅ Étudiants mis à jour !");
    } catch { setServerError("Erreur lors de l'affectation des étudiants."); }
    finally { setSavingStudents(false); }
  }

  function toggle(list, setList, itemId) {
    setList((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  }

  // Filtre les étudiants selon la recherche
  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (fetching) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-8">

      {/* ── Section 1 : Infos de la classe ── */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Modifier la classe</h1>
        {serverError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{serverError}</p>}
        {classroom && (
          <ClassroomForm
            defaultValues={{ name: classroom.name, level: classroom.level, year: classroom.year }}
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Enregistrer les modifications"
          />
        )}
      </div>

      {/* ── Section 2 : Affecter des professeurs ── */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-xl font-semibold">Professeurs de cette classe</h2>
          <p className="text-sm text-muted-foreground">
            {selectedTeachers.length} prof{selectedTeachers.length !== 1 ? "s" : ""} sélectionné{selectedTeachers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {teacherMsg && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{teacherMsg}</p>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allTeachers.map((teacher) => (
            <label key={teacher.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={selectedTeachers.includes(teacher.id)}
                onChange={() => toggle(selectedTeachers, setSelectedTeachers, teacher.id)}
                className="h-4 w-4"
              />
              <div>
                <p className="text-sm font-medium">{teacher.name}</p>
                <p className="text-xs text-muted-foreground">{teacher.subject}</p>
              </div>
            </label>
          ))}
        </div>
        <Button onClick={handleSaveTeachers} disabled={savingTeachers}>
          {savingTeachers ? "Enregistrement..." : "Sauvegarder les professeurs"}
        </Button>
      </div>

      {/* ── Section 3 : Affecter des étudiants ── */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-xl font-semibold">Étudiants de cette classe</h2>
          <p className="text-sm text-muted-foreground">
            {selectedStudents.length} étudiant{selectedStudents.length !== 1 ? "s" : ""} sélectionné{selectedStudents.length !== 1 ? "s" : ""}
          </p>
        </div>
        {studentMsg && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{studentMsg}</p>}

        {/* Recherche dans la liste d'étudiants */}
        <Input
          placeholder="Rechercher un étudiant..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto border rounded-lg p-3">
          {filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-3">Aucun résultat.</p>
          ) : filteredStudents.map((student) => (
            <label key={student.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => toggle(selectedStudents, setSelectedStudents, student.id)}
                className="h-4 w-4"
              />
              <div>
                <p className="text-sm font-medium">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.email}</p>
              </div>
            </label>
          ))}
        </div>

        <Button onClick={handleSaveStudents} disabled={savingStudents}>
          {savingStudents ? "Enregistrement..." : "Sauvegarder les étudiants"}
        </Button>
      </div>

    </div>
  );
}
