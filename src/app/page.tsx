import Link from "next/link";
import { Sparkles, Upload, Link2, FileCheck2 } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <AnimatedBackground />
      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-12 md:py-20">
        <header className="mb-20 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight">CVMiracle</div>
          <Link href="/auth">
            <Button variant="secondary">Connexion</Button>
          </Link>
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
            quelques secondes. 3 crédits gratuits à l&apos;inscription.
          </p>
          <Link href="/auth">
            <Button className="h-12 px-6 text-base">Optimize My CV</Button>
          </Link>
        </section>

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
