import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function main() {
  // Création admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: await hashPassword('admin1234'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    },
  });

  // Création utilisateur camerounais
  const userCM = await prisma.user.upsert({
    where: { email: 'jean.dupont@cm.cm' },
    update: {},
    create: {
      email: 'jean.dupont@cm.cm',
      passwordHash: await hashPassword('cm123456'),
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'user',
      isActive: true,
    },
  });

  // Création du device ESP32
  const device = await prisma.ioTDevice.upsert({
    where: { identifier: 'esp32-batiment-1' },
    update: {},
    create: {
      identifier: 'esp32-batiment-1',
      deviceType: 'esp32',
      model: 'ESP32 DevKit',
      metadata: { firmware: '1.0.0', tags: ['bâtiment', 'principal'] },
      active: true,
      createdBy: admin.userId,
    },
  });

  // Création des types de composants (capteurs et actionneurs)
  const componentTypesData = [
    {
      name: 'DHT11',
      identifier: 'dht11',
      category: 'sensor',
      unit: '°C/%',
      description: 'Température/humidité ambiante',
      createdBy: admin.userId,
    },
    {
      name: 'DS18B20',
      identifier: 'ds18b20',
      category: 'sensor',
      unit: '°C',
      description: 'Température de l\'eau',
      createdBy: admin.userId,
    },
    {
      name: 'Capteur de niveau d\'eau',
      identifier: 'niveau_eau',
      category: 'sensor',
      unit: '%',
      description: 'Surveillance du niveau d\'eau',
      createdBy: admin.userId,
    },
    {
      name: 'PIR',
      identifier: 'pir',
      category: 'sensor',
      unit: '',
      description: 'Détection de mouvement',
      createdBy: admin.userId,
    },
    {
      name: 'Photorésistance',
      identifier: 'photorésistance',
      category: 'sensor',
      unit: 'lux',
      description: 'Luminosité ambiante',
      createdBy: admin.userId,
    },
    {
      name: 'Servomoteur S390',
      identifier: 'servo_s390',
      category: 'actuator',
      unit: '',
      description: 'Ouverture/fermeture trappes/distributeurs',
      createdBy: admin.userId,
    },
    {
      name: 'LED simple',
      identifier: 'led_simple',
      category: 'actuator',
      unit: '',
      description: 'Système d\'éclairage, ventilateur principal, pompe à eau',
      createdBy: admin.userId,
    },
    {
      name: 'LED normale',
      identifier: 'led_normale',
      category: 'actuator',
      unit: '',
      description: 'Ventilateur secondaire, alimentation',
      createdBy: admin.userId,
    },
    {
      name: 'Buzzer actif 5V',
      identifier: 'buzzer_5v',
      category: 'actuator',
      unit: '',
      description: 'Alertes critiques locales',
      createdBy: admin.userId,
    },
  ];

  const componentTypes = {};
  for (const data of componentTypesData) {
    const ct = await prisma.componentType.upsert({
      where: { identifier: data.identifier },
      update: {},
      create: data,
    });
    componentTypes[data.identifier] = ct;
  }

  // Déploiements de composants sur l'ESP32
  const deployments = {};
  for (const key of Object.keys(componentTypes)) {
    const dep = await prisma.componentDeployment.create({
      data: {
        componentTypeId: componentTypes[key].componentTypeId,
        deviceId: device.deviceId,
        active: true,
        createdBy: admin.userId,
      },
    });
    deployments[key] = dep;
  }

  // Création d'une zone principale et d'une sous-zone
  let zonePrincipale = await prisma.zone.findFirst({
    where: { name: 'Bâtiment principal' }
  });
  if (!zonePrincipale) {
    zonePrincipale = await prisma.zone.create({
      data: {
        name: 'Bâtiment principal',
        description: 'Zone principale du bâtiment',
        metadata: { location: 'Grange', floor: 1 },
        createdBy: admin.userId,
      },
    });
  }

  let zoneElevage = await prisma.zone.findFirst({
    where: { name: 'Zone élevage' }
  });
  if (!zoneElevage) {
    zoneElevage = await prisma.zone.create({
      data: {
        name: 'Zone élevage',
        description: 'Zone dédiée à l\'élevage',
        parentZoneId: zonePrincipale.zoneId,
        createdBy: admin.userId,
      },
    });
  }

  // Assignation des déploiements à la zone principale
  for (const dep of Object.values(deployments)) {
    await prisma.zoneComponentDeployment.upsert({
      where: { zoneId_deploymentId: { zoneId: zonePrincipale.zoneId, deploymentId: dep.deploymentId } },
      update: {},
      create: {
        zoneId: zonePrincipale.zoneId,
        deploymentId: dep.deploymentId,
        assignedBy: admin.userId,
      },
    });
  }

  // Création des règles d'automatisation typiques
  // 1. Température : Si > 26°C → Ventilateurs ON
  await prisma.automationRule.create({
    data: {
      name: 'Ventilation température',
      description: 'Active les ventilateurs si la température ambiante dépasse 26°C',
      sensorDeploymentId: deployments['dht11'].deploymentId,
      operator: 'gt',
      thresholdValue: 26,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['led_simple'].deploymentId, // Ventilateur 1 simulé par LED simple
      actuatorCommand: 'ON',
      actuatorParameters: { couleur: 'rouge' },
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  // 2. Humidité : Si > 70% → Ventilation renforcée
  await prisma.automationRule.create({
    data: {
      name: 'Ventilation humidité',
      description: 'Active le ventilateur secondaire si humidité > 70%',
      sensorDeploymentId: deployments['dht11'].deploymentId,
      operator: 'gt',
      thresholdValue: 70,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['led_normale'].deploymentId, // Ventilateur 2 simulé par LED normale
      actuatorCommand: 'ON',
      actuatorParameters: {},
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  // 3. Luminosité : Si < 200 lux ET 6h-20h → Éclairage ON (simplifié sans horaire)
  await prisma.automationRule.create({
    data: {
      name: 'Éclairage automatique',
      description: 'Allume l\'éclairage si luminosité < 200 lux',
      sensorDeploymentId: deployments['photorésistance'].deploymentId,
      operator: 'lt',
      thresholdValue: 200,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['led_simple'].deploymentId, // Éclairage principal
      actuatorCommand: 'ON',
      actuatorParameters: { couleur: 'blanc' },
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  // 4. Niveau eau : Si < 30% → Pompe ON + Alerte
  await prisma.automationRule.create({
    data: {
      name: 'Remplissage réservoir',
      description: 'Active la pompe à eau et déclenche une alerte si niveau < 30%',
      sensorDeploymentId: deployments['niveau_eau'].deploymentId,
      operator: 'lt',
      thresholdValue: 30,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['led_simple'].deploymentId, // Pompe à eau simulée par LED simple
      actuatorCommand: 'ON',
      actuatorParameters: { couleur: 'jaune' },
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  await prisma.automationRule.create({
    data: {
      name: 'Alerte niveau eau',
      description: 'Déclenche une alerte si niveau d\'eau < 30%',
      sensorDeploymentId: deployments['niveau_eau'].deploymentId,
      operator: 'lt',
      thresholdValue: 30,
      actionType: 'create_alert',
      alertTitle: 'Niveau d\'eau bas',
      alertMessage: 'Le niveau d\'eau du réservoir est inférieur à 30%',
      alertSeverity: 'warning',
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  // 5. Sécurité : Mouvement détecté la nuit → Alerte + Éclairage
  await prisma.automationRule.create({
    data: {
      name: 'Alerte intrusion',
      description: 'Déclenche une alerte et allume l\'éclairage si mouvement détecté la nuit',
      sensorDeploymentId: deployments['pir'].deploymentId,
      operator: 'eq',
      thresholdValue: 1, // 1 = mouvement détecté
      actionType: 'create_alert',
      alertTitle: 'Mouvement détecté',
      alertMessage: 'Un mouvement a été détecté pendant la nuit',
      alertSeverity: 'critical',
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  await prisma.automationRule.create({
    data: {
      name: 'Éclairage sécurité',
      description: 'Allume l\'éclairage si mouvement détecté la nuit',
      sensorDeploymentId: deployments['pir'].deploymentId,
      operator: 'eq',
      thresholdValue: 1,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['led_simple'].deploymentId, // Éclairage principal
      actuatorCommand: 'ON',
      actuatorParameters: { raison: 'sécurité' },
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });
  console.log('Seed terminé. Admin:', admin.email, 'User CM:', userCM.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 