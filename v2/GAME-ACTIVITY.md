# Jeux du hub et activités du profil

`game-catalog.js` référence les huit jeux disponibles : Attrape-les-tous, Breaker
Nocturne, Ferme nocturne sous la pleine lune, Nocturne Velocity, Nocturne Shift,
NYR, JetClash et Lumi. Ils figurent tous dans « Mes aventures ». Sans trace reconnue,
l’entrée indique « Aucune activité enregistrée pour le moment » et ne fait pas
augmenter le compteur des jeux joués.

Les statistiques par jeu du compte `cjPlayerData` restent lues sans modification.
Velocity et les jeux externes ont maintenant leur nom complet. Les éventuels jeux
inconnus ayant des statistiques positives restent visibles sous leur identifiant.

Quatre adaptateurs supplémentaires lisent les sauvegardes propres aux jeux :

| Jeu | Trace existante lue | Affichage |
| --- | --- | --- |
| Ferme | `cjajlkFarmV1` : zones, niveau valide, date de sauvegarde positive | Sauvegarde disponible, niveau |
| NYR | `nyrStatisticsV1` version 1 : parties terminées positives | Nombre de parties, meilleur score |
| Lumi | `lumi-best` : record entier strictement positif | Meilleur score |
| JetClash | `jetclash.etape2.profile.v1` : profil valide, matchs terminés ou défi d’entraînement | Matchs et XP JetClash, ou entraînement enregistré |

Les sauvegardes initiales vides de NYR/JetClash ne comptent pas comme une partie.
Une sauvegarde de ferme confirme une ferme enregistrée, sans prétendre connaître
son temps de jeu. Les données manquantes ou illisibles restent sans activité.
Le portefeuille CJ et le temps total restent ceux du compte commun : aucun XP,
score local, niveau ou temps estimé n’est converti en CJ ou ajouté au total.

Tout est en lecture seule, sans migration ni copie des sauvegardes. Aucune donnée
de jeu, possession, collection, pseudo ou compte n’est réécrite. Les événements
`storage`, focus, retour à la page et navigation actualisent le profil. Les traces
locales restent lisibles même si le compte du hub n’existe pas encore.

Les données doivent être sur la même origine (protocole, hôte et port), dans le
même navigateur/profil. Le hub ne peut pas lire une sauvegarde d’une autre origine
ou d’un autre appareil. Le jeu lui-même reste responsable de sa sauvegarde ; un
lancement depuis le hub ne crée pas artificiellement une activité ou du temps.

## Carte Nocturne Runner

Une carte non jouable est ajoutée dans la vue Jeux : « Nocturne Runner » et
« Bientôt disponible ». L’image fournie est copiée à l’identique dans
`assets/images/nocturne-runner.png`, affichée entière. Aucun lien de lancement,
bouton actif, crédit CJ ou entrée d’activité n’est créé pour ce jeu à venir.

## Vérifications

- `node v2/tests/game-activity.cjs` : sept jeux, statistiques communes et locales,
  données invalides et sauvegardes vides, compte absent, mises à jour entre onglets,
  aucun écrit par le hub, solde et sauvegardes exacts, carte non jouable et rendu
  sans débordement à 320, 390, 768 et 1440 px. Captures inspectées.
- `node v2/tests/player-card.cjs` : profil, possessions, équipement/déséquipement,
  sauvegarde, erreurs de stockage et affichage à six largeurs.
- `node v2/tests/dashboard.cjs` : navigation, ressources, profil ancien/invalide,
  compte et bibliothèque préservés, synchronisation et rendu à six largeurs.

Les deux tests historiques de l’entrée racine ont été actualisés : cette entrée
redirige déjà vers V2 et ne crée plus de compte automatiquement. Aucun changement
de comportement de la racine n’a été fait pour cette tâche.
