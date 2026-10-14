"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

const TYPES = ["Congés", "RTT", "Maladie", "Télétravail"];

const MESSAGE_CLES =
  "Les clés Supabase sont absentes ou incorrectes. Vérifiez le fichier .env.local (sur votre ordinateur) ou les variables d'environnement (sur Vercel).";

// Date -> "AAAA-MM-JJ" en heure locale
function versTexte(date) {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const j = String(date.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}

// Lundi et dimanche de la semaine en cours, au format "AAAA-MM-JJ"
function semaineEnCours() {
  const auj = new Date();
  const decalage = (auj.getDay() + 6) % 7;
  const lundi = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate() - decalage);
  const dimanche = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + 6);
  return { lundi: versTexte(lundi), dimanche: versTexte(dimanche) };
}

// "2026-10-13" -> "mar. 13 oct. 2026"
function formaterDate(texte) {
  const [a, m, j] = texte.split("-").map(Number);
  return new Date(a, m - 1, j).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Les absences en cours ou à venir d'abord (la plus proche en premier), puis les passées (la plus récente en premier)
function trierParProximite(absences, aujourdhui) {
  const aVenir = absences
    .filter((a) => a.date_fin >= aujourdhui)
    .sort((x, y) => x.date_debut.localeCompare(y.date_debut));
  const passees = absences
    .filter((a) => a.date_fin < aujourdhui)
    .sort((x, y) => y.date_fin.localeCompare(x.date_fin));
  return [...aVenir, ...passees];
}

export default function Page() {
  const [absences, setAbsences] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");

  async function charger() {
    const supabase = getSupabase();
    if (!supabase) {
      setErreur(MESSAGE_CLES);
      setChargement(false);
      return;
    }
    const { data, error } = await supabase.from("absences").select("*");
    if (error) {
      setErreur("Impossible de lire les absences : " + error.message);
    } else {
      setAbsences(data);
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function ajouter(e) {
    e.preventDefault();
    setErreur("");
    if (au < du) {
      setErreur("La date « Au » doit être identique ou postérieure à la date « Du ».");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setErreur(MESSAGE_CLES);
      return;
    }
    setEnvoi(true);
    const { error } = await supabase
      .from("absences")
      .insert({ prenom: prenom.trim(), type, date_debut: du, date_fin: au });
    setEnvoi(false);
    if (error) {
      setErreur("Impossible d'ajouter l'absence : " + error.message);
      return;
    }
    setPrenom("");
    setType(TYPES[0]);
    setDu("");
    setAu("");
    charger();
  }

  const aujourdhui = versTexte(new Date());
  const { lundi, dimanche } = semaineEnCours();
  const nbAbsents = new Set(
    absences
      .filter((a) => a.type !== "Télétravail" && a.date_debut <= dimanche && a.date_fin >= lundi)
      .map((a) => a.prenom.trim().toLowerCase())
  ).size;
  const liste = trierParProximite(absences, aujourdhui);

  return (
    <main>
      <h1>Absences de l'équipe</h1>

      <p className="synthese">
        {chargement
          ? "Chargement…"
          : nbAbsents === 0
          ? "Personne n'est absent cette semaine."
          : `${nbAbsents} personne${nbAbsents > 1 ? "s" : ""} absente${nbAbsents > 1 ? "s" : ""} cette semaine.`}
        <span className="note"> (hors télétravail, du lundi au dimanche)</span>
      </p>

      <form onSubmit={ajouter}>
        <label>
          Prénom
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Du
          <input type="date" value={du} onChange={(e) => setDu(e.target.value)} required />
        </label>
        <label>
          Au
          <input type="date" value={au} min={du} onChange={(e) => setAu(e.target.value)} required />
        </label>
        <button type="submit" disabled={envoi}>
          {envoi ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      {erreur && <p className="erreur">{erreur}</p>}

      <h2>Absences</h2>
      {!chargement && liste.length === 0 && <p>Aucune absence enregistrée pour le moment.</p>}
      <ul>
        {liste.map((a) => (
          <li key={a.id} className={a.date_fin < aujourdhui ? "passee" : ""}>
            <strong>{a.prenom}</strong>
            <span className="type">{a.type}</span>
            <span>
              du {formaterDate(a.date_debut)} au {formaterDate(a.date_fin)}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
