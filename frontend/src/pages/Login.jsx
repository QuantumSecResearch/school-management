import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isFormValid = useMemo(() => {
    return form.email.trim() !== "" && form.password.trim() !== "";
  }, [form.email, form.password]);

  function validate() {
    const nextErrors = {};
    const email = form.email.trim();
    const password = form.password.trim();

    if (!email) {
      nextErrors.email = "L'email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Format d'email invalide.";
    }

    if (!password) {
      nextErrors.password = "Le mot de passe est obligatoire.";
    } else if (password.length < 8) {
      nextErrors.password = "Le mot de passe doit contenir au moins 8 caracteres.";
    }

    return nextErrors;
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setMessage("Connexion verifiee cote front-end (mode demo).");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Connexion Etudiant</h1>
        <p className="text-sm text-muted-foreground">
          Entrez vos identifiants pour acceder a votre espace.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border bg-card p-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-0 transition focus:border-ring"
            placeholder="etudiant@ecole.com"
          />
          {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-0 transition focus:border-ring"
            placeholder="********"
          />
          {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            name="remember"
            type="checkbox"
            checked={form.remember}
            onChange={handleChange}
            className="size-4 rounded border"
          />
          Se souvenir de moi
        </label>

        {message ? <p className="rounded-md bg-muted p-2 text-sm text-foreground">{message}</p> : null}

        <Button type="submit" disabled={isSubmitting || !isFormValid} className="w-full">
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
