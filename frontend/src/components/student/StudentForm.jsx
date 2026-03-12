import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name:       z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email:      z.string().email("Email invalide"),
  phone:      z.string().optional(),
  class:      z.string().min(1, "La classe est obligatoire"),
  birth_date: z.string().optional(),
});

// defaultValues  = données existantes (mode édition) ou vide (mode création)
// onSubmit       = fonction appelée quand le formulaire est soumis
// loading        = désactive le bouton pendant l'envoi
// submitLabel    = texte du bouton (ex: "Créer" ou "Modifier")
export default function StudentForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      name: "", email: "", phone: "", class: "", birth_date: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl><Input placeholder="Ahmed Benali" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input placeholder="ahmed@email.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="class" render={({ field }) => (
            <FormItem>
              <FormLabel>Classe</FormLabel>
              <FormControl><Input placeholder="Terminale A" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone <span className="text-muted-foreground">(optionnel)</span></FormLabel>
              <FormControl><Input placeholder="0612345678" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="birth_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date de naissance <span className="text-muted-foreground">(optionnel)</span></FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
