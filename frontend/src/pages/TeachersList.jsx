import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getTeachers, deleteTeacher, createTeacherAccount } from "@/api/teachers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/context/useRole";

const SUBJECTS = ["Maths", "Physique", "Chimie", "Français", "Histoire", "Anglais", "SVT", "Philosophie"];

export default function TeachersList() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [teachers, setTeachers]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [page, setPage]                 = useState(1);
  const [lastPage, setLastPage]         = useState(1);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filterSubject]);

  useEffect(() => {
    setLoading(true);
    getTeachers(page, debouncedSearch, filterSubject)
      .then((res) => {
        setTeachers(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      })
      .catch(() => setError("Impossible de charger les professeurs."))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, filterSubject]);

  const [accountModal, setAccountModal]       = useState(null);
  const [accountEmail, setAccountEmail]       = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountLoading, setAccountLoading]   = useState(false);
  const [accountError, setAccountError]       = useState("");
  const [accountSuccess, setAccountSuccess]   = useState("");

  function openModal(teacher) {
    setAccountModal(teacher);
    setAccountEmail(teacher.email ?? "");
    setAccountPassword("");
    setAccountError("");
    setAccountSuccess("");
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError("");
    setAccountSuccess("");
    try {
      await createTeacherAccount(accountModal.id, { email: accountEmail, password: accountPassword });
      setAccountSuccess(`Compte créé ! Email : ${accountEmail}`);
      getTeachers(page, debouncedSearch, filterSubject).then((res) => setTeachers(res.data.data));
    } catch (err) {
      setAccountError(err.response?.data?.error ?? err.response?.data?.errors?.email?.[0] ?? "Erreur.");
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Supprimer le professeur "${name}" ?`)) return;
    try {
      await deleteTeacher(id);
      getTeachers(page, debouncedSearch, filterSubject).then((res) => {
        setTeachers(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
        if (res.data.data.length === 0 && page > 1) setPage((p) => p - 1);
      });
    } catch {
      alert("Erreur lors de la suppression.");
    }
  }

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Professeurs</h1>
          <p className="text-muted-foreground">{total} professeur{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate("/teachers/create")}>
            + Ajouter un professeur
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Toutes les matières</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterSubject) && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterSubject(""); }}>
            ✕ Effacer les filtres
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground py-10 text-center">Chargement...</p>
      ) : teachers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {search || filterSubject ? "Aucun résultat." : "Aucun professeur pour l'instant."}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nom</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Matière</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, i) => (
                <tr key={teacher.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="px-4 py-3 font-medium">{teacher.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{teacher.email}</td>
                  <td className="px-4 py-3">{teacher.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      teacher.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {teacher.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => openModal(teacher)}
                          className={teacher.user_id ? "opacity-50 cursor-default" : ""}>
                          {teacher.user_id ? "✅ Compte" : "👤 Créer compte"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/teachers/${teacher.id}/edit`)}>
                          Modifier
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(teacher.id, teacher.name)}>
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

      {/* Modal créer compte professeur */}
      {accountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Créer un compte professeur</h2>
              <p className="text-sm text-muted-foreground mt-1">Pour : <strong>{accountModal.name}</strong></p>
            </div>
            {accountModal.user_id ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-center text-muted-foreground">
                ✅ Ce professeur possède déjà un compte utilisateur.
              </div>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email de connexion</label>
                  <Input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="prof@ecole.ma" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Mot de passe (min. 6 caractères)</label>
                  <Input type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6} />
                </div>
                {accountError   && <p className="text-sm text-red-500">{accountError}</p>}
                {accountSuccess && <p className="text-sm text-emerald-600 font-medium">{accountSuccess}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setAccountModal(null)}>Annuler</Button>
                  <Button type="submit" disabled={accountLoading}>
                    {accountLoading ? "Création..." : "Créer le compte"}
                  </Button>
                </div>
              </form>
            )}
            {accountModal.user_id && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setAccountModal(null)}>Fermer</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
