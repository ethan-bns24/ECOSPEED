# Prompt pour Présentation Gamma - ECOSPEED

## Instructions pour Gamma

Crée une présentation professionnelle et moderne sur ECOSPEED, un optimiseur de conduite écologique pour véhicules électriques. Le style doit être moderne, avec un thème vert éco-responsable, des visuels clairs, et une structure narrative engageante.

---

## Structure de la Présentation  
  
**Important pour Gamma : génère exactement 10 slides, pas plus.**  

### Slide 1: Titre  
**Titre**: ECOSPEED – Real‑Time Eco‑Driving Assistant for EVs  
**Sous-titre**: Optimiser sa conduite électrique avec la physique, un GPS temps réel et un mode démo  
**Éléments visuels**: Logo ECOSPEED, fond vert sombre dégradé, pictogrammes voiture électrique + carte GPS  

---  

### Slide 2: Problème & Contexte  
**Titre**: Pourquoi un assistant de conduite économe ?  
**Contenu**:  
- Les véhicules électriques sont sensibles au style de conduite et au relief  
- Les applis GPS classiques ne montrent pas l’impact énergétique de la vitesse  
- Les conducteurs n’ont pas de repère clair pour une **vitesse vraiment éco‑optimale**  
- Besoin d’un outil à la fois **pédagogique** (mode démo) et **utilisable en situation réelle** (GPS voiture)  
**Visuel**: Graphique de consommation vs vitesse, icône batterie qui se vide plus ou moins vite  

---  

### Slide 3: Vue d’Ensemble de l’Application  
**Titre**: ECOSPEED en un coup d’œil  
**Contenu**:  
- Application web React avec **interface GPS plein écran type Waze**  
- Calcul d’itinéraire via OpenRouteService + données d’élévation  
- Modèle physique complet pour calculer l’énergie consommée sur chaque segment  
- Trois vitesses clés affichées: **vitesse actuelle**, **limite**, **vitesse éco recommandée** (arrondie à l’unité)  
- Historique de trajets, statistiques et profils de véhicules personnalisés  
**Visuel**: Screenshot global du dashboard avec carte + panneaux de vitesse  

---  

### Slide 4: Physique & Calcul de la Vitesse Éco  
**Titre**: Comment on déduit la vitesse économe  
**Contenu**:  
- Calcul des forces: gravité (pente), résistance au roulement, traînée aérodynamique, freinage régénératif  
- **Calcul par segment élémentaire**: Chaque segment entre deux points GPS consécutifs est calculé individuellement avec sa propre pente (pas de moyenne)  
- Énergie d'un segment: \(E = (F_\text{total} \times distance) / \eta_\text{moteur}\) (montée) ou \(E = (F_\text{total} \times distance) \times \eta_\text{regen}\) (descente)  
- Stratégie ECO (basée sur la pente individuelle de chaque segment):  
  - Montée (>2%): réduire fortement la vitesse pour limiter la puissance demandée  
  - Plat (|pente| ≤ 2%): rouler à ~88% de la limite pour réduire fortement la traînée  
  - Descente (<-2%): vitesse modérée pour maximiser la récupération sans dépasser la limite  
- **Important**: Même avec pente moyenne = 0, on consomme de l'énergie car les pertes d'efficacité font qu'on consomme plus en montée qu'on ne récupère en descente  
- La vitesse ECO affichée au conducteur est **arrondie au km/h** pour rester lisible en conduite  
**Visuel**: Schéma des forces sur une voiture + petit tableau vitesses limite vs vitesses ECO  

---  

### Slide 5: GPS Temps Réel dans la Voiture  
**Titre**: Une interface GPS pensée pour conduire  
**Contenu**:  
- Plein écran sur mobile, carte centrée sur la **position GPS en direct**  
- Bandeau supérieur: prochaine instruction (tourner à droite/gauche, continuer tout droit), distance au prochain changement, **distance et temps restants** (en h et min)  
- Bandeau inférieur: bulle **“Vitesse actuelle”** avec code couleur clair  
  - Bleu / vert: en‑dessous ou proche de la vitesse éco  
  - Rouge: au‑dessus de la vitesse éco  
- Si la vitesse réelle dépasse la limite: **panneau rouge clignotant** avec la limitation, intégré dans la bulle de vitesse  
**Visuel**: Screenshot de la vue GPS en conduite (comme ta capture)  

---  

### Slide 6: Mode Démo pour Présentations & Pédagogie  
**Titre**: Mode démo interactif avec touches Z/S  
**Contenu**:  
- Map centrée sur un trajet calculé, mais **position GPS figée** pour ne pas bouger  
- Vitesse “réelle” initialisée à **2 km/h en dessous de la vitesse éco**  
- Contrôle manuel au clavier (desktop) :  
  - Touche **Z**: +1 km/h  
  - Touche **S**: −1 km/h  
- Tous les effets visuels sont actifs: couleurs de la vitesse, flèche au‑dessus/en‑dessous, panneau de limitation clignotant  
- Permet de **démontrer l’interface en salle** sans être en voiture  
**Visuel**: Screenshot annoté du mode démo, éventuellement avec rappel des touches Z / S  

---  

### Slide 7: Profils de Véhicules & Personnalisation  
**Titre**: Adapter ECOSPEED à n’importe quel véhicule électrique  
**Contenu**:  
- Profils intégrés pour plusieurs modèles de VE (ex. Tesla Model 3, Model Y, etc.)  
- Formulaire **“Ajouter un véhicule”** placé en haut de la page, avec paramètres détaillés :  
  - masse, CdA, résistance au roulement, rendements moteur/régénération, capacité batterie, puissance auxiliaire…  
- Possibilité de **créer, enregistrer et supprimer** ses véhicules custom (stockés dans le navigateur)  
- Tous les calculs de consommation et de vitesse ECO utilisent ces paramètres réels de véhicule  
**Visuel**: Capture de la page véhicules avec formulaire custom + liste de véhicules  

---  

### Slide 8: Historique, Statistiques & Eco‑Impact  
**Titre**: Suivre ses trajets et son impact écologique  
**Contenu**:  
- Pages **Statistiques** et **Historique** avec récapitulatif des trajets enregistrés  
- Indicateurs: énergie économisée, temps supplémentaire, économies cumulées, badges de progression  
- Actions rapides:  
  - Supprimer un trajet individuellement  
  - Bouton **“Tout effacer”** bien visible en haut des pages Statistiques et Historique  
- Objectif: sensibiliser le conducteur à l’éco‑conduite dans la durée  
**Visuel**: Screenshots numérotés du dashboard (Dashboard 1, Dashboard 2, Dashboard 3) pour insertion ultérieure  

---  

### Slide 9: Architecture Technique  
**Titre**: De la route réelle aux recommandations en temps réel  
**Contenu**:  
- **Backend FastAPI (Python)**:  
  - Appelle OpenRouteService pour l’itinéraire + élévation  
  - Segmente la route, calcule les forces, les vitesses ECO et les consommations  
- **Frontend React + Tailwind**:  
  - Carte Leaflet, GPS temps réel, pages Véhicules / Stats / Historique  
  - Gestion du mode sombre avec thème vert ECOSPEED  
- Stockage local pour véhicules custom et historique de trajets  
**Visuel**: Schéma d’architecture simple: Utilisateur → Frontend → Backend → APIs (ORS / OSM)  

---  

### Slide 10: Conclusion & Prochaine Étape  
**Titre**: ECOSPEED – Du modèle physique au GPS éco‑responsable  
**Contenu**:  
- Résumé:  
  - Modèle physique détaillé → vitesse éco optimale par segment  
  - Interface GPS temps réel **utilisable en voiture** + mode démo clavier  
  - Personnalisation véhicule et suivi d’historique pour mesurer les gains  
- Bénéfices: moins d’énergie consommée, plus d’autonomie, meilleure compréhension de sa conduite  
- Call to action: tester l’application, recueillir du feedback, et envisager une version mobile native (iOS / Android, CarPlay / Android Auto)  
**Visuel**: Logo ECOSPEED, QR code vers la démo, liens GitHub / contact  

---

## Instructions de Style pour Gamma

**Thème Visuel**:
- Couleur principale: Vert éco (#4ade80)
- Couleurs secondaires: Vert foncé (#0a2e1a), Vert clair (#86efac)
- Typographie: Moderne, lisible (Space Grotesk pour titres, Work Sans pour texte)
- Style: Glassmorphisme, cartes avec transparence, dégradés verts

**Éléments Visuels**:
- Icônes: Éclair, feuille, route, batterie, graphiques
- Graphiques: Barres, courbes, comparaisons
- Screenshots: Interface réelle de l'application
- Schémas: Forces physiques, architecture technique

**Ton**:
- Professionnel mais accessible
- Technique mais compréhensible
- Enthousiaste mais crédible
- Focus sur les bénéfices concrets

**Animations** (si supporté):
- Transitions fluides entre slides
- Apparition progressive des éléments
- Graphiques animés
- Effets de zoom sur les cartes

---

## Notes Additionnelles

- **Durée recommandée**: 10-15 minutes
- **Public cible**: Étudiants, professionnels, investisseurs potentiels
- **Objectif**: Démontrer l'innovation technique et l'impact environnemental
- **Points forts à mettre en avant**: Physique précise, interface moderne, résultats mesurables

---

**Utilise ce prompt dans Gamma pour générer une présentation complète et professionnelle sur ECOSPEED !**

