# Attrape-les-tous – Devlog officiel

## Version 1.2.0 – 18/02/2026

### ✨ Ajouts

- **Système GAME_VERSION centralisé**
  - Constante de version unique pour tout le jeu
  - Vérifie automatiquement la version au chargement

- **Vérification automatique de version**
  - Popup de mise à jour (une seule fois par version)
  - Compare v_old et v_new intelligemment

- **Validation et auto-correction du profil joueur**
  - Sauvegarde sécurisée via `savePlayerProfile()`
  - Nettoyage des variables corrompues
  - Restore les données par défaut si nécessaire

### 💰 Économie

- **Ajustement du calcul des gemmes**
  - Protection long terme pour l'équilibre du jeu
  - Recalcul des récompenses par niveau

- **Stabilisation des récompenses**
  - Cohérence des gains en fonction du gameplay
  - Support futur des CJ Universels

### ⚙️ Technique

- **Nettoyage des variables globales**
  - Optimisation of memory footprint
  - Meilleure séparation des contextes

- **Synchronisation CJ corrigée**
  - Préparation pour l'intégration CJajlk Games
  - Passage de donnees ready-to-use

- **Sauvegarde sécurisée**
  - Validation des données avant localStorage
  - Fallback sur profil par défaut

---

## Version 1.0.0 – Lancement initial

### MVP (Minimum Viable Product)

- Gameplay core fonctionnel
- Univers nocturne établi
- Système de progression basic
- Sauvegarde locale

---

**Note :** Ce fichier trace l'historique de développement complet. Mis à jour régulièrement.
