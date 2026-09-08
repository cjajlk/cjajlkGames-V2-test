# CJAJLK Games V2 — étape 1

Entrée : `v2/index.html` (URL `/v2/` avec le serveur habituel du projet).
L’accueil racine reste celui de la copie d’origine. Pour retrouver un compte existant, servir V2 sur la même origine (protocole, hôte et port) que les jeux. Une autre origine dispose de son propre stockage ; aucune importation automatique n’est effectuée.

## Réalisé
- Desktop : navigation latérale, bannière, carte joueur, jeux et raccourcis.
- Mobile ≤760 px : cinq tuiles Profil / Jeux / Boutique / Collections / À propos ; barre basse Accueil / Jeux / Boutique / Profil. Collections et À propos sont accessibles depuis Accueil.
- Six vues avec liens directs par fragment, historique navigateur, indicateur actif, lien d’évitement et focus au changement de page.
- Compte global consulté par `CJajlkAccount.getPlayer()` : pseudo, solde, temps total/par jeu, CJ gagnés par jeu, identifiants des badges et badge sélectionné. Pas de niveau global. Une donnée absente reste indisponible (—).
- Synchronisation à la réception d’un événement storage et au retour sur la page.
- Liens vers les jeux et la boutique existants. Collections propose désormais trois illustrations en quatre morceaux, acquises avec le portefeuille CJ existant et récompensées par un fond équipable. Voir `COLLECTIONS.md` pour la configuration, la sauvegarde et les tests.
- À propos : Focus Chronicles, Relaxation App, CJajlkArt, Animat_CJajlk (en développement), à partir des références de l’accueil existant.

## Fichiers
Créés : `v2/index.html`, `v2/dashboard.css`, `v2/profile.js`, `v2/dashboard.js`, `v2/tests/dashboard.cjs`, `v2/README.md`.
Modifié : `core/cjAccount.js`, uniquement pour permettre `data-readonly="true"` sur la balise script. Cette option désactive l’initialisation automatique pour V2 ; les autres pages conservent leur comportement. Les méthodes du compte et le moteur sont inchangés. L’adaptateur n’appelle pas les getters de temps qui peuvent déclencher une migration.
Locaux, exclus de Git : `.v2-checkpoint/` (sauvegarde de cjAccount et empreintes SHA-256), `v2/tests/artifacts/` (captures et résultats). Deux exclusions ajoutées à `.git/info/exclude`.

## Point de retour
Commit initial : `9873330`.
Branche de retour : `backup/pre-v2-dashboard-20260907`.
Branche de travail : `v2/dashboard-skeleton`.
Les modifications sont laissées non commitées pour revue. Pour revenir au comportement initial sans supprimer la V2, restaurer uniquement `core/cjAccount.js` depuis la branche de retour et utiliser l’accueil racine. La sauvegarde locale du fichier existe aussi dans `.v2-checkpoint/cjAccount.js`.

## Tests
Exécuter `node v2/tests/dashboard.cjs` avec Playwright disponible et Microsoft Edge installé. Si Playwright n’est pas dans les dépendances du projet, définir PLAYWRIGHT_MODULE vers son dossier existant. Aucun téléchargement de dépendances ajouté au projet.

Suite réussie dans Edge headless :
- Six vues aux largeurs 320, 390, 760, 768, 1024 et 1440 px ; aucun débordement horizontal.
- Cinq tuiles mobile et cibles tactiles de 44 px minimum.
- Clics, retour navigateur, lien direct, route inconnue, indication de page active.
- Ressources et destinations locales accessibles (HTTP 200).
- Compte vierge, existant, ancien/incomplet, JSON invalide, API absente ; pseudo rendu en texte.
- Aucune écriture par le dashboard ; solde et bibliothèque nocturnePlayerProfileV3 conservés ; aucun chargement du moteur CJ.
- Mise à jour depuis un autre onglet.
- Initialisation automatique de l’accueil classique toujours fonctionnelle.
- Aucune erreur JavaScript sur la V2.
Captures desktop/mobile inspectées visuellement. Les données affichées dans les captures sont des données de test d’un navigateur isolé.

## Limites
Tests responsive en navigateur desktop, pas sur téléphone physique ni Safari. Les liens externes reprennent l’accueil existant et leur disponibilité distante n’a pas été auditée. Les jeux et achats de la boutique n’ont pas été exercés : seuls leurs accès ont été vérifiés. Le compte reste local au navigateur. Aucun déploiement effectué.
