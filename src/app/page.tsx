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
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

const templateChoices = ["Original Design Enhanced", "Modern Executive", "Minimal ATS"] as const;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [templateChoice, setTemplateChoice] = useState<(typeof templateChoices)[number]>(
    "Modern Executive",
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

  async function callGenerate() {
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
  }

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

    await callGenerate();
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
      await callGenerate();
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

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Optimisation en cours..." : "Generate Optimized CV"}
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
                      <a href={`/api/cv/${generatedApplication.id}/pdf`}>
                        <Button variant="secondary" className="h-9 px-3 text-xs">
                          <Download size={14} /> Télécharger
                        </Button>
                      </a>
                    </div>
                    <p className="mb-2 truncate text-xs text-slate-600 dark:text-slate-300">
                      {generatedApplication.title}
                    </p>
                    <iframe
                      src={`/api/cv/${generatedApplication.id}/pdf?inline=1`}
                      title="Aperçu CV refabriqué"
                      className="h-56 w-full rounded-lg border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-slate-900"
                    />
                  </div>
                ) : null}

                <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                  {preview.optimizedResume}
                </pre>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-medium">Keywords intégrés:</p>
                  <p>{preview.keywordsIntegrated.join(", ")}</p>
                </div>
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
