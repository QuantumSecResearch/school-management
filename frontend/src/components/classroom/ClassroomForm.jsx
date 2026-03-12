import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const LEVELS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"];

const formSchema = z.object({
  name:  z.string().min(2, "Au moins 2 caractères"),
  level: z.string().min(1, "Le niveau est obligatoire"),
  year:  z.string().min(1, "L'année est obligatoire"),
});

export default function ClassroomForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? { name: "", level: "", year: "2025-2026" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la classe</FormLabel>
              <FormControl><Input placeholder="Terminale A" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="level" render={({ field }) => (
            <FormItem>
              <FormLabel>Niveau</FormLabel>
              <FormControl>
                <select {...field} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Choisir un niveau</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="year" render={({ field }) => (
            <FormItem>
              <FormLabel>Année scolaire</FormLabel>
              <FormControl><Input placeholder="2025-2026" {...field} /></FormControl>
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
