# Carte Joueur V2

Le profil utilise `CJajlkAccount.getPlayer()` et `savePlayer()`. Aucune initialisation, migration ni écriture à la consultation. Seule une action explicite d’équipement sauvegarde le compte, relu au moment du clic. La sauvegarde est relue pour détecter les échecs masqués par l’API actuelle.

- `selectedBadge` reste le champ existant. Les identifiants et possessions ne changent pas.
- `profileV2.avatar` et `profileV2.background` stockent uniquement les identifiants équipés (ou `null` pour le visuel par défaut).
- Les six images de la boutique deviennent utilisables comme avatars uniquement si leur identifiant existe dans `unlockedImages`.
- Les possessions dans `items.unlockedBadges`, `unlockedImages` et `items.unlockedCosmetics` ne sont jamais supprimées ni modifiées par ce profil.
- Les CJ, le pseudo et les temps sont lus dans le compte. Un jeu est compté seulement si ses CJ gagnés ou son temps enregistré sont strictement positifs. Une activité sans trace dans ces données ne peut pas être déduite. Aucun niveau global.
- Une valeur absente reste indisponible. Un compte manquant n’est pas créé par cette page.

## Extension Collections

Le catalogue `cosmetics.js` expose `CJProfileCatalog.register({id, type, label, src})`, pour `avatar` ou `background`, avec une image locale de même origine. Enregistrer les métadonnées lors du chargement de la page (après le catalogue), à chaque visite. Le profil et le panneau se mettent à jour automatiquement.

La possession est vérifiée dans `items.unlockedCosmetics[id]`. Le système Collections inscrit désormais chaque fond acquis à 4/4 dans ce champ. Enregistrer des métadonnées n’accorde aucun élément. Les éléments inconnus restent conservés ; ils redeviennent affichables dès que leurs métadonnées sont disponibles. Voir `COLLECTIONS.md`.

`CJDashboardProfile.equip(type, id)` retourne maintenant une `Promise<boolean>` : l’interface attend la confirmation. Les équipements partagent le verrou de transaction des Collections afin de préserver les acquisitions et le solde lors d’actions simultanées dans plusieurs onglets V2.

## Validation

`v2/tests/player-card.cjs` : lancer avec Node et Playwright (`PLAYWRIGHT_MODULE` permet d’indiquer son chemin), Microsoft Edge installé. Le test lance son serveur éphémère, utilise un compte de test isolé et produit des captures dans `v2/tests/artifacts` (ou `TEST_OUTPUT`).

Le test couvre les six routes à six largeurs, les anciens comptes et données invalides, la consultation sans écriture, la synchronisation entre onglets, la personnalisation, le refus des éléments non possédés, la persistance, le déséquipement sans perte, les fonds futurs, l’échec d’écriture, la navigation clavier et l’absence de débordement. Les captures utilisent des données fictives de validation.

Périmètre : uniquement `v2/`. Ni moteur CJ, ni jeux, ni sauvegardes des jeux, ni boutique, ni bibliothèque à gemmes, ni V1 modifiés. Aucun déploiement.
