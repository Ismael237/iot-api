import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function main() {
  // ------------------------------------------------------------------------
  // 1. Utilisateurs
  // ------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartfarm.local' },
    update: {},
    create: {
      email: 'admin@smartfarm.local',
      passwordHash: await hashPassword('admin1234'),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'admin',
      isActive: true,
    },
  });

  const userCM = await prisma.user.upsert({
    where: { email: 'martin.ndongo@farm.cm' },
    update: {},
    create: {
      email: 'martin.ndongo@farm.cm',
      passwordHash: await hashPassword('cm123456'),
      firstName: 'Martin',
      lastName: 'Ndongo',
      role: 'user',
      isActive: true,
    },
  });

  // ------------------------------------------------------------------------
  // 2. Device ESP32 (identique au sketch)
  // ------------------------------------------------------------------------
  const device = await prisma.ioTDevice.upsert({
    where: { identifier: 'esp32-farm-001' },
    update: {},
    create: {
      identifier: 'esp32-farm-001',
      deviceType: 'esp32',
      model: 'ESP32 DevKit',
      metadata: { firmware: '1.0', tags: ['esp32', 'prototype'], ip: null },
      active: true,
      createdBy: admin.userId,
    },
  });

  // ------------------------------------------------------------------------
  // 3. Types de composants (capteurs + actionneurs)
  // ------------------------------------------------------------------------
  const componentTypesData = [
    { name: 'LED', identifier: 'led', category: 'actuator', unit: '', description: 'Actionneur LED générique', createdBy: admin.userId },
    { name: 'Servomoteur S390', identifier: 'servo_s390', category: 'actuator', unit: '', description: 'Servomoteur S390', createdBy: admin.userId },
    { name: 'Température ambiante', identifier: 'temperature', category: 'sensor', unit: '°C', description: 'Capteur DHT11 - température', createdBy: admin.userId },
    { name: 'Humidité ambiante', identifier: 'humidity', category: 'sensor', unit: '%', description: 'Capteur DHT11 - humidité', createdBy: admin.userId },
    { name: 'Température de l\'eau', identifier: 'water_temp', category: 'sensor', unit: '°C', description: 'Capteur DS18B20', createdBy: admin.userId },
    { name: 'Niveau d\'eau', identifier: 'water_level', category: 'sensor', unit: '%', description: 'Capteur de niveau d\'eau', createdBy: admin.userId },
    { name: 'Luminosité', identifier: 'lux', category: 'sensor', unit: 'lux', description: 'Capteur LDR', createdBy: admin.userId },
    { name: 'Mouvement', identifier: 'motion', category: 'sensor', unit: 'bool', description: 'Capteur PIR', createdBy: admin.userId },
  ];

  const componentTypes: Record<string, any> = {};
  for (const data of componentTypesData) {
    const ct = await prisma.componentType.upsert({
      where: { identifier: data.identifier },
      update: {},
      create: data,
    });
    componentTypes[data.identifier] = ct;
  }

  // ------------------------------------------------------------------------
  // 4. Déploiements + connexion des pins
  // ------------------------------------------------------------------------
  const deploymentsData = [
    // Capteurs
    { key: 'temperature', type: 'temperature', pin: 'GPIO4', pinFunction: 'data' },
    { key: 'humidity', type: 'humidity', pin: 'GPIO4', pinFunction: 'data' },
    { key: 'water_temp', type: 'water_temp', pin: 'GPIO18', pinFunction: 'onewire' },
    { key: 'water_level', type: 'water_level', pin: 'GPIO34', pinFunction: 'analog' },
    { key: 'lux', type: 'lux', pin: 'GPIO35', pinFunction: 'analog' },
    { key: 'motion', type: 'motion', pin: 'GPIO5', pinFunction: 'digital' },
    // Actionneurs
    { key: 'light', type: 'led', pin: 'GPIO27', pinFunction: 'digital_out' },
    { key: 'fan1', type: 'led', pin: 'GPIO26', pinFunction: 'digital_out' },
    { key: 'pump', type: 'led', pin: 'GPIO25', pinFunction: 'digital_out' },
    { key: 'fan2', type: 'led', pin: 'GPIO33', pinFunction: 'digital_out' },
    { key: 'feeder', type: 'led', pin: 'GPIO32', pinFunction: 'digital_out' },
    { key: 'servo', type: 'servo_s390', pin: 'GPIO14', pinFunction: 'pwm' },
  ];

  const deployments: Record<string, any> = {};
  for (const d of deploymentsData) {
    const dep = await prisma.componentDeployment.create({
      data: {
        componentTypeId: componentTypes[d.type].componentTypeId,
        deviceId: device.deviceId,
        active: true,
        createdBy: admin.userId,
      },
    });
    deployments[d.key] = dep;

    await prisma.componentPinConnection.create({
      data: {
        deploymentId: dep.deploymentId,
        pinIdentifier: d.pin,
        pinFunction: d.pinFunction,
      },
    });
  }

  // ------------------------------------------------------------------------
  // 5. Zones
  // ------------------------------------------------------------------------
  const zoneMain = await prisma.zone.upsert({
    where: { name: 'Ferme Principale' },
    update: {},
    create: {
      name: 'Ferme Principale',
      description: 'Zone générale du dispositif',
      metadata: { location: 'Bâtiment', level: 1 },
      createdBy: admin.userId,
    },
  });

  const zoneSub = await prisma.zone.upsert({
    where: { name: 'Enclos Intérieur' },
    update: {},
    create: {
      name: 'Enclos Intérieur',
      description: 'Zone intérieure de la ferme',
      parentZoneId: zoneMain.zoneId,
      createdBy: admin.userId,
    },
  });

  // Affectation des déploiements à la bonne zone
  const sensorKeys = ['temperature', 'humidity', 'water_temp', 'water_level', 'lux', 'motion'];
  for (const key of Object.keys(deployments)) {
    const zoneId = sensorKeys.includes(key) ? zoneSub.zoneId : zoneMain.zoneId;
    await prisma.zoneComponentDeployment.upsert({
      where: { zoneId_deploymentId: { zoneId, deploymentId: deployments[key].deploymentId } },
      update: {},
      create: {
        zoneId,
        deploymentId: deployments[key].deploymentId,
        assignedBy: admin.userId,
      },
    });
  }

  // ------------------------------------------------------------------------
  // 6. Règles d'automatisation
  // ------------------------------------------------------------------------
  // Température élevée -> fan1
  await prisma.automationRule.create({
    data: {
      name: 'Ventilation température',
      description: 'Active le ventilateur principal si température > 35 °C',
      sensorDeploymentId: deployments['temperature'].deploymentId,
      operator: 'gt',
      thresholdValue: 35,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['fan1'].deploymentId,
      actuatorCommand: 'ON',
      actuatorParameters: {},
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  // Humidité élevée -> fan2
  await prisma.automationRule.create({
    data: {
      name: 'Ventilation humidité',
      description: 'Active le ventilateur secondaire si humidité > 70 %',
      sensorDeploymentId: deployments['humidity'].deploymentId,
      operator: 'gt',
      thresholdValue: 70,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['fan2'].deploymentId,
      actuatorCommand: 'ON',
      actuatorParameters: {},
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  // Luminosité faible -> light
  await prisma.automationRule.create({
    data: {
      name: 'Éclairage automatique',
      description: "Allume l'éclairage principal si luminosité < 200 lux (6h-20h)",
      sensorDeploymentId: deployments['lux'].deploymentId,
      operator: 'lt',
      thresholdValue: 200,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['light'].deploymentId,
      actuatorCommand: 'ON',
      actuatorParameters: {},
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  // Niveau d'eau bas -> pump + alerte
  await prisma.automationRule.create({
    data: {
      name: 'Remplissage réservoir',
      description: 'Active la pompe si niveau d\'eau < 30 %',
      sensorDeploymentId: deployments['water_level'].deploymentId,
      operator: 'lt',
      thresholdValue: 30,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['pump'].deploymentId,
      actuatorCommand: 'ON',
      actuatorParameters: {},
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  await prisma.automationRule.create({
    data: {
      name: 'Alerte niveau eau bas',
      description: 'Déclenche une alerte si niveau d\'eau < 30 %',
      sensorDeploymentId: deployments['water_level'].deploymentId,
      operator: 'lt',
      thresholdValue: 30,
      actionType: 'create_alert',
      alertTitle: 'Niveau d\'eau bas',
      alertMessage: 'Le niveau d\'eau du réservoir est inférieur à 30 %',
      alertSeverity: 'warning',
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  // Mouvement / intrusion -> alerte + light
  await prisma.automationRule.create({
    data: {
      name: 'Alerte intrusion',
      description: 'Déclenche une alerte critique en cas de mouvement nocturne',
      sensorDeploymentId: deployments['motion'].deploymentId,
      operator: 'eq',
      thresholdValue: 1,
      actionType: 'create_alert',
      alertTitle: 'Intrusion détectée',
      alertMessage: 'Un mouvement a été détecté dans la zone intérieure',
      alertSeverity: 'critical',
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  await prisma.automationRule.create({
    data: {
      name: 'Éclairage sécurité',
      description: 'Allume l\'éclairage si mouvement détecté',
      sensorDeploymentId: deployments['motion'].deploymentId,
      operator: 'eq',
      thresholdValue: 1,
      actionType: 'trigger_actuator',
      targetDeploymentId: deployments['light'].deploymentId,
      actuatorCommand: 'ON',
      actuatorParameters: { raison: 'sécurité' },
      isActive: true,
      cooldownMinutes: 5,
      createdBy: admin.userId,
    },
  });

  // ------------------------------------------------------------------------
  console.log('Seed terminé. Admin:', admin.email, 'User CM:', userCM.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 