# Comment Ecospeed Fonctionne - Documentation Technique

## Vue d'ensemble

Ecospeed est un optimiseur de conduite écologique qui utilise des calculs physiques pour recommander des vitesses optimales le long d'un itinéraire, permettant d'économiser de l'énergie tout en gardant un temps de trajet raisonnable.

## 1. Analyse d'Itinéraire

### Récupération des données
Ecospeed récupère les informations suivantes pour un itinéraire :
- **Coordonnées GPS** : latitude et longitude pour chaque point
- **Données d'élévation** : altitude en mètres pour calculer les pentes
- **Limitations de vitesse** : vitesses maximales autorisées par segment
- **Distance** : longueur de chaque segment en mètres

### Segmentation

**IMPORTANT** : L'itinéraire est traité en deux niveaux :

1. **Segments élémentaires** : Chaque paire de points GPS consécutifs forme un segment élémentaire. Le calcul physique (pente, énergie) est effectué pour chaque segment élémentaire individuellement.

2. **Segments regroupés** : Les segments élémentaires sont ensuite regroupés par vitesse limite pour l'affichage, mais les énergies sont additionnées (pas moyennées).

```python
# Exemple de segment élémentaire entre deux points GPS
{
    "distance": 150,           # Distance entre deux points GPS (typiquement 50-200m)
    "elevation_start": 50,     # 50m d'altitude au point GPS i
    "elevation_end": 52,       # 52m d'altitude au point GPS i+1
    "speed_limit": 130,        # 130 km/h autorisés
    "lat_start": 49.4944,
    "lon_start": 0.1079
}
```

**Pourquoi cette approche ?**
- Chaque segment élémentaire a sa propre pente calculée individuellement
- On ne fait **jamais** de moyenne de pente entre montée et descente
- Les segments montants et descendants sont traités séparément avec leurs efficacités respectives
- Même si la pente moyenne est proche de zéro, la consommation réelle est importante car on consomme plus en montée qu'on ne récupère en descente (pertes d'efficacité)

## 2. Modèle Physique de Consommation d'Énergie

### Paramètres du véhicule électrique

Chaque véhicule est défini par ses caractéristiques physiques :

```python
vehicle = {
    "empty_mass": 1611,              # kg - masse à vide
    "extra_load": 150,               # kg - charge supplémentaire
    "drag_coefficient": 0.23,        # Cd - coefficient de traînée
    "frontal_area": 2.22,            # m² - surface frontale
    "rolling_resistance": 0.007,     # Crr - coefficient de résistance au roulement
    "motor_efficiency": 0.90,        # 90% - rendement du moteur
    "regen_efficiency": 0.70         # 70% - rendement du freinage régénératif
}
```

### Forces appliquées au véhicule

Pour chaque segment, nous calculons les forces suivantes :

#### 1. Force gravitationnelle (pente)

**IMPORTANT** : La pente est calculée pour **chaque segment élémentaire individuellement**, pas pour des segments regroupés.

```python
# Pour chaque segment élémentaire entre deux points GPS consécutifs :
# Calcul de la pente pour CE segment spécifique
elevation_change = elevation_end - elevation_start  # Différence d'altitude
slope = elevation_change / distance

# Force gravitationnelle
F_gravity = total_mass × 9.81 × slope

# Positif en montée (résiste au mouvement) → consommation d'énergie
# Négatif en descente (aide au mouvement) → récupération d'énergie (régénération)
```

**Exemple :**
- Véhicule de 1761 kg
- Segment élémentaire : montée de 2m sur 100m
- `slope = 2/100 = 0.02` (2% de pente)
- `F_gravity = 1761 × 9.81 × 0.02 = 345 N` (force résistante)

**Pourquoi ne pas faire de moyenne ?**
Si on a un segment qui monte de 10m puis descend de 10m :
- Segment 1 : `slope = +0.10` (10%) → consommation avec pertes moteur (~90-95%)
- Segment 2 : `slope = -0.10` (-10%) → récupération avec pertes régénération (~65-85%)
- Pente moyenne = 0%, mais consommation nette > 0 car les pertes d'efficacité font qu'on consomme plus qu'on ne récupère

#### 2. Résistance au roulement
```python
# Force de résistance au roulement
F_rolling = Crr × total_mass × 9.81 × cos(angle_slope)

# Toujours positive (résiste au mouvement)
```

**Exemple :**
- Crr = 0.007
- Masse = 1761 kg
- F_rolling = 0.007 × 1761 × 9.81 ≈ 121 N

#### 3. Traînée aérodynamique
```python
# Force de traînée aérodynamique
F_aero = 0.5 × ρ_air × Cd × A × v²

# Où :
# ρ_air = 1.225 kg/m³ (densité de l'air)
# Cd = coefficient de traînée
# A = surface frontale (m²)
# v = vitesse (m/s)
```

**Exemple :**
- À 130 km/h (36.1 m/s)
- Cd = 0.23, A = 2.22 m²
- F_aero = 0.5 × 1.225 × 0.23 × 2.22 × (36.1)² ≈ 407 N

#### 4. Force totale
```python
F_total = F_gravity + F_rolling + F_aero
```

### Calcul de l'énergie

**IMPORTANT** : Le calcul est effectué pour **chaque segment élémentaire individuellement**, puis les énergies sont additionnées (y compris les valeurs négatives de régénération).

```python
# Pour chaque segment élémentaire entre deux points GPS :

# Puissance requise (Watts)
power = F_total × speed_m/s

# Temps pour parcourir le segment (secondes)
time = distance / speed_m/s

# Énergie brute (Joules)
energy_j = power × time

# Énergie en kWh
energy_kwh = energy_j / (3600 × 1000)

# Application du rendement moteur
if energy_kwh > 0:  # Consommation (montée/plat)
    energy_kwh = energy_kwh / motor_efficiency  # Pertes moteur (~90-95%)
else:  # Régénération (descente)
    energy_kwh = energy_kwh × regen_efficiency  # Pertes régénération (~65-85%)

# Résultat : énergie positive (consommation) ou négative (récupération)
```

**Regroupement des segments :**
Lorsque plusieurs segments élémentaires sont regroupés par vitesse limite, on **additionne** les énergies (pas de moyenne) :
```python
total_energy = sum(segment.energy for segment in segment_group)
# Les valeurs négatives (régénération) sont correctement soustraites
```

### Freinage régénératif

Sur les descentes ou lors de décélérations, l'énergie est négative :
- **Sans régénération** : énergie perdue en chaleur (freins)
- **Avec régénération** : 65-70% de l'énergie récupérée dans la batterie

```python
# Exemple : descente de 100m sur 5km à 90 km/h
# F_gravity négatif → énergie négative
# Avec 70% de régénération, on récupère de l'énergie
```

## 3. Les Scénarios de Conduite

### LIMIT (Scénario Rouge) 🔴

**Description :** Conduite théorique aux limitations de vitesse

**Calcul :**
```python
speed_limit = segment["speed_limit"]  # Utilise directement la limitation
```

**Caractéristiques :**
- Vitesse maximale sur autoroutes (130 km/h)
- Vitesse maximale sur nationales (90-110 km/h)
- Vitesse urbaine (50 km/h)
- **Consommation élevée** : beaucoup de traînée aérodynamique à haute vitesse
- **Temps minimal** : le plus rapide possible légalement

> Remarque : un scénario **REAL (bleu)** est toujours calculé en interne pour les KPIs, mais il n'est plus affiché dans les graphiques. L'interface utilisateur se concentre sur la comparaison **LIMIT vs ECO** et sur la vitesse réelle du conducteur.

### ECO (Scénario Vert) 🟢

**Description :** Vitesses optimisées pour minimiser la consommation

**Stratégie d'optimisation :**

```python
def calculate_eco_speed(distance, elevation_change, speed_limit, vehicle):
    # Calcul de la pente pour CE segment élémentaire spécifique
    # (pas de moyenne avec d'autres segments)
    slope = elevation_change / distance
    
    if slope > 0.02:  # Montée significative (>2%)
        # Réduire la vitesse pour minimiser la puissance requise
        eco_speed = max(60, speed_limit × 0.65)
        # P = F × v → en réduisant v, on réduit P exponentiellement
        
    elif slope < -0.02:  # Descente significative (< -2 %)
        # Vitesse modérée pour maximiser la régénération
        eco_speed = min(speed_limit × 0.85, 110)
        # Balance entre sécurité et efficacité de régénération
        
    else:  # Terrain quasi plat
        # Légèrement sous la limite pour optimiser l'aérodynamique
        eco_speed = speed_limit × 0.88
        # F_aero ∝ v² → petite réduction = grosse économie
    
    return eco_speed
```

**Note** : Cette fonction est appelée pour **chaque segment élémentaire individuellement**, en utilisant sa propre `elevation_change` et `distance`. La vitesse éco est donc adaptée à la pente spécifique de chaque segment.

**Principes physiques :**

1. **En montée** : Réduire la vitesse diminue drastiquement la puissance requise
   - P = (F_gravity + F_rolling + F_aero) × v
   - F_aero ∝ v², donc réduire v de 20% réduit F_aero de 36%

2. **En descente** : Vitesse modérée optimise la régénération
   - Trop lent : on ne profite pas assez de la gravité
   - Trop rapide : sécurité et freins mécaniques requis

3. **À plat** : Minimiser la traînée aérodynamique
   - 88% de la limite = ~15% de réduction de F_aero

**Caractéristiques :**
- **Économie d'énergie** : 5-20% selon le terrain
- **Temps supplémentaire** : généralement +5-15% (mais parfois négatif!)
- **Confort** : conduite plus fluide, moins d'accélérations

## 4. Navigation Segment par Segment

### Recommandations en temps réel

Pour chaque segment pendant la navigation :

```javascript
{
  "segment_index": 15,
  "distance_remaining": 125.3,  // km
  "eco_speed": 95,               // km/h recommandé
  "speed_limit": 130,            // km/h limite
  "message": "Réduire la vitesse sur montée pour économie maximale",
  "energy_segment": 0.85,        // kWh pour ce segment
  "time_segment": 4.2            // minutes pour ce segment
}
```

### Logique de recommandation

```python
def get_eco_message(segment):
    speed_diff = segment.speed_limit - segment.eco_speed
    
    if speed_diff > 20:
        return "Réduction significative pour économie maximale"
    elif speed_diff > 10:
        return "Économie d'énergie avec peu de temps supplémentaire"
    else:
        return "Balance optimale entre énergie et temps"
```

## 5. Interface GPS Temps Réel

### Vitesse réelle et codes couleur

Pendant la navigation, l'application récupère en continu la position et la vitesse du téléphone via l'API navigateur :

```javascript
navigator.geolocation.watchPosition(
  (pos) => {
    const { latitude, longitude, speed } = pos.coords
    // Position sur la carte
    setCurrentPosition([latitude, longitude])
    // Conversion de m/s en km/h
    if (typeof speed === 'number' && speed >= 0) {
      setCurrentSpeed(speed * 3.6)
    }
  }
)
```

Cette vitesse réelle est comparée à la **vitesse ECO** du segment courant :

- **Bleu** : vitesse < ECO − 1 km/h → possibilité d'accélérer pour rester optimal.
- **Vert** : |vitesse − ECO| ≤ 1 km/h → zone optimale.
- **Rouge** : vitesse > ECO + 1 km/h → recommandation de ralentir.

En parallèle, la **limitation légale** est surveillée :

- Si `vitesse > speed_limit + 1 km/h`, un badge rouge clignotant `50 km/h` (par exemple) apparaît dans la bulle de vitesse pour signaler le dépassement.

### Mode démo

Pour les présentations (sur PC en salle de projet), un **mode démo** permet de :

- Geler la position sur la carte (pas besoin de GPS réel).
- Contrôler manuellement la vitesse avec le clavier :
  - `Z` : +1 km/h
  - `S` : −1 km/h
- Visualiser en direct les changements de couleur et les alertes de limitation.

Ce mode ne change pas la logique de calcul : il se contente de remplacer la vitesse venant du GPS par une valeur manipulée par l'utilisateur.

## 6. Calcul des KPIs

### Énergie Eco
```python
eco_energy = sum(segment.eco_energy for segment in route.segments)
# Énergie totale consommée en mode ECO (kWh)
```

### Énergie Économisée
```python
energy_saved = real_energy - eco_energy
energy_saved_percent = (energy_saved / real_energy) × 100
# Comparaison ECO vs REAL
```

### Temps Supplémentaire
```python
extra_time = eco_time - real_time  # en minutes
# Positif = ECO plus lent
# Négatif = ECO plus rapide (rare, mais possible sur terrains vallonnés)
```

### CO₂ Évité
```python
# Estimation approximative : 0.5 kg CO₂ par kWh d'électricité
co2_avoided = energy_saved × 0.5  # kg CO₂
```

## 6. Visualisations

### Graphique Vitesse vs Distance
Affiche les trois profils de vitesse le long de l'itinéraire :
- **LIMIT (rouge)** : ligne haute, constante sur autoroute
- **REAL (bleu)** : variations autour de la limite
- **ECO (vert)** : adaptations selon le terrain

### Graphique Énergie
Compare la consommation totale :
- Barres verticales pour ECO, REAL, LIMIT
- Permet de voir immédiatement l'économie réalisée

### Graphique Temps
Compare les temps de trajet :
- ECO généralement légèrement plus long
- Parfois plus court sur certains profils vallonnés

## 7. Limites et Simplifications

### Simplifications du modèle

1. **Inertie** : simplifiée (pas de calcul précis des accélérations)
2. **Vent** : non pris en compte (influence importante en réalité)
3. **Température** : non prise en compte (affecte la batterie)
4. **Trafic** : non simulé (affecte le temps réel)
5. **Accessoires** : climatisation, chauffage non comptabilisés

### Précision

Les calculs donnent une **estimation réaliste** mais pas exacte :
- ±10-15% d'écart avec la réalité possible
- Dépend de nombreux facteurs non modélisés
- Utile pour **comparaison relative** entre scénarios

## 8. Cas d'Usage

### Exemple : Trajet Le Havre → Versailles

**Distance** : ~260 km  
**Dénivelé** : +130m (vallonné)  
**Véhicule** : Tesla Model 3

**Résultats typiques :**
- **LIMIT** : 35 kWh, 120 min
- **REAL** : 30.6 kWh, 138 min
- **ECO** : 30.3 kWh, 130 min

**Observations :**
- Économie de 0.3 kWh (1.1%)
- 8 minutes GAGNÉES (terrain favorable à ECO)
- 0.18 kg CO₂ évité

### Quand ECO est vraiment gagnant

1. **Terrain très vallonné** : montées/descentes fréquentes
2. **Zones de forte limitation** : autoroutes à 130 km/h
3. **Véhicules peu aérodynamiques** : Cd élevé
4. **Trajets longs** : l'économie s'accumule

### Quand l'économie est moindre

1. **Terrain plat** : peu d'opportunités d'optimisation
2. **Zones urbaines** : déjà des vitesses basses
3. **Trajets courts** : l'économie est marginale

## Conclusion

Ecospeed combine physique, optimisation et visualisation pour aider les conducteurs de VE à :
- Comprendre leur consommation d'énergie
- Adopter une conduite plus efficace
- Réduire leur empreinte carbone
- Garder un temps de trajet raisonnable

Le modèle est basé sur des principes physiques solides et donne des recommandations pratiques et réalistes pour la conduite quotidienne.
