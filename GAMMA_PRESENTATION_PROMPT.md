# Prompt Gamma – Présentation ECOSPEED (jury)

**Objectif**  
Produis une présentation complète et percutante sur ECOSPEED pour un jury. Tu peux choisir le nombre de diapositives optimal (15–20 recommandé) en équilibrant explication technique, démo produit et impact. Texte concis, clair, en français. Propose des visuels utiles (captions courtes, schémas simples). Thème vert éco‑responsable, style moderne.

**Trame suggérée (adapter librement)**  
1) Titre & tagline : ECOSPEED – GPS éco-conduite temps réel pour VE  
2) Problème : conduite et relief impactent fortement l’autonomie, GPS classiques ignorent l’énergie  
3) Proposition de valeur : vitesse éco recommandée par segment, alertes, recherche de bornes  
4) Cas d’usage : trajets quotidiens, longs trajets, pédagogie (mode démo)  
5) Démo rapide (screenshots) : carte GPS, bulle vitesse, instructions, mode sombre/clair  
6) Physique : forces (pente, roulement, traînée), regen, calcul segmentaire (pas de pente moyenne)  
7) Vitesse éco : règle par pente, arrondie km/h, différence éco vs limite  
8) Énergie & temps : eco_energy vs limit_energy, affichage consommations et gains  
9) Fin de trajet : saisie du SOC réel à l’arrivée et comparaison avec le SOC prévu par l’appli (écart affiché)  
10) Navigation temps réel : suivi GPS, recalcul si sortie de trace, flèche orientée, recommandé visible mobile  
11) Alertes : sonore (limite/éco), visuel clignotant, mute toggle  
12) Bornes & recharge : recherche activable, stops selon SOC cible (20–80%), déduplication, puissance borne vs puissance max véhicule  
13) Véhicules : profils par défaut + custom (masse, CdA, Crr, rendements, batterie, tension, max charge kW, âge batterie)  
14) Statistiques : historique, éco-score (base 50 + % énergie économisée, clamp 0–100), badges, KPIs dynamiques  
15) Architecture : Front React/Tailwind/Leaflet, Backend FastAPI + OpenRouteService/élévation, stockage local pour profils/trajets  
16) Robustesse : seuil recalcul 150 m, prévention recalcul simultané, timeouts API, fallback audio (speech)  
17) Limitations / risques : audio bloqué navigateur, pas de rotation carte Leaflet (suggestion MapLibre GL), dépendance API ORS  
18) Feuille de route : amélioration son, rotation carte, app mobile, CarPlay/Android Auto, optimisation backend  
19) Conclusion & call to action : tester, feedback, passage en prod mobile

**Visuels à privilégier**  
- Captures : vue GPS (bulle vitesse, limite, éco), dashboard, véhicules, stats/badges.  
- Schémas : forces physiques, architecture (Utilisateur → Front → Backend → ORS/Élévation), logique de recharge (SOC cible, bornes).  
- Icônes : batterie, pente, route, alerte, haut-parleur, borne.

**Style**  
- Ton : professionnel, synthétique, orienté bénéfices et preuve.  
- Palette : vert #4ade80, foncé #0a2e1a, clair #86efac.  
- Typo moderne (ex. Space Grotesk titres, Work Sans texte).  
- Slideshow : transitions simples, zéro remplissage, chiffres clés quand possible.

**Rappels**  
- Texte en français.  
- Adapte le nombre de slides selon pertinence, mais couvre problème → solution → démo → technique → impact → risques → roadmap → conclusion.  
- Mets en avant les spécificités : calcul segmentaire, vitesse éco par pente, alertes son/visuel, puissance max véhicule pour temps de charge, SOC cible 20–80 %, démo clavier Z/S.  

« Génère maintenant la présentation complète et prête à l’emploi pour le jury. »
