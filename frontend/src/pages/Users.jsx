import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getStudents, deleteStudent } from "@/api/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Liste des classes disponibles pour le filtre
const CLASSES = ["3ème A", "3ème B", "Terminale A", "Terminale B", "2nde C", "1ère S"];

export default function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState("");       // texte de recherche
  const [filterClass, setFilterClass] = useState("");       // classe sélectionnée
  const [debouncedSearch, setDebouncedSearch] = useState(""); // recherche après délai

  // Debounce : attend 400ms après que l'utilisateur arrête de taper
  // Évite d'envoyer une requête à chaque lettre
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer); // annule le timer si l'utilisateur retape
  }, [search]);

  // Quand la recherche ou le filtre change → revenir à la page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterClass]);

  // Charge les students quand page, recherche ou filtre change
  useEffect(() => {
    setLoading(true);
    getStudents(page, debouncedSearch, filterClass)
      .then((res) => {
        setStudents(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      })
      .catch(() => setError("Impossible de charger les étudiants."))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, filterClass]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Supprimer l'étudiant "${name}" ?`)) return;
    try {
      await deleteStudent(id);
      // Recharge la page courante après suppression
      getStudents(page, debouncedSearch, filterClass).then((res) => {
        setStudents(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
        // Si la page est vide après suppression, recule d'une page
        if (res.data.data.length === 0 && page > 1) setPage((p) => p - 1);
      });
    } catch {
      alert("Erreur lors de la suppression.");
    }
  }

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Étudiants</h1>
          <p className="text-muted-foreground">{total} étudiant{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => navigate("/students/create")}>
          + Ajouter un étudiant
        </Button>
      </div>

      {/* Barre de recherche + filtre classe */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Toutes les classes</option>
          {CLASSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {/* Bouton reset si un filtre est actif */}
        {(search || filterClass) && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterClass(""); }}>
            ✕ Effacer les filtres
          </Button>
        )}
      </div>

      {/* Tableau */}
      {loading ? (
        <p className="text-muted-foreground py-10 text-center">Chargement...</p>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {search || filterClass ? "Aucun résultat pour cette recherche." : "Aucun étudiant pour l'instant."}{" "}
          {!search && !filterClass && (
            <button className="underline text-primary" onClick={() => navigate("/students/create")}>
              Ajouter le premier
            </button>
          )}
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
                <tr key={student.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                  <td className="px-4 py-3">{student.class}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/students/${student.id}/edit`)}>
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id, student.name)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Précédent
          </Button>
          {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => setPage((p) => p + 1)}>
            Suivant →
          </Button>
        </div>
      )}
    </div>
  );
}



