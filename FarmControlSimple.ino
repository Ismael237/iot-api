#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>

/***************************  CONFIGURATION  ********************************/
// Wi-Fi credentials (fixes)
const char* WIFI_SSID     = "TECNO POP 9";
const char* WIFI_PASSWORD = "password123";

// MQTT broker (fixes)
const char* MQTT_SERVER   = "192.168.0.246";
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "admin";   // optional
const char* MQTT_PASS     = "admin";   // optional

// Device identification
const char* DEVICE_ID   = "esp32-farm-001";
const char* BASE_TOPIC  = "farm";   // root namespace

// Derived topics
String topicSensor(const char* component)   { return String(BASE_TOPIC)+"/"+DEVICE_ID+"/sensor/"+component;   }
String topicActuator(const char* component) { return String(BASE_TOPIC)+"/"+DEVICE_ID+"/actuator/"+component; }
String topicStatus()                        { return String(BASE_TOPIC)+"/"+DEVICE_ID+"/status";             }
String topicHeartbeat()                     { return String(BASE_TOPIC)+"/"+DEVICE_ID+"/heartbeat";          }

/***************************  PIN MAPPING  **********************************/
// Sensors
#define PIN_DHT        4   // DHT11 data
#define PIN_DS18B20   18   // OneWire
#define PIN_WATER_LVL 34   // analog
#define PIN_PIR        5   // digital
#define PIN_LDR       35   // analog

// Actuators (LEDs + Servo)
#define PIN_SERVO     14
#define PIN_LED_LIGHT 27
#define PIN_LED_FAN1  26
#define PIN_LED_PUMP  25
#define PIN_LED_FAN2  33
#define PIN_LED_FEED  32

/***************************  GLOBALS  **************************************/
WiFiClient espClient;
PubSubClient mqttClient(espClient);

DHT dht(PIN_DHT, DHT11);
OneWire oneWire(PIN_DS18B20);
DallasTemperature ds18b20(&oneWire);
Servo servo;

// Actuator states (0/1)
bool stLight = 0, stFan1 = 0, stPump = 0, stFan2 = 0, stFeed = 0;
int  stServoAngle = 0;

// Timers
unsigned long lastSensorSend   = 0;
const unsigned long SENSOR_INT = 10000;   // 10 s
unsigned long lastHeartbeat    = 0;
const unsigned long HEART_INT  = 30000;   // 30 s

/***************************  HELPERS  **************************************/
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println("\nWiFi connected. IP:" + WiFi.localIP().toString());
}

void mqttReconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println("connected");
      // Subscribe to actuator topics (wildcard)
      mqttClient.subscribe((String(BASE_TOPIC)+"/"+DEVICE_ID+"/actuator/+" ).c_str(), 1); // QoS1 desired
      // Publish retained initial actuator states
      mqttClient.publish(topicActuator("light").c_str(),  String(stLight).c_str(),  true);
      mqttClient.publish(topicActuator("fan1").c_str(),   String(stFan1).c_str(),  true);
      mqttClient.publish(topicActuator("pump").c_str(),   String(stPump).c_str(),  true);
      mqttClient.publish(topicActuator("fan2").c_str(),   String(stFan2).c_str(),  true);
      mqttClient.publish(topicActuator("feeder").c_str(), String(stFeed).c_str(),  true);
      mqttClient.publish(topicActuator("servo").c_str(),  String(stServoAngle).c_str(), true);
      // Send status immediately
      publishStatus();
      // Send sensor snapshot immediately
      publishAllSensors();
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5s");
      delay(5000);
    }
  }
}

void publishStatus() {
  String payload = String("{\"status\":\"online\",\"ip\":\"") + WiFi.localIP().toString() + "\",\"firmware\":\"1.0\",\"uptime\":" + String(millis()/1000) + "}";
  mqttClient.publish(topicStatus().c_str(), payload.c_str(), true);
}

void publishHeartbeat() {
  String ts = String(millis()/1000);
  mqttClient.publish(topicHeartbeat().c_str(), ts.c_str());
}

void publishSensor(const String& topic, float value, const char* unit) {
  char buf[128];
  snprintf(buf, sizeof(buf), "{\"value\":%.2f,\"unit\":\"%s\",\"timestamp\":%lu}", value, unit, millis()/1000);
  mqttClient.publish(topic.c_str(), buf);
}

void publishAllSensors() {
  // DHT
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) publishSensor(topicSensor("temperature"), t, "C");
  if (!isnan(h)) publishSensor(topicSensor("humidity"),    h, "%");
  // DS18B20
  ds18b20.requestTemperatures();
  float wt = ds18b20.getTempCByIndex(0);
  if (wt != DEVICE_DISCONNECTED_C) publishSensor(topicSensor("water_temp"), wt, "C");
  // Water level (simple % of ADC)
  int raw   = analogRead(PIN_WATER_LVL);
  float lvl = (4095 - raw) * 100.0 / 4095.0; // assume empty=4095 full=0
  publishSensor(topicSensor("water_level"), lvl, "%");
  // LDR to lux approximate
  int rawLdr = analogRead(PIN_LDR);
  float lux = map(rawLdr, 0, 4095, 1000, 0); // inverse
  publishSensor(topicSensor("lux"), lux, "lux");
  // PIR (motion 0/1)
  int motion = digitalRead(PIN_PIR);
  publishSensor(topicSensor("motion"), motion, "bool");
}

void setDigitalActuator(uint8_t pin, bool &stateVar, bool newState, const char* component) {
  stateVar = newState;
  digitalWrite(pin, newState ? HIGH : LOW);
  mqttClient.publish(topicActuator(component).c_str(), String(stateVar).c_str(), true);
}

void mqttCallback(char* topic, byte* payload, unsigned int len) {
  String tpc = String(topic);
  String msg;
  for (unsigned int i=0;i<len;i++) msg += (char)payload[i];
  Serial.printf("[MQTT] %s => %s\n", tpc.c_str(), msg.c_str());
  bool valBool = (msg == "1" || msg == "true" || msg == "ON" || msg == "on");
  if (tpc == topicActuator("light"))   setDigitalActuator(PIN_LED_LIGHT, stLight, valBool, "light");
  else if (tpc == topicActuator("fan1")) setDigitalActuator(PIN_LED_FAN1, stFan1, valBool, "fan1");
  else if (tpc == topicActuator("pump")) setDigitalActuator(PIN_LED_PUMP, stPump, valBool, "pump");
  else if (tpc == topicActuator("fan2")) setDigitalActuator(PIN_LED_FAN2, stFan2, valBool, "fan2");
  else if (tpc == topicActuator("feeder")) setDigitalActuator(PIN_LED_FEED, stFeed, valBool, "feeder");
  else if (tpc == topicActuator("servo")) {
    int angle = msg.toInt();
    angle = constrain(angle, 0, 180);
    stServoAngle = angle;
    servo.write(angle);
    mqttClient.publish(topicActuator("servo").c_str(), String(angle).c_str(), true);
  }
}

/***************************  SETUP  ****************************************/
void setup() {
  Serial.begin(115200);
  // Configure pins
  pinMode(PIN_LED_LIGHT, OUTPUT);
  pinMode(PIN_LED_FAN1, OUTPUT);
  pinMode(PIN_LED_PUMP, OUTPUT);
  pinMode(PIN_LED_FAN2, OUTPUT);
  pinMode(PIN_LED_FEED, OUTPUT);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_WATER_LVL, INPUT);
  pinMode(PIN_LDR, INPUT);

  servo.attach(PIN_SERVO);

  dht.begin();
  ds18b20.begin();

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

/***************************  LOOP  *****************************************/
void loop() {
  if (!mqttClient.connected()) mqttReconnect();
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastSensorSend >= SENSOR_INT) {
    lastSensorSend = now;
    publishAllSensors();
  }
  if (now - lastHeartbeat >= HEART_INT) {
    lastHeartbeat = now;
    publishHeartbeat();
  }
}