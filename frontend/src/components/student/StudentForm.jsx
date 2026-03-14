import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getSchoolLevels, getStreams, getClassroomsByStream } from "@/api/classrooms";

const formSchema = z.object({
  first_name:   z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name:    z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  cne:          z.string().optional(),
  gender:       z.enum(["M", "F"], { required_error: "Sélectionnez le sexe" }),
  birth_date:   z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email("Email invalide").optional().or(z.literal("")),
  address:      z.string().optional(),
  classroom_id: z.string().optional(),
});

export default function StudentForm({ defaultValues, onSubmit, loading, submitLabel }) {
  const [levels,     setLevels]     = useState([]);
  const [streams,    setStreams]     = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [selectedLevel,  setSelectedLevel]  = useState("");
  const [selectedStream, setSelectedStream] = useState("");

  // Charge les niveaux au démarrage
  useEffect(() => {
    getSchoolLevels().then((res) => setLevels(res.data)).catch(() => {});
  }, []);

  // Quand le niveau change → recharge les filières
  useEffect(() => {
    setStreams([]);
    setClassrooms([]);
    setSelectedStream("");
    form.setValue("classroom_id", "");
    if (selectedLevel) {
      getStreams(selectedLevel).then((res) => setStreams(res.data)).catch(() => {});
    }
  }, [selectedLevel]);

  // Quand la filière change → recharge les classes
  useEffect(() => {
    setClassrooms([]);
    form.setValue("classroom_id", "");
    if (selectedStream) {
      getClassroomsByStream(selectedStream).then((res) => setClassrooms(res.data)).catch(() => {});
    }
  }, [selectedStream]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      first_name: "", last_name: "", cne: "", gender: "M",
      birth_date: "", phone: "", email: "", address: "", classroom_id: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Informations personnelles ── */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Informations personnelles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl><Input placeholder="Ahmed" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="last_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl><Input placeholder="Benali" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="cne" render={({ field }) => (
              <FormItem>
                <FormLabel>CNE <span className="text-muted-foreground">(optionnel)</span></FormLabel>
                <FormControl><Input placeholder="G123456" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Sexe</FormLabel>
                <FormControl>
                  <select {...field} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </FormControl>
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

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone <span className="text-muted-foreground">(optionnel)</span></FormLabel>
                <FormControl><Input placeholder="0612345678" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span className="text-muted-foreground">(optionnel)</span></FormLabel>
                <FormControl><Input placeholder="ahmed@email.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse <span className="text-muted-foreground">(optionnel)</span></FormLabel>
                <FormControl><Input placeholder="Rue Hassan II, Casablanca" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* ── Affectation scolaire (dropdowns cascadants) ── */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Affectation scolaire
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* 1. Niveau scolaire */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Niveau scolaire</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">— Sélectionner un niveau —</option>
                {levels.map((l) => (
                  <option key={l.id} value={String(l.id)}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Filière (chargée après le niveau) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Filière {!selectedLevel && <span className="text-muted-foreground text-xs">(choisir un niveau d'abord)</span>}
              </label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                disabled={!selectedLevel}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50">
                <option value="">— Sélectionner une filière —</option>
                {streams.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Classe (chargée après la filière) */}
            <FormField control={form.control} name="classroom_id" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Classe {!selectedStream && <span className="text-muted-foreground text-xs">(choisir une filière d'abord)</span>}
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={!selectedStream}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50">
                    <option value="">Sans classe</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.students_count}/{c.capacity} élèves)
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
