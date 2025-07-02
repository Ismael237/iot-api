# 🔧 **Configuration d'un bâtiment poulets de chair :**

### **Contrôleur principal**
- **ESP32** - Cerveau du système avec WiFi

### **Capteurs de surveillance**
- **DHT11** - Température/humidité ambiante
- **DS18B20** - Température de l'eau
- **Capteur de niveau d'eau** - Surveillance réservoir
- **PIR** - Détection intrusions/mouvements anormaux
- **Photorésistance** - Luminosité ambiante

### **Simulation des actionneurs (LEDs)**
- **Servomoteur S390 (14)** - Ouverture/fermeture trappes/distributeurs
- **LED simple** (49) - Système d'éclairage principal
- **LED simple** (47) - Ventilateur principal
- **LED simple** (43) - Pompe à eau
- **LED normale** (via résistances) - Ventilateur secondaire
- **LED normale** - Système d'alimentation

### **Alertes**
- **Buzzer actif 5V** - Alertes critiques locales

### **Support**
- **Module RTC DS3231** - Programmation horaire précise
- **Breadboard + câbles + résistances** - Assemblage

## 🎯 **Mapping des équipements simulés :**

| Équipement réel | LED simulée | Couleur/État | Déclenchement |
|----------------|-------------|--------------|---------------|
| Éclairage principal | LED simple | Blanc=ON, Éteint=OFF | Programmé + luminosité |
| Ventilateur 1 | LED simple | Rouge=ON, Éteint=OFF | Température > 26°C |
| Pompe à eau | LED simple | JauneON, Éteint=OFF | Niveau eau < 30% |
| Ventilateur 2 | LED simple | ON/OFF | Humidité > 70% |

## 📊 **Règles d'automatisation typiques :**

1. **Température** : Si > 26°C → Ventilateurs ON
2. **Humidité** : Si > 70% → Ventilation renforcée  
3. **Luminosité** : Si < 200 lux ET 6h-20h → Éclairage ON
4. **Niveau eau** : Si < 30% → Pompe ON + Alerte
5. **Sécurité** : Mouvement détecté la nuit → Alerte + Éclairage

## 🌐 **Interface web - Fonctionnalités principales :**

### **Dashboard temps réel**
- Widgets avec valeurs actuelles des capteurs
- État visuel des "équipements" (LEDs)
- Graphiques historiques
- Journal des événements

### **Contrôles manuels**
- Boutons ON/OFF pour chaque "équipement"
- Test des LEDs individuellement
- Réinitialisation des alertes

### **Configuration automatisation**
- Définir seuils température/humidité
- Programmer horaires éclairage
- Paramétrer alertes