import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const SUBJECTS = ["Maths", "Physique", "Chimie", "Français", "Histoire", "Anglais", "SVT", "Philosophie"];

const formSchema = z.object({
  name:    z.string().min(2, "Au moins 2 caractères"),
  email:   z.string().email("Email invalide"),
  phone:   z.string().optional(),
  subject: z.string().min(1, "La matière est obligatoire"),
  status:  z.enum(["active", "inactive"]),
});

export default function TeacherForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      name: "", email: "", phone: "", subject: "", status: "active",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl><Input placeholder="Marie Curie" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input placeholder="marie@ecole.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem>
              <FormLabel>Matière</FormLabel>
              <FormControl>
                <select {...field} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Choisir une matière</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormControl>
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

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <FormControl>
                <select {...field} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="active">✅ Actif</option>
                  <option value="inactive">⛔ Inactif</option>
                </select>
              </FormControl>
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
