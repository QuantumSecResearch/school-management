import { useEffect, useState } from "react";
import { getInvoices, getInvoiceStats, createInvoice, bulkInvoice, markPaid, deleteInvoice } from "@/api/invoices";
import { getStudents } from "@/api/students";
import { getClassrooms } from "@/api/classrooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_LABEL = { paid: "Payée", pending: "En attente", overdue: "En retard" };
const STATUS_COLOR = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};

export default function InvoicesList() {
  const [invoices, setInvoices]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [students, setStudents]   = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading]     = useState(true);

  // Formulaire — facture individuelle
  const [form, setForm] = useState({
    student_id: "", amount: "", description: "", due_date: "", note: "",
  });
  // Formulaire — facture en masse
  const [bulk, setBulk] = useState({
    classroom_id: "", amount: "", description: "", due_date: "",
  });

  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("list"); // "list" | "add" | "bulk"

  function reload() {
    setLoading(true);
    Promise.all([
      getInvoices(filterStatus ? { status: filterStatus } : {}),
      getInvoiceStats(),
    ]).then(([invRes, statsRes]) => {
      setInvoices(invRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [filterStatus]);

  useEffect(() => {
    getStudents(1, "", "").then((r) => setStudents(r.data.data));
    getClassrooms().then((r) => setClassrooms(r.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      await createInvoice(form);
      setSuccess("✅ Facture créée !");
      setForm({ student_id: "", amount: "", description: "", due_date: "", note: "" });
      reload();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur.");
    } finally { setSaving(false); }
  }

  async function handleBulk(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const res = await bulkInvoice(bulk);
      setSuccess(`✅ ${res.data.message}`);
      setBulk({ classroom_id: "", amount: "", description: "", due_date: "" });
      reload();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur.");
    } finally { setSaving(false); }
  }

  async function handleMarkPaid(id) {
    await markPaid(id);
    reload();
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await deleteInvoice(id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    reload();
  }

  return (
    <div className="space-y-6">

      {/* ── Titre ── */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Paiements & Factures</h1>
        <p className="text-muted-foreground mt-1">Gérez les frais de scolarité</p>
      </div>

      {/* ── Stats financières ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total attendu",  value: stats.total_expected, color: "border-l-blue-500" },
            { label: "Total reçu ✅",  value: stats.total_paid,     color: "border-l-green-500" },
            { label: "En attente ⚠️",  value: stats.total_pending,  color: "border-l-yellow-500" },
            { label: "En retard 🔴",   value: stats.total_overdue,  color: "border-l-red-500" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border bg-card p-4 border-l-4 ${s.color}`}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{Number(s.value).toFixed(2)} €</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Onglets ── */}
      <div className="flex gap-2 border-b">
        {[["list","📋 Liste"], ["add","+ Facture individuelle"], ["bulk","+ Facture en masse"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab : Liste ── */}
      {tab === "list" && (
        <div className="space-y-3">
          {/* Filtre */}
          <div className="flex gap-2">
            {["", "pending", "paid", "overdue"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                }`}>
                {s === "" ? "Toutes" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {loading ? <p className="text-muted-foreground">Chargement...</p> : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Étudiant</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-right px-4 py-3 font-medium">Montant</th>
                    <th className="text-left px-4 py-3 font-medium">Échéance</th>
                    <th className="text-left px-4 py-3 font-medium">Statut</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune facture.</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{inv.student?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.description}</td>
                      <td className="px-4 py-3 text-right font-semibold">{Number(inv.amount).toFixed(2)} €</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inv.due_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[inv.status]}`}>
                          {STATUS_LABEL[inv.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {inv.status !== "paid" && (
                            <button onClick={() => handleMarkPaid(inv.id)}
                              className="text-xs text-green-600 hover:underline font-medium">
                              ✅ Marquer payé
                            </button>
                          )}
                          <button onClick={() => handleDelete(inv.id)}
                            className="text-xs text-red-500 hover:underline">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab : Facture individuelle ── */}
      {tab === "add" && (
        <form onSubmit={handleCreate} className="rounded-xl border bg-card p-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-semibold">Nouvelle facture — étudiant individuel</h2>
          {error   && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{success}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium">Étudiant *</label>
            <select value={form.student_id} onChange={(e) => setForm(f => ({...f, student_id: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
              <option value="">— Choisir —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description *</label>
            <Input value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              placeholder="ex: Frais de scolarité T1 2025-2026" required/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Montant (€) *</label>
              <Input type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => setForm(f => ({...f, amount: e.target.value}))} required/>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date limite *</label>
              <Input type="date" value={form.due_date}
                onChange={(e) => setForm(f => ({...f, due_date: e.target.value}))} required/>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Note (optionnel)</label>
            <Input value={form.note} onChange={(e) => setForm(f => ({...f, note: e.target.value}))}
              placeholder="Commentaire interne..."/>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Créer la facture"}
          </Button>
        </form>
      )}

      {/* ── Tab : Facture en masse ── */}
      {tab === "bulk" && (
        <form onSubmit={handleBulk} className="rounded-xl border bg-card p-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-semibold">Facture en masse — toute une classe</h2>
          <p className="text-sm text-muted-foreground">Crée la même facture pour tous les élèves d'une classe.</p>
          {error   && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">{success}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium">Classe *</label>
            <select value={bulk.classroom_id} onChange={(e) => setBulk(b => ({...b, classroom_id: e.target.value}))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
              <option value="">— Choisir une classe —</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.students_count} élèves)</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description *</label>
            <Input value={bulk.description} onChange={(e) => setBulk(b => ({...b, description: e.target.value}))}
              placeholder="ex: Frais de scolarité T2 2025-2026" required/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Montant par élève (€) *</label>
              <Input type="number" min="0" step="0.01" value={bulk.amount}
                onChange={(e) => setBulk(b => ({...b, amount: e.target.value}))} required/>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date limite *</label>
              <Input type="date" value={bulk.due_date}
                onChange={(e) => setBulk(b => ({...b, due_date: e.target.value}))} required/>
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Création en cours..." : "Créer pour toute la classe"}
          </Button>
        </form>
      )}

    </div>
  );
}
