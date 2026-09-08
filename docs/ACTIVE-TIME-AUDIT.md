# Correction du temps actif et des CJ — 8 septembre 2026

## État de livraison

Corrections appliquées dans les deux dépôts locaux. Aucun déploiement, push ou commit effectué. La version en ligne de Velocity reste donc inchangée. Le partage corrigé CJ/temps nécessite le moteur partagé corrigé et le jeu corrigé, servis sur une même origine.

## Audit et causes

### Nocturne Velocity

Le dépôt local est bien `E:\cj_project\nocturne velocity`, avec le remote `https://github.com/cjajlk/nocturne-velocity.git`. L’accès était disponible : la correction a été appliquée à ses fichiers réels.

`gameplay.js` appelait `CJEngine.tick(..., 'velocity')` sans définir `window.getGameState`. Le moteur considérait donc toujours la session inactive. Le temps était seulement ajouté à `nv_player_stats.totalPlayTime`. La boucle transmettait en outre un delta plafonné pour la physique, susceptible de masquer un long intervalle d’inactivité.

### Attrape-les-tous

La boucle ajoutait directement `deltaMs` à `sessionActiveMs` avant la validation du moteur : un retour d’onglet masqué pouvait ajouter plusieurs minutes au temps, même si le moteur rejetait ce delta pour les CJ. L’état exposé au moteur était moins précis que les conditions de gameplay des modes.

### Breaker Nocturne

`savePlayTime()` calculait `Date.now() - playStartTime`, incluant attente, fenêtres de confirmation et onglet masqué. Cette durée était ensuite envoyée au compte global.

### Moteur partagé

Le verrou localStorage était acquis au chargement et conservé même hors gameplay. Le heartbeat pouvait renouveler un verrou sans vérifier son propriétaire ; un onglet concurrent pouvait rester bloqué, et les timers mémorisés pouvaient devenir obsolètes. La mise à jour de version effaçait également les fractions CJ déjà acquises.

## Corrections

Le moteur existant `core/cjEngine.js` reste l’unique responsable des CJ et du temps global. Il valide désormais : partie active, absence de pause, onglet visible, document ayant le focus, delta fini et positif, intervalle réel entre frames au plus égal à la limite existante de 200 ms. Le premier échantillon après activation établit une nouvelle base. Un delta de physique plafonné ne permet plus de dissimuler plusieurs minutes d’absence.

La règle demeure **1 CJ pour 600 000 ms actives**, sans changement économique. Comme auparavant, les longues interruptions de rendu dépassant 200 ms ne sont pas retenues : le compteur est conservateur lors de gros blocages de rendu.

Un verrou Web Locks exclusif, partagé avec les transactions V2, est détenu uniquement pendant le gameplay actif. Il est libéré sur pause, perte de focus, masquage, sortie et fermeture ; les jeux arrêtant leur boucle au menu sont contrôlés aussi par une vérification périodique. Les écritures V2 reprennent donc lorsque le joueur quitte/fait passer le jeu en arrière-plan. Sans Web Locks, le moteur n’accorde aucun gain global ; aucun verrou approximatif de remplacement n’est créé.

Chaque tick accepté relit le compte et enregistre en une seule écriture le temps entier, le gain éventuel et leurs fractions. Les méthodes existantes `addCJ` et `addPlayTime` calculent les modifications sur un instantané, puis `savePlayer` le valide. Une relecture contrôle les échecs de stockage masqués par l’API. Aucun second portefeuille ni compteur global parallèle.

Les fractions sont conservées dans `cjPlayerData.cjActivityV1 = { version: 1, games: { <jeu>: { cjMs, timeMs } } }`. `cjMs` est le reste avant le prochain CJ ; `timeMs` est la fraction de seconde non encore ajoutée aux statistiques. Les anciens `cjEngineTimers` sont lus à la première utilisation d’un jeu, sans effacement ni attribution rétroactive de temps. Ils ne deviennent pas une seconde source de récompense.

- **Velocity :** état actif exposé, fin de partie/retour menu exclus, base de frame remise à zéro sur changement de visibilité/focus, delta non plafonné soumis au moteur. Le temps local utilise les millisecondes acceptées. Sans les scripts partagés, le jeu et son compteur local restent fonctionnels, sans inventer de CJ globaux.
- **Attrape :** état du moteur aligné sur Normal/Timer/Campagne, pause et transition ; temps local alimenté uniquement par la durée validée. La validation de fin de session ne renvoie plus une seconde fois le temps au compte lorsque le moteur le gère déjà.
- **Breaker :** accumulation des seules millisecondes validées, exclusion de la balle non lancée et des fenêtres de confirmation, remplacement du calcul de durée écoulée. La sauvegarde locale conserve sa structure ; son relais global est désactivé lorsque le moteur enregistre déjà le temps.

## Fichiers modifiés

Dans `E:\cj_project\cjajlkGames-V2` :

- `core/cjEngine.js`
- `games/attrape/js/game.js`
- `games/breaker/js/gameplay.js`
- `games/breaker/js/profile.js`

Dans le second dépôt `E:\cj_project\nocturne velocity` :

- `gameplay.js`
- `game.html` : URLs des scripts partagés rendues relatives à l’origine (`../cjajlkGames/core/...`). Sur GitHub Pages, elles résolvent vers les mêmes URLs qu’auparavant ; en test local elles utilisent l’origine locale, sans charger à son insu le moteur publié.

Fichiers créés dans V2 :

- `v2/tests/active-time.cjs`
- `v2/tests/active-time-smoke.cjs`
- `docs/ACTIVE-TIME-AUDIT.md`

`core/cjAccount.js` avait une modification antérieure dans Git : elle n’a pas été modifiée pendant cette étape.

## Tests

### Tests déterministes par jeu

Les tests utilisent le compte et le moteur réels ainsi que la fonction getGameState extraite de chaque source réelle, dans des pages de test à horloge contrôlée. Ils simulent les états du jeu ; ils ne prétendent pas être trois parties manuelles de dix minutes.

Pour **Attrape, Breaker et Velocity séparément**, les vérifications passent :

- 100 secondes actives enregistrées ; pause de cinq minutes exclue ; reprise.
- Onglet masqué cinq minutes exclu ; retour avec un delta artificiellement plafonné également exclu.
- Menu/hors partie exclu ; reprise comptabilisée.
- 599 secondes, rechargement, puis 1 seconde : exactement **1 CJ et 600 secondes**.
- Rechargement après récompense sans attribution répétée ; fractions de seconde conservées.
- Deux surfaces volontairement visibles/focalisées concurrentes : un seul propriétaire ; masquage du propriétaire et transfert sans double comptage.
- Échec de sauvegarde : aucun temps/CJ fictivement accordé.
- Ancien reste de 599 secondes conservé au changement de version ; 1 nouvelle seconde termine le CJ sans fabriquer 599 secondes historiques de temps global.

Compléments : états Timer/Campagne et transition pour Attrape ; balle non lancée pour Breaker ; game over pour Velocity. Velocity n’a pas de bouton de pause dédié dans le gameplay actuel : sa suspension est testée par perte de focus/visibilité et par l’état hors partie.

### Pages complètes des jeux

Les pages réelles ont aussi été chargées dans Edge, sur serveur local utilisant les fichiers corrigés : démarrage de Normal, pause et reprise Attrape ; lancements de balle Breaker ; boucle Velocity. Le temps global augmente sur les trois jeux. Velocity reste jouable et son temps local augmente lorsque le chargement des scripts CJ est volontairement bloqué. Aucune erreur JavaScript applicative détectée dans ces scénarios.

Pour Velocity, le serveur de test monte le dépôt local sous `/velocity/` et le dossier partagé V2 sous `/cjajlkGames/core/`. Les scripts sont réellement servis depuis ces fichiers ; aucune substitution du moteur publié n’est nécessaire.

Les suites Collections et Carte Joueur sont également réussies : tarif **2 CJ / morceau, 8 CJ / Collection**, achats et protections, six pages et six largeurs, possessions et équipement.

Exécution : Node avec Playwright et Edge ; `PLAYWRIGHT_MODULE` peut indiquer Playwright, `TEST_OUTPUT` le dossier des résultats et `VELOCITY_ROOT` le chemin du second dépôt. Les deux tests sont exécutables dans `v2/tests/`.

## Partage et intervention restante

En local, servir les trois jeux et le hub sur le même protocole, hôte et port. Le compte unique expose les statistiques `attrape`, `breaker` et `velocity`, automatiquement lues par le profil V2.

Un autre dépôt ou onglet ne suffit pas à créer une autre origine : les chemins GitHub Pages sous `https://cjajlk.github.io` peuvent partager le stockage. En revanche, localhost et GitHub Pages ne partagent pas directement leurs comptes.

Aucune modification locale supplémentaire de Velocity n’est laissée à faire : ses deux fichiers sont corrigés. **La mise en ligne reste volontairement à faire plus tard**, de manière coordonnée avec la mise à disposition du moteur corrigé au chemin partagé utilisé par Velocity. Ne pas écraser la V1 pour réaliser cette opération ; le choix de publication partagée relève de l’étape de déploiement, hors de cette demande.

Les anciens onglets restés ouverts avec un ancien moteur ne participent pas au nouveau verrou : recharger les pages de test avant validation. Les garanties inter-onglets testées concernent les versions corrigées, sur une même origine/profil navigateur.

## Périmètre préservé

Aucun fichier de la V1 n’a été écrit. Aucune modification du design V2, de la bibliothèque à gemmes, des prix Collections, des monnaies locales ou de la progression. Aucun effacement ni migration des sauvegardes propres aux jeux : seules les adaptations nécessaires à leur métrique de temps et à l’absence de double remontée ont été effectuées. Les données personnelles du navigateur n’ont pas été utilisées ; les tests emploient des comptes fictifs isolés. Aucun déploiement.
