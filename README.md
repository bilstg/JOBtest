# Tableau des absences de l'équipe

Application d'une seule page qui affiche les absences de l'équipe : congés, RTT, maladie et télétravail.
C'est un **tableau de visibilité**, pas un circuit d'approbation.

Ce projet sert aussi de démonstration : il prouve que la chaîne **Next.js → Supabase → GitHub → Vercel** fonctionne de bout en bout.

## Ce que fait l'application

- **Synthèse** en haut de page : le nombre de personnes absentes cette semaine (du lundi au dimanche, télétravail non compté, chaque personne comptée une seule fois).
- **Formulaire** : Prénom, Type (Congés, RTT, Maladie, Télétravail), Du, Au, et un bouton « Ajouter ».
- **Liste des absences** : celles en cours ou à venir d'abord, la plus proche en premier, puis les absences passées, en grisé.

Ce que l'application ne fait volontairement **pas** : pas de comptes utilisateurs, pas de connexion, pas de validation par un manager, pas de suppression, pas de calcul de solde de congés.

## Technologies

- [Next.js](https://nextjs.org) (App Router, JavaScript)
- [Supabase](https://supabase.com) (base de données PostgreSQL) via `@supabase/supabase-js`
- Hébergement sur [Vercel](https://vercel.com)

## Fichiers principaux

| Fichier | Rôle |
|---|---|
| `app/page.js` | La page : synthèse, formulaire et liste |
| `app/layout.js` | Cadre de la page (langue, titre) |
| `app/globals.css` | Mise en forme |
| `lib/supabase.js` | Connexion à Supabase à partir des variables d'environnement |

## Base de données

Une table `absences` dans Supabase :

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant |
| `prenom` | text | Prénom de la personne |
| `type` | text | `Congés`, `RTT`, `Maladie` ou `Télétravail` |
| `date_debut` | date | Premier jour d'absence |
| `date_fin` | date | Dernier jour d'absence |
| `created_at` | timestamptz | Date de création de la ligne |

Les règles d'accès (Row Level Security) autorisent tout visiteur à **lire** et à **ajouter** des absences, mais pas à les modifier ni à les supprimer.

<details>
<summary>SQL de création de la table (à coller dans le SQL Editor de Supabase)</summary>

```sql
create table public.absences (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(trim(prenom)) > 0),
  type text not null check (type in ('Congés', 'RTT', 'Maladie', 'Télétravail')),
  date_debut date not null,
  date_fin date not null,
  created_at timestamptz not null default now(),
  constraint date_fin_apres_debut check (date_fin >= date_debut)
);

alter table public.absences enable row level security;

create policy "Lecture publique des absences"
  on public.absences for select
  to anon
  using (true);

create policy "Ajout public d'absences"
  on public.absences for insert
  to anon
  with check (true);

grant select, insert on public.absences to anon;
```

</details>

## Variables d'environnement

Les clés ne sont **jamais** écrites dans le code. En local, elles se trouvent dans un fichier `.env.local`, qui n'est pas envoyé sur GitHub. Sur Vercel, elles sont saisies dans les réglages du projet.

```
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Elles se trouvent dans Supabase, sous **Project Settings → Data API** (Project URL) et **Project Settings → API Keys** (Publishable key).
N'utilisez jamais la clé secrète (`sb_secret_…` ou `service_role`).

## Lancer l'application sur son ordinateur

Prérequis : [Node.js](https://nodejs.org) (version LTS).

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Mise en ligne

Une fois le dépôt importé dans Vercel, chaque envoi sur la branche `main` déclenche automatiquement un nouveau déploiement.

## ⚠️ Données personnelles

Le type « Maladie » est une donnée de santé, et l'application est accessible sans connexion.
Ne partagez son adresse qu'au sein de l'équipe.
