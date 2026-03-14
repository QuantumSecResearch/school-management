import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name:                  z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email:                 z.string().email("Email invalide"),
  password:              z.string().min(8, "Au moins 8 caractères"),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirmation"],
});

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" },
  });

  async function onSubmit(values) {
    setServerError("");
    setLoading(true);
    try {
      await register(values.name, values.email, values.password, values.password_confirmation);
      // Redirige vers le dashboard — la page Dashboard affiche la bonne vue selon le rôle
      navigate("/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Erreur lors de l'inscription.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl space-y-6">
      <h1 className="text-2xl font-bold">Créer un compte</h1>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">
          {serverError}
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input placeholder="jean@email.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password_confirmation" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>
      </Form>

      <p className="text-sm text-center text-muted-foreground">
        Déjà un compte ?{" "}
        <button className="underline text-primary" onClick={() => navigate("/login")}>
          Se connecter
        </button>
      </p>
    </div>
  );
}

