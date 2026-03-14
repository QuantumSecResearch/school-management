import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getSchoolLevels, getStreams } from "@/api/classrooms";

const formSchema = z.object({
  name:          z.string().min(2, "Au moins 2 caractères"),
  stream_id:     z.string().min(1, "La filière est obligatoire"),
  academic_year: z.string().min(1, "L'année est obligatoire"),
  capacity:      z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1, "Minimum 1 élève").max(200, "Maximum 200 élèves").optional()
  ),
});

export default function ClassroomForm({ defaultValues, initialLevelId, onSubmit, loading, submitLabel }) {
  const [levels,        setLevels]        = useState([]);
  const [streams,       setStreams]        = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(initialLevelId ?? "");

  useEffect(() => {
    getSchoolLevels().then((res) => setLevels(res.data)).catch(() => {});
  }, []);

  // Quand un niveau est pré-sélectionné (mode édition), charge les filières
  useEffect(() => {
    if (selectedLevel) {
      getStreams(selectedLevel).then((res) => setStreams(res.data)).catch(() => {});
    } else {
      setStreams([]);
    }
  }, [selectedLevel]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      name: "", stream_id: "", academic_year: "2025-2026", capacity: 35,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Nom de la classe */}
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la classe</FormLabel>
              <FormControl><Input placeholder="TC Sciences - Classe A" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Année scolaire */}
          <FormField control={form.control} name="academic_year" render={({ field }) => (
            <FormItem>
              <FormLabel>Année scolaire</FormLabel>
              <FormControl><Input placeholder="2025-2026" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Niveau scolaire (non soumis, filtre les filières) */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Niveau scolaire</label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                form.setValue("stream_id", "");
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Sélectionner un niveau —</option>
              {levels.map((l) => (
                <option key={l.id} value={String(l.id)}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Filière (chargée après sélection du niveau) */}
          <FormField control={form.control} name="stream_id" render={({ field }) => (
            <FormItem>
              <FormLabel>
                Filière{" "}
                {!selectedLevel && (
                  <span className="text-muted-foreground text-xs">(choisir un niveau d'abord)</span>
                )}
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  disabled={!selectedLevel}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">— Sélectionner une filière —</option>
                  {streams.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Capacité */}
          <FormField control={form.control} name="capacity" render={({ field }) => (
            <FormItem>
              <FormLabel>Capacité <span className="text-muted-foreground text-xs">(optionnel)</span></FormLabel>
              <FormControl>
                <Input type="number" min="1" max="200" placeholder="35" {...field} />
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
