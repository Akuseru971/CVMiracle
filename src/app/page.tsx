"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Upload,
  Link2,
  FileCheck2,
  Building2,
  BriefcaseBusiness,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { getHybridValidationIssues, type StructuredCv } from "@/lib/cv-structure";

type AuthMode = "register" | "login";

type User = {
  id: string;
  email: string;
  fullName: string | null;
  credits: number;
};

type JobPreview = {
  title: string;
  company: string;
  sourceUrl: string;
};

const templateChoices = TEMPLATE_CHOICES;

function createEmptyStructuredCv(): StructuredCv {
  return {
    summary: "",
    experiences: [
      {
        title: "",
        company: "",
        date: "",
        location: "",
        bullets: [],
      },
    ],
    education: [],
    skills: [],
    languages: [],
    additional: [],
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [templateChoice, setTemplateChoice] = useState<(typeof templateChoices)[number]>(
    "Executive Classic",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    optimizedResume: string;
    keywordsIntegrated: string[];
    missingSkills: string[];
  } | null>(null);
  const [generatedApplication, setGeneratedApplication] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [structuredCv, setStructuredCv] = useState<StructuredCv | null>(null);
  const [savingStructure, setSavingStructure] = useState(false);
  const [hybridModalOpen, setHybridModalOpen] = useState(false);
  const [structureSource, setStructureSource] = useState<"hybrid" | "hybrid-summaries" | "heuristic" | null>(null);
  const [preparingStructure, setPreparingStructure] = useState(false);
  const [hybridConfidence, setHybridConfidence] = useState<Record<string, number> | null>(null);
  const [overlapWarnings, setOverlapWarnings] = useState<string[]>([]);
  const [suggestedImprovements, setSuggestedImprovements] = useState<string[]>([]);
  const [, setExperienceSummaries] = useState<string[]>([]);
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const [jobPreview, setJobPreview] = useState<JobPreview | null>(null);
  const [jobPreviewLoading, setJobPreviewLoading] = useState(false);
  const [cvObjectUrl, setCvObjectUrl] = useState<string | null>(null);

  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!jobUrl) {
      setJobPreview(null);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setJobPreviewLoading(true);
        const res = await fetch(`/api/job/preview?url=${encodeURIComponent(jobUrl)}`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setJobPreview(data.preview);
        }
        if (!cancelled && !res.ok) {
          setJobPreview(null);
        }
      } catch {
        if (!cancelled) {
          setJobPreview(null);
        }
      } finally {
        if (!cancelled) {
          setJobPreviewLoading(false);
        }
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [jobUrl]);

  useEffect(() => {
    if (!file) {
      setCvObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCvObjectUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!structuredCv) return;
    const maxIndex = Math.max(0, structuredCv.experiences.length - 1);
    if (activeExperienceIndex > maxIndex) {
      setActiveExperienceIndex(maxIndex);
    }
  }, [structuredCv, activeExperienceIndex]);

  async function callGenerate(validatedStructuredCv: StructuredCv) {
    if (!file) {
      setError("Ajoute ton CV (PDF ou DOCX) avant la génération.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("jobUrl", jobUrl);
    formData.append("templateChoice", templateChoice);
    formData.append("cvFile", file);
    formData.append("structuredCv", JSON.stringify(validatedStructuredCv));

    const res = await fetch("/api/cv/generate", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.status === 401) {
      setShowAuthPanel(true);
      setPendingGenerate(true);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Erreur de génération.");
      return;
    }

    setPreview(data.preview);
    setUser((prev) => (prev ? { ...prev, credits: data.credits } : prev));
    setGeneratedApplication({
      id: data.application.id,
      title: data.application.title,
    });
    setActivePreviewIndex(templateChoices.indexOf(templateChoice));
    setStructuredCv(data.preview?.structuredCv ?? validatedStructuredCv);
  }

  async function openHybridPopup() {
    if (!file) {
      setError("Ajoute ton CV (PDF ou DOCX) avant la génération.");
      return;
    }

    setPreparingStructure(true);
    setError("");

    const formData = new FormData();
    formData.append("jobUrl", jobUrl);
    formData.append("cvFile", file);

    try {
      const res = await fetch("/api/cv/structure-preview", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      setPreparingStructure(false);

      if (!res.ok) {
        setStructuredCv(createEmptyStructuredCv());
        setStructureSource(null);
        setHybridConfidence(null);
        setOverlapWarnings([]);
        setSuggestedImprovements([]);
        setExperienceSummaries([]);
        setHybridModalOpen(true);
        setError(data.error ?? "Extraction incomplète: complète les expériences dans la pop-up.");
        return;
      }

      const nextStructured = data.structuredCv ?? createEmptyStructuredCv();
      setStructuredCv(
        nextStructured.experiences.length
          ? nextStructured
          : { ...nextStructured, experiences: createEmptyStructuredCv().experiences },
      );
      setStructureSource(data.source ?? null);
      setHybridConfidence(data.confidence ?? null);
      setOverlapWarnings(data.overlapWarnings ?? []);
      setSuggestedImprovements(data.suggestedImprovements ?? []);
      setExperienceSummaries(data.experienceSummaries ?? []);
      setActiveExperienceIndex(0);
      setHybridModalOpen(true);
    } catch {
      setPreparingStructure(false);
      setStructuredCv(createEmptyStructuredCv());
      setStructureSource(null);
      setHybridConfidence(null);
      setOverlapWarnings([]);
      setSuggestedImprovements([]);
      setExperienceSummaries([]);
      setActiveExperienceIndex(0);
      setHybridModalOpen(true);
      setError("Connexion instable: complète les expériences dans la pop-up puis valide.");
    }
  }

  function updateExperienceField(
    experienceIndex: number,
    field: "title" | "company" | "date" | "location",
    value: string,
  ) {
    setStructuredCv((previous) => {
      if (!previous) return previous;
      const nextExperiences = previous.experiences.map((experience, index) =>
        index === experienceIndex ? { ...experience, [field]: value } : experience,
      );
      return { ...previous, experiences: nextExperiences };
    });
  }

  function updateExperienceBullets(experienceIndex: number, value: string) {
    setStructuredCv((previous) => {
      if (!previous) return previous;
      const nextBullets = value
        .split("\n")
        .map((bullet) => bullet.trim())
        .filter(Boolean);
      const nextExperiences = previous.experiences.map((experience, index) =>
        index === experienceIndex ? { ...experience, bullets: nextBullets } : experience,
      );
      return { ...previous, experiences: nextExperiences };
    });
  }

  async function validateHybridAndGenerate() {
    if (!structuredCv) return;
    const issues = getHybridValidationIssues(structuredCv);
    if (issues.length) {
      setError(`Règle d'or non respectée: ${issues[0]}`);
      return;
    }

    setHybridModalOpen(false);
    await callGenerate(structuredCv);
  }

  async function saveStructuredCv() {
    if (!generatedApplication || !structuredCv) return;
    setSavingStructure(true);
    const res = await fetch(`/api/cv/${generatedApplication.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredCv }),
    });
    setSavingStructure(false);
    if (!res.ok) {
      setError("Impossible d'enregistrer la structure CV.");
    }
  }

  const activePreviewTemplate = templateChoices[activePreviewIndex] ?? templateChoices[0];

  const buildPdfUrl = (choice: (typeof templateChoices)[number], inline = false) => {
    if (!generatedApplication) return "#";
    const params = new URLSearchParams();
    if (inline) params.set("inline", "1");
    params.set("templateChoice", choice);
    return `/api/cv/${generatedApplication.id}/pdf?${params.toString()}`;
  };

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!jobUrl) {
      setError("Colle le lien de l'offre d'emploi.");
      return;
    }

    if (!user) {
      setShowAuthPanel(true);
      setPendingGenerate(true);
      return;
    }

    await openHybridPopup();
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload =
      authMode === "register" ? { email, password, fullName } : { email, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setAuthLoading(false);

    if (!res.ok) {
      setAuthError(data.error ?? "Erreur d'authentification");
      return;
    }

    setUser(data.user);
    setShowAuthPanel(false);

    if (pendingGenerate) {
      setPendingGenerate(false);
      await openHybridPopup();
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <AnimatedBackground />
      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-12 md:py-20">
        <header className="mb-20 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight">CVMiracle</div>
          <div className="flex items-center gap-2">
            {user ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {user.fullName ?? user.email} • Illimité (bêta)
              </p>
            ) : null}
            {!user ? (
              <Button variant="secondary" onClick={() => setShowAuthPanel(true)}>
                Connexion
              </Button>
            ) : null}
          </div>
        </header>

        <section className="mb-20 max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
            <Sparkles size={14} /> Optimisation CV par IA stricte et factuelle
          </p>
          <h1 className="mb-5 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Le CV parfait pour chaque offre, sans jamais inventer.
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Colle une offre d&apos;emploi, upload ton CV, et génère une version ATS ultra alignée en
            quelques secondes. Génération illimitée activée temporairement.
          </p>
          <Button
            className="h-12 px-6 text-base"
            onClick={() => {
              const section = document.getElementById("generator");
              section?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Optimize My CV
          </Button>
        </section>

        <section id="generator" className="mb-16 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Optimise ton CV maintenant</h2>
            <form className="space-y-3" onSubmit={onGenerate}>
              <Input
                placeholder="https://... lien de l'offre d'emploi"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                required
              />

              <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-white p-4 dark:border-indigo-900/70 dark:from-indigo-950/40 dark:to-slate-950">
                {jobPreviewLoading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">Analyse du lien en cours...</p>
                ) : jobPreview ? (
                  <>
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Building2 size={16} className="text-indigo-500" />
                      <span className="font-medium">{jobPreview.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <BriefcaseBusiness size={16} className="text-indigo-500" />
                      <span className="font-medium">{jobPreview.title}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Colle le lien pour afficher le nom de l&apos;entreprise et l&apos;intitulé du poste.
                  </p>
                )}
              </div>

              <select
                value={templateChoice}
                onChange={(e) =>
                  setTemplateChoice(e.target.value as (typeof templateChoices)[number])
                }
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

              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Aperçu CV
                </p>
                {!file ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Ajoute ton CV pour voir son aperçu visuel.
                  </p>
                ) : file.type.includes("pdf") && cvObjectUrl ? (
                  <iframe
                    src={cvObjectUrl}
                    className="h-56 w-full rounded-lg border border-slate-200 dark:border-slate-800"
                    title="Aperçu PDF"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                    <div className="text-center">
                      <div className="mx-auto mb-3 inline-flex rounded-xl bg-slate-200 p-3 dark:bg-slate-800">
                        <FileText size={22} />
                      </div>
                      <p className="max-w-[220px] truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-slate-500">Prévisualisation stylée DOCX</p>
                    </div>
                  </div>
                )}
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <Button className="w-full" disabled={loading || preparingStructure} type="submit">
                {loading
                  ? "Optimisation en cours..."
                  : preparingStructure
                    ? "Préparation du formulaire hybride..."
                    : "Generate Optimized CV"}
              </Button>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Tu peux préparer toutes les étapes sans compte. L&apos;inscription est demandée uniquement
              au moment de générer.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Résultat</h2>
            {preview ? (
              <>
                {generatedApplication ? (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        CV refabriqué prêt
                      </p>
                      <a href={buildPdfUrl(activePreviewTemplate)}>
                        <Button variant="secondary" className="h-9 px-3 text-xs">
                          <Download size={14} /> Télécharger
                        </Button>
                      </a>
                    </div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                        {generatedApplication.title}
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {activePreviewTemplate}
                      </p>
                    </div>

                    <div className="relative mb-3" style={{ perspective: "1200px" }}>
                      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-transparent to-black/5 dark:to-white/5" />
                      <iframe
                        src={buildPdfUrl(activePreviewTemplate, true)}
                        title="Aperçu CV refabriqué"
                        className="relative z-10 h-[460px] w-full rounded-xl border border-emerald-200 bg-white shadow-xl dark:border-emerald-900 dark:bg-slate-900"
                      />
                    </div>

                    <div className="mb-2 flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        className="h-9 w-9 p-0"
                        onClick={() =>
                          setActivePreviewIndex((prev) =>
                            prev === 0 ? templateChoices.length - 1 : prev - 1,
                          )
                        }
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-9 w-9 p-0"
                        onClick={() =>
                          setActivePreviewIndex((prev) =>
                            prev === templateChoices.length - 1 ? 0 : prev + 1,
                          )
                        }
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-5 gap-2" style={{ perspective: "1000px" }}>
                      {templateChoices.map((choice, index) => {
                        const offset = index - activePreviewIndex;
                        const normalized =
                          Math.abs(offset) > Math.floor(templateChoices.length / 2)
                            ? Math.sign(offset) * (templateChoices.length - Math.abs(offset))
                            : offset;
                        const rotateY = normalized * 16;
                        const translateZ = Math.max(0, 24 - Math.abs(normalized) * 10);
                        const scale = Math.max(0.86, 1 - Math.abs(normalized) * 0.06);

                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setActivePreviewIndex(index)}
                            className={`rounded-lg border px-2 py-2 text-[10px] font-medium transition ${
                              index === activePreviewIndex
                                ? "border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            }`}
                            style={{
                              transform: `translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                              transformStyle: "preserve-3d",
                            }}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                  {preview.optimizedResume}
                </pre>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-medium">Keywords intégrés:</p>
                  <p>{preview.keywordsIntegrated.join(", ")}</p>
                </div>

                {structuredCv ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Mode hybride — corriger les sections avant export
                    </p>

                    <label className="mb-1 block text-xs font-medium">Professional Summary</label>
                    <textarea
                      className="mb-3 h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      value={structuredCv.summary}
                      onChange={(e) =>
                        setStructuredCv((prev) => (prev ? { ...prev, summary: e.target.value } : prev))
                      }
                    />

                    <p className="mb-2 text-xs font-medium">Professional Experience</p>
                    <div className="space-y-3">
                      {structuredCv.experiences.map((experience, index) => (
                        <div key={`${experience.title}-${index}`} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                          <Input
                            placeholder="Poste"
                            value={experience.title}
                            onChange={(e) =>
                              setStructuredCv((prev) => {
                                if (!prev) return prev;
                                const experiences = [...prev.experiences];
                                experiences[index] = { ...experiences[index], title: e.target.value };
                                return { ...prev, experiences };
                              })
                            }
                          />
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <Input
                              placeholder="Entreprise — Lieu"
                              value={experience.company}
                              onChange={(e) =>
                                setStructuredCv((prev) => {
                                  if (!prev) return prev;
                                  const experiences = [...prev.experiences];
                                  experiences[index] = { ...experiences[index], company: e.target.value };
                                  return { ...prev, experiences };
                                })
                              }
                            />
                            <Input
                              placeholder="Dates"
                              value={experience.date}
                              onChange={(e) =>
                                setStructuredCv((prev) => {
                                  if (!prev) return prev;
                                  const experiences = [...prev.experiences];
                                  experiences[index] = { ...experiences[index], date: e.target.value };
                                  return { ...prev, experiences };
                                })
                              }
                            />
                          </div>
                          <textarea
                            className="mt-2 h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                            placeholder="1 bullet par ligne (max 4)"
                            value={experience.bullets.join("\n")}
                            onChange={(e) =>
                              setStructuredCv((prev) => {
                                if (!prev) return prev;
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

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <textarea
                        className="h-24 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Education (1 ligne par entrée)"
                        value={structuredCv.education.join("\n")}
                        onChange={(e) =>
                          setStructuredCv((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  education: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                                }
                              : prev,
                          )
                        }
                      />
                      <textarea
                        className="h-24 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Skills (1 ligne par entrée)"
                        value={structuredCv.skills.join("\n")}
                        onChange={(e) =>
                          setStructuredCv((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  skills: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                                }
                              : prev,
                          )
                        }
                      />
                      <textarea
                        className="h-24 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Languages (1 ligne par entrée)"
                        value={structuredCv.languages.join("\n")}
                        onChange={(e) =>
                          setStructuredCv((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  languages: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                                }
                              : prev,
                          )
                        }
                      />
                    </div>

                    <Button className="mt-3 w-full" variant="secondary" onClick={saveStructuredCv}>
                      {savingStructure ? "Enregistrement..." : "Enregistrer la structure CV"}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Le résultat s&apos;affichera ici après génération.
              </p>
            )}
          </Card>
        </section>

        {showAuthPanel ? (
          <section className="mb-10">
            <Card className="mx-auto w-full max-w-md">
              <h3 className="mb-1 text-xl font-semibold">
                {authMode === "register" ? "Inscription requise" : "Connexion requise"}
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                Tu restes sur cette page. Après validation, la génération démarre automatiquement.
              </p>

              <form className="space-y-3" onSubmit={submitAuth}>
                {authMode === "register" ? (
                  <Input
                    placeholder="Nom complet"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                ) : null}
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  placeholder="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />

                {authError ? <p className="text-sm text-red-500">{authError}</p> : null}

                <Button className="w-full" disabled={authLoading} type="submit">
                  {authLoading
                    ? "Validation..."
                    : authMode === "register"
                      ? "Créer mon compte"
                      : "Se connecter"}
                </Button>
              </form>

              <button
                type="button"
                className="mt-3 text-sm font-medium underline"
                onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
              >
                {authMode === "register"
                  ? "Déjà un compte ? Se connecter"
                  : "Pas de compte ? S'inscrire"}
              </button>
            </Card>
          </section>
        ) : null}

        {hybridModalOpen && structuredCv ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 text-slate-900 dark:bg-slate-950 dark:text-white">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Vérification des expériences professionnelles</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Complète chaque expérience: Entreprise, Nom du poste, Dates, Lieu, Missions.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Source: {structureSource === "hybrid" || structureSource === "hybrid-summaries" ? "Hybride IA (résumés d'expériences) + heuristique" : "Heuristique"}
                  </p>
                  {hybridConfidence ? (
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      Confiance globale extraction: {hybridConfidence.global ?? 0}%
                    </p>
                  ) : null}
                </div>
                <Button variant="secondary" onClick={() => setHybridModalOpen(false)}>
                  Fermer
                </Button>
              </div>

              {overlapWarnings.length ? (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  Chevauchement de dates détecté: {overlapWarnings[0]}
                </div>
              ) : null}
              {suggestedImprovements.length ? (
                <ul className="mb-3 list-disc pl-4 text-xs text-slate-600 dark:text-slate-300">
                  {suggestedImprovements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-2 font-semibold">Vérification guidée</p>
                {structuredCv.experiences.length ? (
                  <>
                    <div className="mb-3 flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
                      <p>
                        Expérience {activeExperienceIndex + 1} / {structuredCv.experiences.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setActiveExperienceIndex((current) => Math.max(0, current - 1))}
                          disabled={activeExperienceIndex === 0}
                        >
                          Précédent
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setActiveExperienceIndex((current) =>
                              Math.min(structuredCv.experiences.length - 1, current + 1),
                            )
                          }
                          disabled={activeExperienceIndex >= structuredCv.experiences.length - 1}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 rounded border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                      <Input
                        placeholder="Nom du poste"
                        value={structuredCv.experiences[activeExperienceIndex]?.title ?? ""}
                        onChange={(event) =>
                          updateExperienceField(activeExperienceIndex, "title", event.target.value)
                        }
                      />
                      <Input
                        placeholder="Entreprise"
                        value={structuredCv.experiences[activeExperienceIndex]?.company ?? ""}
                        onChange={(event) =>
                          updateExperienceField(activeExperienceIndex, "company", event.target.value)
                        }
                      />
                      <Input
                        placeholder="Lieu"
                        value={structuredCv.experiences[activeExperienceIndex]?.location ?? ""}
                        onChange={(event) =>
                          updateExperienceField(activeExperienceIndex, "location", event.target.value)
                        }
                      />
                      <Input
                        placeholder="Dates"
                        value={structuredCv.experiences[activeExperienceIndex]?.date ?? ""}
                        onChange={(event) =>
                          updateExperienceField(activeExperienceIndex, "date", event.target.value)
                        }
                      />
                      <textarea
                        value={structuredCv.experiences[activeExperienceIndex]?.bullets.join("\n") ?? ""}
                        onChange={(event) =>
                          updateExperienceBullets(activeExperienceIndex, event.target.value)
                        }
                        placeholder="Missions (une ligne = une mission)"
                        className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                  </>
                ) : (
                  <p>Aucune expérience détectée.</p>
                )}
              </div>

              <Button className="mt-4 w-full" disabled={loading} onClick={validateHybridAndGenerate}>
                {loading ? "Génération en cours..." : "Valider puis générer"}
              </Button>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
              <Link2 size={18} />
            </div>
            <h2 className="mb-2 text-base font-semibold">1. Colle l&apos;offre</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Analyse sémantique complète: hard skills, soft skills, responsabilités et mots-clés.
            </p>
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
              <Upload size={18} />
            </div>
            <h2 className="mb-2 text-base font-semibold">2. Upload ton CV</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              PDF ou DOCX, puis extraction intelligente du contenu sans altération des faits.
            </p>
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
              <FileCheck2 size={18} />
            </div>
            <h2 className="mb-2 text-base font-semibold">3. Génère la version optimisée</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Rewording premium, priorité aux expériences pertinentes, export PDF et score matching.
            </p>
          </Card>
        </section>

        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          Sécurité: mot de passe hashé, JWT sécurisé, données CV chiffrées, suppression à la demande.
        </p>
      </main>
    </div>
  );
}
