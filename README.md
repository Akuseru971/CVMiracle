# CVMiracle — SaaS d’optimisation CV par IA

Application web SaaS complète qui:

- Analyse une offre d’emploi via URL
- Parse un CV PDF/DOCX
- Génère un CV optimisé ATS, strictement fidèle aux faits
- Gère les crédits (3 offerts + packs Stripe)
- Fournit historique, renommage, suppression et export PDF

## Stack

- Frontend: Next.js App Router, TailwindCSS, Framer Motion
- Backend: API Routes Next.js, Prisma ORM, PostgreSQL
- IA: OpenAI API
- Paiement: Stripe Checkout + Webhook
- Sécurité: JWT HttpOnly, bcrypt, chiffrement AES-256-GCM, rate limiting

## Structure du projet

```txt
prisma/
	schema.prisma
src/
	app/
		api/
			auth/{register,login,logout,me,google}/route.ts
			cv/{generate,history}/route.ts
			cv/[id]/route.ts
			cv/[id]/pdf/route.ts
			billing/{checkout,webhook}/route.ts
		auth/page.tsx
		dashboard/page.tsx
		page.tsx
	components/
		animated-background.tsx
		ui/{button,input,card,badge}.tsx
	lib/
		ai-prompt.ts
		auth.ts
		crypto.ts
		cv-parser.ts
		job-parser.ts
		openai.ts
		pdf.ts
		prisma.ts
		rate-limit.ts
		stripe.ts
		utils.ts
```

## Schéma de base de données

Tables principales:

- `User`: compte, crédits, auth email/google
- `JobApplication`: candidature optimisée (contenu chiffré)
- `CreditTransaction`: historique des crédits (+/-)
- `Purchase`: achats Stripe et statut

Voir le schéma complet dans [prisma/schema.prisma](prisma/schema.prisma).

## Prompt IA optimisé (strict vérité)

Le prompt principal est codé dans [src/lib/ai-prompt.ts](src/lib/ai-prompt.ts) et impose:

- Zéro invention de skills/expériences/certifications
- Rewording et réorganisation uniquement
- Alignement ATS + mots-clés offre
- Sortie JSON structurée:
	- `optimizedResume`
	- `matchScore`
	- `keywordsIntegrated`
	- `missingSkills`

## Variables d’environnement

Copie `.env.example` vers `.env` puis renseigne:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY` (clé base64 32 bytes)
- `OPENAI_API_KEY`
- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID` (optionnel)

## Démarrage local

```bash
npm install
npm run db:push
npm run dev
```

## Stripe

- API checkout: [src/app/api/billing/checkout/route.ts](src/app/api/billing/checkout/route.ts)
- Webhook crédits: [src/app/api/billing/webhook/route.ts](src/app/api/billing/webhook/route.ts)

Exemple local webhook:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Sécurité implémentée

- Hash mot de passe via `bcrypt`
- JWT signé (`jose`) en cookie HttpOnly
- Rate limiting anti-abus
- Chiffrement AES-256-GCM des contenus CV/offre
- Headers de sécurité HTTP (CSP, XFO, nosniff)
- Suppression de candidature par l’utilisateur

## Recommandations UX avancées (phase suivante)

- Ajouter état “processing timeline” en temps réel (scraping → parsing → génération)
- Ajouter aperçu PDF avant téléchargement
- Ajouter onboarding 2 écrans pour activation psychologique du paywall
- Ajouter email post-génération avec CTA upgrade
- Ajouter analytics conversion par pack (5/10/25)
