"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, Trash2 } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { getHybridValidationIssues, type StructuredCv } from "@/lib/cv-structure";

type User = {
  id: string;
  email: string;
  fullName: string | null;
  credits: number;
};

type Application = {
  id: string;
  title: string;
  matchScore: number;
  templateChoice: string;
  keywords: string[];
  missingSkills: string[];
  atsOptimized: boolean;
  createdAt: string;
};

const templateChoices = TEMPLATE_CHOICES;

type Step = 1 | 2 | 3;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [templateChoice, setTemplateChoice] = useState<(typeof templateChoices)[number]>(
    "Executive Classic",
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Application[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [preview, setPreview] = useState<{
    optimizedResume: string;
    keywordsIntegrated: string[];
    missingSkills: string[];
    structuredCv?: StructuredCv;
  } | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [structuredCv, setStructuredCv] = useState<StructuredCv | null>(null);
  const [structureSource, setStructureSource] = useState<"hybrid" | "heuristic" | null>(null);
  const [hybridValidated, setHybridValidated] = useState(false);
  const [savingStructure, setSavingStructure] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [preparingStructure, setPreparingStructure] = useState(false);

  const creditsLabel = useMemo(() => "Illimité (bêta)", []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const [meRes, historyRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/cv/history"),
      ]);

      if (!meRes.ok) {
        router.push("/auth");
        return;
      }

      const meData = await meRes.json();
      const historyData = historyRes.ok ? await historyRes.json() : { items: [] };

      if (!cancelled) {
        setUser(meData.user);
        setHistory(historyData.items ?? []);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function prepareHybridStep(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Ajoute un CV PDF ou DOCX.");
      return;
    }

    setPreparingStructure(true);
    setError("");
    setPreview(null);
    setHybridValidated(false);
    setStep(1);

    const formData = new FormData();
    formData.append("jobUrl", jobUrl);
    formData.append("cvFile", file);

    const res = await fetch("/api/cv/structure-preview", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setPreparingStructure(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de génération.");
      return;
    }

    setStructuredCv(data.structuredCv ?? null);
    setStructureSource(data.source ?? null);
    setStep(2);
  }

  function updateStructuredCv(updater: (current: StructuredCv) => StructuredCv) {
    setStructuredCv((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
    setHybridValidated(false);
    setStep(2);
  }

  const hybridIssues = structuredCv ? getHybridValidationIssues(structuredCv) : [];
  const isHybridReady = structuredCv ? hybridIssues.length === 0 : false;

  function validateHybridStep() {
    if (!structuredCv) return;

    const issues = getHybridValidationIssues(structuredCv);
    if (issues.length) {
      setHybridValidated(false);
      setError(`Règle d'or non respectée: ${issues[0]}`);
      return;
    }

    setError("");
    setHybridValidated(true);
    setStep(3);
  }

  async function generateFinalCv() {
    if (!file || !structuredCv || !hybridValidated) {
      setError("Données incomplètes pour la génération finale.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("jobUrl", jobUrl);
    formData.append("templateChoice", templateChoice);
    formData.append("cvFile", file);
    formData.append("structuredCv", JSON.stringify(structuredCv));

    const res = await fetch("/api/cv/generate", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de génération.");
      return;
    }

    setPreview(data.preview);
    setUser((prev) => (prev ? { ...prev, credits: data.credits } : prev));
    setHistory((prev) => [data.application, ...prev]);
    setSelectedApplicationId(data.application.id);
    setStructuredCv(data.preview?.structuredCv ?? structuredCv);
    setStep(3);
    setHybridValidated(true);
  }

  async function loadStructuredCv(id: string) {
    setLoadingStructure(true);
    const res = await fetch(`/api/cv/${id}`);
    const data = await res.json();
    setLoadingStructure(false);

    if (!res.ok) {
      setError(data.error ?? "Impossible de charger la structure.");
      return;
    }

    setSelectedApplicationId(id);
    setStructuredCv(data.structuredCv ?? null);
    setPreview(null);
    setHybridValidated(false);
    setStep(2);
  }

  async function saveStructuredCv() {
    if (!selectedApplicationId || !structuredCv) return;

    setSavingStructure(true);
    const res = await fetch(`/api/cv/${selectedApplicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredCv }),
    });
    setSavingStructure(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Erreur d'enregistrement" }));
      setError(data.error ?? "Erreur d'enregistrement");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  }

  async function renameApplication(id: string) {
    const title = window.prompt("Nouveau nom de candidature:");
    if (!title) return;

    const res = await fetch(`/api/cv/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
    }
  }

  async function deleteApplication(id: string) {
    const res = await fetch(`/api/cv/${id}`, { method: "DELETE" });
    if (res.ok) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <AnimatedBackground />
      <main className="mx-auto w-full max-w-6xl px-6 py-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard CVMiracle</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {user?.fullName ?? user?.email ?? "Chargement..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{creditsLabel}</Badge>
            <Button variant="secondary" onClick={logout}>
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Parcours en 3 étapes</h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">
              1) Import CV + offre • 2) Formulaire hybride • 3) Génération finale
            </p>

            <div className="mb-4 flex gap-2 text-xs">
              <Badge className={step >= 1 ? "" : "opacity-60"}>Étape 1</Badge>
              <Badge className={step >= 2 ? "" : "opacity-60"}>Étape 2</Badge>
              <Badge className={step >= 3 ? "" : "opacity-60"}>Étape 3</Badge>
            </div>

            <form className="space-y-3" onSubmit={prepareHybridStep}>
              <Input
                placeholder="https://... lien de l'offre"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                type="url"
                required
              />

              <select
                value={templateChoice}
                onChange={(e) => setTemplateChoice(e.target.value as (typeof templateChoices)[number])}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                {templateChoices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>

              <Input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <Button className="w-full" disabled={preparingStructure}>
                {preparingStructure
                  ? "Analyse et segmentation en cours..."
                  : "Étape 1 → Lancer le formulaire hybride"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-300">
              Système de crédits en pause temporaire: génération illimitée activée.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Étape 3 • Génération finale</h2>
            <Button
              className="w-full"
              disabled={loading || !structuredCv || !hybridValidated || step < 3}
              onClick={generateFinalCv}
            >
              {loading ? "Génération finale en cours..." : "Étape 3 → Générer le CV final"}
            </Button>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-300">
              {!hybridValidated
                ? "Valide d'abord l'étape 2 (formulaire hybride complet) pour débloquer la génération."
                : "Une fois généré, le PDF est disponible dans l&apos;historique."}
            </p>
          </Card>
        </div>

        <Card className="mt-5">
          <h2 className="mb-4 text-lg font-semibold">Historique des candidatures</h2>
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">Aucune candidature générée.</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      Score {item.matchScore}% • {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.atsOptimized ? <Badge>ATS Optimized</Badge> : null}
                    <a href={`/api/cv/${item.id}/pdf`}>
                      <Button variant="secondary">
                        <Download size={16} />
                      </Button>
                    </a>
                    <Button variant="secondary" onClick={() => renameApplication(item.id)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="secondary" onClick={() => loadStructuredCv(item.id)}>
                      Hybride
                    </Button>
                    <Button variant="secondary" onClick={() => deleteApplication(item.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="mt-5">
          <h2 className="mb-4 text-lg font-semibold">Étape 2 • Formulaire hybride</h2>

          {!structuredCv ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {loadingStructure
                ? "Chargement de la structure..."
                : "Commence par l'étape 1 ou charge une candidature via “Hybride” dans l'historique."}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Source de segmentation: {structureSource === "hybrid" ? "Hybride IA + heuristique" : "Heuristique"}
              </p>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-sm font-semibold">Règle d&apos;or</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Aucune section ne doit être vide: Entreprise, Nom du poste, Dates, Lieu et Missions.
                </p>
                {!isHybridReady ? (
                  <p className="mt-2 text-xs text-red-500">Premier bloc à corriger: {hybridIssues[0]}</p>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    Formulaire complet, prêt pour validation de l&apos;étape 2.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-sm font-semibold">Section Résumé professionnel</p>
                <label className="text-xs font-medium">Résumé</label>
              <textarea
                className="h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                value={structuredCv.summary}
                onChange={(e) =>
                  updateStructuredCv((prev) => ({
                    ...prev,
                    summary: e.target.value,
                  }))
                }
              />
              </div>

              <p className="text-sm font-semibold">Section Expérience professionnelle</p>
              <div className="space-y-3">
                {structuredCv.experiences.map((experience, index) => (
                  <div key={`${experience.title}-${index}`} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                    <label className="text-xs font-medium">Nom du poste</label>
                    <Input
                      placeholder="Nom du poste"
                      value={experience.title}
                      onChange={(e) =>
                        updateStructuredCv((prev) => {
                          const experiences = [...prev.experiences];
                          experiences[index] = { ...experiences[index], title: e.target.value };
                          return { ...prev, experiences };
                        })
                      }
                    />
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium">Entreprise</label>
                      <Input
                        placeholder="Entreprise"
                        value={experience.company}
                        onChange={(e) =>
                          updateStructuredCv((prev) => {
                            const experiences = [...prev.experiences];
                            experiences[index] = { ...experiences[index], company: e.target.value };
                            return { ...prev, experiences };
                          })
                        }
                      />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Dates</label>
                      <Input
                        placeholder="Dates"
                        value={experience.date}
                        onChange={(e) =>
                          updateStructuredCv((prev) => {
                            const experiences = [...prev.experiences];
                            experiences[index] = { ...experiences[index], date: e.target.value };
                            return { ...prev, experiences };
                          })
                        }
                      />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-medium">Lieu</label>
                      <Input
                        placeholder="Lieu"
                        value={experience.location ?? ""}
                        onChange={(e) =>
                          updateStructuredCv((prev) => {
                            const experiences = [...prev.experiences];
                            experiences[index] = { ...experiences[index], location: e.target.value };
                            return { ...prev, experiences };
                          })
                        }
                      />
                    </div>
                    <label className="mt-2 block text-xs font-medium">Missions</label>
                    <textarea
                      className="mt-2 h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Missions (1 par ligne, max 4)"
                      value={experience.bullets.join("\n")}
                      onChange={(e) =>
                        updateStructuredCv((prev) => {
                          const experiences = [...prev.experiences];
                          experiences[index] = {
                            ...experiences[index],
                            bullets: e.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .slice(0, 4),
                          };
                          return { ...prev, experiences };
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <textarea
                  className="h-24 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Education (1 ligne par entrée)"
                  value={structuredCv.education.join("\n")}
                  onChange={(e) =>
                    updateStructuredCv((prev) => ({
                      ...prev,
                      education: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                    }))
                  }
                />
                <textarea
                  className="h-24 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Skills (1 ligne par entrée)"
                  value={structuredCv.skills.join("\n")}
                  onChange={(e) =>
                    updateStructuredCv((prev) => ({
                      ...prev,
                      skills: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                    }))
                  }
                />
                <textarea
                  className="h-24 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Languages (1 ligne par entrée)"
                  value={structuredCv.languages.join("\n")}
                  onChange={(e) =>
                    updateStructuredCv((prev) => ({
                      ...prev,
                      languages: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                    }))
                  }
                />
              </div>

              <Button className="w-full" onClick={saveStructuredCv}>
                {savingStructure ? "Enregistrement..." : "Enregistrer la structure CV"}
              </Button>
              <Button className="w-full" variant="secondary" onClick={validateHybridStep}>
                Valider l&apos;étape 2
              </Button>
            </div>
          )}
        </Card>

        {preview && hybridValidated && step >= 3 ? (
          <Card className="mt-5">
            <h2 className="mb-3 text-lg font-semibold">Dernière optimisation</h2>
            <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
              {preview.optimizedResume}
            </pre>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium">Keywords intégrés:</p>
              <p>{preview.keywordsIntegrated.join(", ")}</p>
              <p className="mt-2 font-medium">Compétences manquantes (non ajoutées):</p>
              <p>{preview.missingSkills.join(", ") || "Aucune"}</p>
            </div>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
