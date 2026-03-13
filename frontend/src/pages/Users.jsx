import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { getStudents, deleteStudent, createStudentAccount } from "@/api/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/context/useRole";

const CLASSES = ["3ème A", "3ème B", "Terminale A", "Terminale B", "2nde C", "1ère S"];

export default function StudentsList() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
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

  const [accountModal, setAccountModal] = useState(null); // student object
  const [accountEmail, setAccountEmail]       = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountLoading, setAccountLoading]   = useState(false);
  const [accountError, setAccountError]       = useState("");
  const [accountSuccess, setAccountSuccess]   = useState("");

  async function handleCreateAccount(e) {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError("");
    setAccountSuccess("");
    try {
      await createStudentAccount(accountModal.id, { email: accountEmail, password: accountPassword });
      setAccountSuccess(`Compte créé ! Email : ${accountEmail}`);
      // Recharge pour mettre à jour user_id
      getStudents(page, debouncedSearch, filterClass).then((res) => {
        setStudents(res.data.data);
      });
    } catch (err) {
      setAccountError(err.response?.data?.error ?? err.response?.data?.errors?.email?.[0] ?? "Erreur lors de la création.");
    } finally {
      setAccountLoading(false);
    }
  }

  function openModal(student) {
    setAccountModal(student);
    setAccountEmail(student.email ?? "");
    setAccountPassword("");
    setAccountError("");
    setAccountSuccess("");
  }

  function closeModal() {
    setAccountModal(null);
  }

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
        {isAdmin && (
          <Button onClick={() => navigate("/students/create")}>
            + Ajouter un étudiant
          </Button>
        )}
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
                    <Link to={`/students/${student.id}/grades`}
                      className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                      📊 Notes
                    </Link>
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => openModal(student)}
                          className={student.user_id ? "opacity-50 cursor-default" : ""}>
                          {student.user_id ? "✅ Compte" : "👤 Créer compte"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/students/${student.id}/edit`)}>
                          Modifier
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id, student.name)}>
                          Supprimer
                        </Button>
                      </>
                    )}
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

      {/* Modal créer compte étudiant */}
      {accountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Créer un compte étudiant</h2>
              <p className="text-sm text-muted-foreground mt-1">Pour : <strong>{accountModal.name}</strong></p>
            </div>

            {accountModal.user_id ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-center text-muted-foreground">
                ✅ Ce étudiant possède déjà un compte utilisateur.
              </div>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email de connexion</label>
                  <Input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="etudiant@ecole.ma"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Mot de passe (min. 6 caractères)</label>
                  <Input
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                {accountError   && <p className="text-sm text-red-500">{accountError}</p>}
                {accountSuccess && <p className="text-sm text-emerald-600 font-medium">{accountSuccess}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal}>Annuler</Button>
                  <Button type="submit" disabled={accountLoading}>
                    {accountLoading ? "Création..." : "Créer le compte"}
                  </Button>
                </div>
              </form>
            )}

            {accountModal.user_id && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={closeModal}>Fermer</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



