"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload = mode === "register" ? { email, password, fullName } : { email, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur d'authentification");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <AnimatedBackground />
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md">
          <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">
            {mode === "register" ? "Créer un compte" : "Connexion"}
          </h1>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            3 crédits offerts dès l&apos;inscription.
          </p>

          <form className="space-y-3" onSubmit={onSubmit}>
            {mode === "register" ? (
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nom complet"
                required
              />
            ) : null}
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              required
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              type="password"
              minLength={8}
              required
            />

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Chargement..." : mode === "register" ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          <Button
            variant="secondary"
            className="mt-3 w-full"
            disabled
            title="Activez GOOGLE_CLIENT_ID pour l'option OAuth"
          >
            OAuth Google (optionnel)
          </Button>

          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {mode === "register" ? "Déjà inscrit ?" : "Pas encore de compte ?"}{" "}
            <button
              type="button"
              className="font-medium text-slate-900 underline dark:text-white"
              onClick={() => setMode(mode === "register" ? "login" : "register")}
            >
              {mode === "register" ? "Se connecter" : "S'inscrire"}
            </button>
          </div>

          <Link href="/" className="mt-4 block text-xs text-slate-500 underline">
            Retour à l&apos;accueil
          </Link>
        </Card>
      </main>
    </div>
  );
}
