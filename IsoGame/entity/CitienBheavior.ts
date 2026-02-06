/*
⚙️ Générateur de Patterns
Étape 1 : Choisir un archétype (profil) aléatoire pondéré

Étape 2 : Générer personnalité (2-3 traits)

Étape 3 : LLM génère 3 à 5 objectifs du jour, influencés par le contexte (météo, événements en cours)

Étape 4 : Définir des réponses aux événements (pluie, foule, nuit…)

Étape 5 : LLM garde une trace mentale (journal interne) utilisé pour influencer les jours suivants


*/

const behavior = {
  "profile": "Philosopher",
  "personality": "melancholic, poetic",
  "daily_goals": [
    "Go to the park and write a poem",
    "Engage in a deep conversation with another thinker",
    "Visit the library",
  ],
  "stimuli_responses": {
    "rain": "Stay under the arch and reflect on transience",
    "crowd": "Observe silently, maybe speak a haiku",
    "new_building": "Feel uneasy, write thoughts in journal",
  },
  "memory": {
    "last_seen": "Painter PNJ near the fountain",
    "journal": [
      "Saw something glowing in the lab",
      "Dreamt of a city floating",
    ],
  },
};

/*
🔄 Événements Dynamiques, c’est quoi exactement ?
Ce sont des changements non-prévisibles dans l’environnement ou dans la simulation, qui viennent perturber ou enrichir la routine des PNJ, sans forcément impliquer le joueur directement. Ils servent à rendre le monde vivant, réactif, contemplatif et surprenant, même si on ne fait « rien ».

✳️ Caractéristiques des Événements Dynamiques :
Non scriptés à l’avance (ou peu), souvent générés procéduralement.

Peuvent être naturels, sociaux, psychologiques ou surnaturels.

Observables, mais pas toujours « utiles » (dans le sens classique du jeu).

Impactent le comportement des PNJ, voire leur humeur ou leurs décisions.

Ils donnent une personnalité à la ville, un rythme vivant, un sentiment que "quelque chose se passe".

🔄 SYSTÈME DE GÉNÉRATION DES ÉVÉNEMENTS
Définir les probabilités d’apparition (base sur le temps, la zone, l’histoire en cours)

Tirer au hasard un type d’événement (pondéré selon ambiance souhaitée)

Appliquer le pattern correspondant

LLM génère des dialogues et comportements pour chaque PNJ exposé

Certains PNJ en gardent une mémoire / trace psychologique persistante
*/
const dinamicEventType = [
  {
    "type": "naturel",
    "nom": "<nom de l'événement>",
    "déclencheur": "<temps, saison, hasard, zone géographique>",
    "effets": [
      "modifie lumière",
      "réduit visibilité",
      "ajuste ambiance sonore",
    ],
    "réaction_pnj": [
      "ralentissent",
      "sortent parapluies",
      "parlent de la météo",
    ],
  },
  {
    "type": "social",
    "nom": "<interaction spontanée collective>",
    "déclencheur":
      "<concentration de PNJ, jour spécial, inspiration collective>",
    "effets": ["regroupement", "dialogues spéciaux", "mood collectif"],
    "réaction_pnj": [
      "applaudissent",
      "dansent",
      "philosophent",
      "se disputent",
    ],
  },
  {
    "type": "architectural",
    "nom": "<modification physique de la ville>",
    "déclencheur": "<temps, seuil atteint, simulation aléatoire>",
    "effets": ["nouveau bâtiment", "changement de structure", "ruine générée"],
    "réaction_pnj": [
      "visite",
      "photographie",
      "prière",
      "retraite silencieuse",
    ],
  },
  {
    "type": "psychologique",
    "nom": "<changement d’état d’un PNJ>",
    "déclencheur": "<solitude, événement antérieur, mémoire accumulée>",
    "effets": ["changement de comportement", "discours étrange", "isolement"],
    "réaction_pnj": ["évite ce PNJ", "l’écoute", "le suit", "parle de lui"],
  },
  {
    "type": "surnaturel",
    "nom": "<phénomène étrange ou inexpliqué>",
    "déclencheur":
      "<temps lunaire, seuil d’étrangeté atteint, glitch volontaire>",
    "effets": ["perturbation visuelle", "sons étranges", "temps ralenti"],
    "réaction_pnj": [
      "fuient",
      "prient",
      "s’arrêtent net",
      "phrasent des mots cryptiques",
    ],
  },
  {
    "type": "historique",
    "nom": "<événement mémoriel>",
    "déclencheur":
      "<ancienneté de la zone, nombre de morts de PNJ, temps passé>",
    "effets": [
      "mur couvert d’écrits",
      "changement de nom de rue",
      "souvenirs visibles",
    ],
    "réactions_pnj": ["hommages", "nostalgie", "récits oraux", "rêves communs"],
  },
  {
    "type": "artistique",
    "nom": "<impulsion créative>",
    "déclencheur":
      "<accumulation d’interactions, climat doux, événement poétique>",
    "effets": [
      "graffitis spontanés",
      "musique ambiante",
      "expositions improvisées",
    ],
    "réactions_pnj": ["créent", "chantent", "dansent", "philosophent"],
  },
  {
    "type": "glitch_simulatif",
    "nom": "<anomalie de système>",
    "déclencheur": "<seuil de complexité atteint, simulation stressée>",
    "effets": ["répétition de PNJ", "objets dupliqués", "zones figées"],
    "réactions_pnj": [
      "perte de mémoire",
      "crise existentielle",
      "bug de langage",
    ],
  },
];

/*
🧠 MÉCANISME DYNAMIQUE POUR GÉNÉRER CES CONTEXTES
Structure JSON simplifiée :
*/

const contextManagement = {
  "contexte": "Rétablir une mémoire perdue",
  "déclencheur": "Apparition d'un PNJ amnésique",
  "pnj_initiateurs": ["Vieil homme", "Enfant"],
  "objectifs_dynamiques": [
    "Recueillir des témoignages",
    "Visiter les lieux du passé",
    "Créer une fresque pour l'aider à se souvenir",
  ],
  "réactions": [
    "Les PNJ parlent entre eux pour reconstruire son identité",
    "Certains doutent, d'autres mentent",
  ],
  "effets_durables": [
    "Modification de la mémoire collective",
    "Changement d'attitude générale envers l'inconnu",
  ],
};
