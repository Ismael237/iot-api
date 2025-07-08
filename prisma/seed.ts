import { PrismaClient, ComponentCategory } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🌱 Starting database seed...');

        // ------------------------------------------------------------------------
        // 1. Users
        // ------------------------------------------------------------------------
        console.log('📝 Creating users...');

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

        console.log(`✅ Users created: ${admin.email}, ${userCM.email}`);

        // ------------------------------------------------------------------------
        // 2. ESP32 Device (identical to sketch)
        // ------------------------------------------------------------------------
        console.log('🔧 Creating ESP32 device...');

        const device = await prisma.ioTDevice.upsert({
            where: { identifier: 'esp32-farm-001' },
            update: {},
            create: {
                identifier: 'esp32-farm-001',
                deviceType: 'esp32',
                model: 'ESP32 DevKit',
                metadata: {
                    firmware: '1.0',
                    tags: ['esp32', 'prototype'],
                    ip: null,
                    location: 'Main Farm Building',
                    installDate: new Date().toISOString()
                },
                active: true,
                createdBy: admin.userId,
            },
        });

        console.log(`✅ Device created: ${device.identifier}`);

        // ------------------------------------------------------------------------
        // 3. Component types (sensors + actuators)
        // ------------------------------------------------------------------------
        console.log('🔩 Creating component types...');

        const componentTypesData: { name: string; identifier: string; category: ComponentCategory; unit: string; description: string; createdBy: number; }[] = [
            // Sensors
            { name: 'Temperature Sensor', identifier: 'dht11_sensor_temperature', category: ComponentCategory.sensor, unit: '°C', description: 'DHT11 temperature and humidity sensor', createdBy: admin.userId },
            { name: 'Humidity Sensor', identifier: 'dht11_sensor_humidity', category: ComponentCategory.sensor, unit: '%', description: 'DHT11 temperature and humidity sensor', createdBy: admin.userId },
            { name: 'Water Temperature Sensor', identifier: 'ds18b20_sensor', category: ComponentCategory.sensor, unit: '°C', description: 'DS18B20 waterproof temperature sensor', createdBy: admin.userId },
            { name: 'Water Level Sensor', identifier: 'water_level_sensor', category: ComponentCategory.sensor, unit: '%', description: 'Analog water level sensor', createdBy: admin.userId },
            { name: 'Light Intensity Sensor', identifier: 'ldr_sensor', category: ComponentCategory.sensor, unit: 'lux', description: 'LDR light sensor for ambient light measurement', createdBy: admin.userId },
            { name: 'Motion Sensor', identifier: 'pir_sensor', category: ComponentCategory.sensor, unit: 'boolean', description: 'PIR motion detection sensor', createdBy: admin.userId },
            // Actuators
            { name: 'Main Lighting System', identifier: 'lighting_system', category: ComponentCategory.actuator, unit: '', description: 'Main farm lighting system', createdBy: admin.userId },
            { name: 'Ventilation Fan 1', identifier: 'ventilation_fan_1', category: ComponentCategory.actuator, unit: '', description: 'Ventilation fan for air circulation', createdBy: admin.userId },
            { name: 'Ventilation Fan 2', identifier: 'ventilation_fan_2', category: ComponentCategory.actuator, unit: '', description: 'Ventilation fan for air circulation', createdBy: admin.userId },
            { name: 'Water Pump', identifier: 'water_pump', category: ComponentCategory.actuator, unit: '', description: 'Water pump for irrigation system', createdBy: admin.userId },
            { name: 'Automatic Feeder', identifier: 'automatic_feeder', category: ComponentCategory.actuator, unit: '', description: 'Automatic animal feeding system', createdBy: admin.userId },
            { name: 'Gate Control Servo', identifier: 'gate_servo', category: ComponentCategory.actuator, unit: 'degrees', description: 'Servo motor for gate control', createdBy: admin.userId },
        ];

        const componentTypes: Record<string, any> = {};
        for (const data of componentTypesData) {
            try {
                const ct = await prisma.componentType.upsert({
                    where: { identifier: data.identifier },
                    update: {},
                    create: data,
                });
                componentTypes[data.identifier] = ct;
                console.log(`  ✓ Component type created: ${data.name}`);
            } catch (error) {
                console.error(`  ❌ Error creating component type ${data.name}:`, error);
                throw error;
            }
        }

        // ------------------------------------------------------------------------
        // 4. Deployments + pin connections
        // ------------------------------------------------------------------------
        console.log('🔌 Creating deployments and pin connections...');

        const deploymentsData = [
            // Sensors
            { key: 'temperature', type: 'dht11_sensor_temperature', pin: 'GPIO4', pinFunction: 'data' },
            { key: 'humidity', type: 'dht11_sensor_humidity', pin: 'GPIO2', pinFunction: 'data' },
            { key: 'water_temp', type: 'ds18b20_sensor', pin: 'GPIO18', pinFunction: 'onewire' },
            { key: 'water_level', type: 'water_level_sensor', pin: 'GPIO34', pinFunction: 'analog' },
            { key: 'lux', type: 'ldr_sensor', pin: 'GPIO35', pinFunction: 'analog' },
            { key: 'motion', type: 'pir_sensor', pin: 'GPIO5', pinFunction: 'digital' },
            // Actuators
            { key: 'light', type: 'lighting_system', pin: 'GPIO27', pinFunction: 'digital_out' },
            { key: 'fan1', type: 'ventilation_fan_1', pin: 'GPIO26', pinFunction: 'digital_out' },
            { key: 'fan2', type: 'ventilation_fan_2', pin: 'GPIO33', pinFunction: 'digital_out' },
            { key: 'pump', type: 'water_pump', pin: 'GPIO25', pinFunction: 'digital_out' },
            { key: 'feeder', type: 'automatic_feeder', pin: 'GPIO32', pinFunction: 'digital_out' },
            { key: 'servo', type: 'gate_servo', pin: 'GPIO14', pinFunction: 'pwm' },
        ];

        const deployments: Record<string, any> = {};
        for (const d of deploymentsData) {
            try {
                // Check that component type exists
                if (!componentTypes[d.type]) {
                    throw new Error(`Component type '${d.type}' not found`);
                }

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

                console.log(`  ✓ Deployment created: ${d.key} (${d.type}) on ${d.pin}`);
            } catch (error) {
                console.error(`  ❌ Error creating deployment ${d.key}:`, error);
                throw error;
            }
        }

        // ------------------------------------------------------------------------
        // 5. Zones
        // ------------------------------------------------------------------------
        console.log('🏗️ Creating zones...');

        const zoneMain = await prisma.zone.upsert({
            where: { zoneId: 1 },
            update: {},
            create: {
                name: 'Main Farm',
                description: 'Main farm area and general facility',
                metadata: {
                    location: 'Main Building',
                    level: 1,
                    area: 'main',
                    capacity: 100
                },
                createdBy: admin.userId,
            },
        });

        const zoneSub = await prisma.zone.upsert({
            where: { zoneId: 2 },
            update: {},
            create: {
                name: 'Indoor Enclosure',
                description: 'Indoor farming area',
                parentZoneId: zoneMain.zoneId,
                metadata: {
                    area: 'indoor',
                    capacity: 50
                },
                createdBy: admin.userId,
            },
        });

        console.log(`✅ Zones created: ${zoneMain.name}, ${zoneSub.name}`);

        // Assign deployments to appropriate zones
        console.log('📍 Assigning deployments to zones...');

        const sensorKeys = ['temperature', 'humidity', 'water_temp', 'water_level', 'lux', 'motion'];
        for (const [key, deployment] of Object.entries(deployments)) {
            try {
                const zoneId = sensorKeys.includes(key) ? zoneSub.zoneId : zoneMain.zoneId;
                await prisma.zoneComponentDeployment.upsert({
                    where: {
                        zoneId_deploymentId: {
                            zoneId,
                            deploymentId: deployment.deploymentId
                        }
                    },
                    update: {},
                    create: {
                        zoneId,
                        deploymentId: deployment.deploymentId,
                        assignedBy: admin.userId,
                    },
                });
                console.log(`  ✓ ${key} assigned to zone ${sensorKeys.includes(key) ? 'Indoor Enclosure' : 'Main Farm'}`);
            } catch (error) {
                console.error(`  ❌ Error assigning ${key}:`, error);
                throw error;
            }
        }

        // ------------------------------------------------------------------------
        // 6. Automation rules
        // ------------------------------------------------------------------------
        console.log('🤖 Creating automation rules...');

        const automationRules = [
            {
                name: 'Temperature Ventilation',
                description: 'Activates primary fan when temperature exceeds 35°C',
                sensorKey: 'temperature',
                operator: 'gt',
                thresholdValue: 35,
                actionType: 'trigger_actuator',
                targetKey: 'fan1',
                actuatorCommand: 'ON',
                actuatorParameters: { reason: 'high_temperature' },
                isActive: true,
                cooldownMinutes: 5,
            },
            {
                name: 'Humidity Ventilation',
                description: 'Activates secondary fan when humidity exceeds 70%',
                sensorKey: 'humidity',
                operator: 'gt',
                thresholdValue: 70,
                actionType: 'trigger_actuator',
                targetKey: 'fan2',
                actuatorCommand: 'ON',
                actuatorParameters: { reason: 'high_humidity' },
                isActive: true,
                cooldownMinutes: 5,
            },
            {
                name: 'Automatic Lighting',
                description: 'Turns on main lighting when ambient light falls below 200 lux',
                sensorKey: 'lux',
                operator: 'lt',
                thresholdValue: 200,
                actionType: 'trigger_actuator',
                targetKey: 'light',
                actuatorCommand: 'ON',
                actuatorParameters: { reason: 'low_light', schedule: '6h-20h' },
                isActive: true,
                cooldownMinutes: 5,
            },
            {
                name: 'Water Reservoir Filling',
                description: 'Activates water pump when water level drops below 30%',
                sensorKey: 'water_level',
                operator: 'lt',
                thresholdValue: 30,
                actionType: 'trigger_actuator',
                targetKey: 'pump',
                actuatorCommand: 'ON',
                actuatorParameters: { reason: 'low_water_level' },
                isActive: true,
                cooldownMinutes: 5,
            },
            {
                name: 'Low Water Level Alert',
                description: 'Triggers alert when water level drops below 30%',
                sensorKey: 'water_level',
                operator: 'lt',
                thresholdValue: 30,
                actionType: 'create_alert',
                alertTitle: 'Low Water Level',
                alertMessage: 'Water reservoir level is below 30%',
                alertSeverity: 'warning',
                isActive: true,
                cooldownMinutes: 5,
            },
            {
                name: 'Intrusion Alert',
                description: 'Triggers critical alert when motion is detected during night hours',
                sensorKey: 'motion',
                operator: 'eq',
                thresholdValue: 1,
                actionType: 'create_alert',
                alertTitle: 'Intrusion Detected',
                alertMessage: 'Motion detected in indoor enclosure',
                alertSeverity: 'critical',
                isActive: true,
                cooldownMinutes: 5,
            },
            {
                name: 'Security Lighting',
                description: 'Activates lighting when motion is detected',
                sensorKey: 'motion',
                operator: 'eq',
                thresholdValue: 1,
                actionType: 'trigger_actuator',
                targetKey: 'light',
                actuatorCommand: 'ON',
                actuatorParameters: { reason: 'security_motion' },
                isActive: true,
                cooldownMinutes: 5,
            },
        ];

        for (const rule of automationRules) {
            try {
                // Check that deployments exist
                if (!deployments[rule.sensorKey]) {
                    throw new Error(`Sensor deployment '${rule.sensorKey}' not found`);
                }

                const ruleData: any = {
                    name: rule.name,
                    description: rule.description,
                    sensorDeploymentId: deployments[rule.sensorKey].deploymentId,
                    operator: rule.operator,
                    thresholdValue: rule.thresholdValue,
                    actionType: rule.actionType,
                    isActive: rule.isActive,
                    cooldownMinutes: rule.cooldownMinutes,
                    createdBy: admin.userId,
                };

                // Add specific fields based on action type
                if (rule.actionType === 'trigger_actuator') {
                    if (!rule.targetKey || !deployments[rule.targetKey]) {
                        throw new Error(`Actuator deployment '${rule.targetKey}' not found`);
                    }
                    ruleData.targetDeploymentId = deployments[rule.targetKey].deploymentId;
                    ruleData.actuatorCommand = rule.actuatorCommand;
                    ruleData.actuatorParameters = rule.actuatorParameters || {};
                } else if (rule.actionType === 'create_alert') {
                    ruleData.alertTitle = rule.alertTitle;
                    ruleData.alertMessage = rule.alertMessage;
                    ruleData.alertSeverity = rule.alertSeverity;
                }

                await prisma.automationRule.create({
                    data: ruleData,
                });

                console.log(`  ✓ Rule created: ${rule.name}`);
            } catch (error) {
                console.error(`  ❌ Error creating rule ${rule.name}:`, error);
                throw error;
            }
        }

        // ------------------------------------------------------------------------
        console.log('🎉 Seed completed successfully!');
        console.log(`👤 Admin: ${admin.email}`);
        console.log(`👤 User CM: ${userCM.email}`);
        console.log(`🔧 Device: ${device.identifier}`);
        console.log(`📊 Component types: ${Object.keys(componentTypes).length}`);
        console.log(`🔌 Deployments: ${Object.keys(deployments).length}`);
        console.log(`🏗️ Zones: 2`);
        console.log(`🤖 Automation rules: ${automationRules.length}`);

    } catch (error) {
        console.error('❌ Error during seed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('💥 Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('🔌 Prisma connection closed');
    });