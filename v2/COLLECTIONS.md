# Collections V2

## Configuration et interface

`collections-config.js` contient les trois illustrations existantes et le prix temporaire unique `PIECE_PRICE_CJ = 2`. Une Collection coûte donc 8 CJ pour ses quatre morceaux. Ce tarif de test apparaît dans l’interface et n’affecte pas les achats déjà enregistrés.

Chaque aperçu est une grille 2 × 2, au ratio 4:3 des illustrations originales. Un emplacement non acquis ne contient aucune image : il affiche un motif opaque. Chaque emplacement acquis découpe visuellement le quart correspondant de l’illustration. À 4/4 seulement, le composant affiche l’image entière. Le profil ne liste que les fonds possédés.

Les acquisitions suivent un ordre déterministe (haut gauche, haut droite, bas gauche, bas droite). Le bouton capture l’identifiant de Collection et l’indice exact du morceau affiché ; un double clic ou une demande répétée du même couple ne peut pas acheter implicitement le morceau suivant.

## Sauvegarde

Le compte `cjPlayerData` reste la source de vérité unique. Les Collections disposent d’un espace dédié `collectionsV1`, indépendant des sauvegardes propres aux jeux. Exemple après un premier achat :

```json
{
  "stats": { "totalCJ": 98 },
  "collectionsV1": {
    "version": 1,
    "entries": {
      "plage_volley": {
        "pieces": {
          "0": { "acquiredAt": 1788789000000, "priceCJ": 2 }
        }
      }
    }
  }
}
```

À 4/4, `completedAt` est ajouté à l’entrée et le fond est ajouté à `items.unlockedCosmetics.collection_plage_volley` avec `{ unlockedAt, source: 'collection', collectionId: 'plage_volley' }`. Les autres identifiants sont `collection_foret_enchantee` et `collection_voyage_cosmique`.

Les entrées existantes et les anciens fonds sont conservés. Le profil continue d’écrire uniquement son choix dans `profileV2.background`. Équiper ou déséquiper ne touche ni aux morceaux ni aux possessions. Le système ne crée pas un compte manquant et refuse une structure Collections invalide ou d’une version inconnue sans l’écraser.

## Dépense et protection des transactions

`account-transactions.js` est un coordinateur V2, pas un nouveau portefeuille. Il relit le compte sous verrou, prépare une seule modification et l’enregistre avec l’API existante `CJajlkAccount.savePlayer()`.

La règle de débit est **la méthode existante `CJajlkAccount.spendCJ`**, invoquée avec un contexte de transaction éphémère : `ensureDataStructure()` fournit le compte fraîchement lu et `savePlayer()` capture la préparation sans écrire. Aucune méthode globale ni aucun fichier du moteur n’est remplacé. Cela permet d’enregistrer le débit, le morceau et le fond final dans **une seule écriture du compte**, sans intervalle où le solde serait débité sans acquisition. Le résultat est relu, car l’API actuelle masque les erreurs de stockage.

Le verrou `cjajlk-v2-account-write` est commun aux achats Collections et aux équipements du profil. Il repose sur Web Locks : le navigateur coordonne les demandes partageant le même nom et la même origine. Un achat relit la possession et le solde après acquisition du verrou. Les attentes sont limitées à cinq secondes. [Documentation Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).

Si le navigateur ne fournit pas ce mécanisme, les achats sont désactivés avec une explication ; aucun verrou approximatif n’est substitué. Utiliser le serveur localhost habituel ou HTTPS. La consultation et l’équipement existants restent utilisables. [Contexte sécurisé et compatibilité](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).

Limite de périmètre : les anciennes pages des jeux et de la boutique ne participent pas à ce verrou et sont volontairement inchangées. Le coordinateur vérifie aussi que le compte n’a pas changé avant la sauvegarde, mais le stockage local actuel ne permet pas de garantir une transaction avec un ancien onglet qui écrit exactement au même instant sans coopérer. Les tests inter-onglets garantissent les actions V2 coordonnées ; ils ne prétendent pas modifier les garanties de concurrence de la V1 ou du moteur.

## Tests et lancement local

Avec Node, Playwright et Edge disponibles : `node v2/tests/collections.cjs`. `PLAYWRIGHT_MODULE` peut indiquer le chemin installé de Playwright, `TEST_OUTPUT` le dossier de résultats. Le serveur et le navigateur sont éphémères ; les comptes sont fictifs et isolés.

La suite couvre achat UI, débit de 2 CJ via la méthode existante, unique écriture, solde insuffisant et exact, persistance, masquage progressif, 4/4 et récompense, équipement/déséquipement, double clic, douze appels répétés, deux onglets sur le même morceau ou des Collections différentes, équipement simultané, échecs de sauvegarde aux premier et dernier morceaux, structure invalide, absence de verrou, conflit détectable avec un ancien écrivain et six largeurs (320 à 1440 px).

`node v2/tests/player-card.cjs` conserve les contrôles de non-régression du profil et des six routes. Le test attend maintenant les confirmations asynchrones d’équipement.

Captures : Collections desktop/mobile et Carte Joueur avec fond Collection équipé. Contrôle visuel dans Edge, pas de test sur téléphone physique. Aucun déploiement.

## Fichiers de cette étape

Créés : `account-transactions.js`, `collections-config.js`, `collections.js`, `collections.css`, `COLLECTIONS.md`, `tests/collections.cjs`.

Modifiés : `index.html`, `profile.js`, `dashboard.js`, `README.md`, `PLAYER-CARD.md`, `tests/player-card.cjs`.

Les trois PNG existants sont utilisés sans modification. Aucun changement dans V1, les jeux, le moteur CJ, les règles de gain, les sauvegardes de jeu ou la bibliothèque à gemmes.
