export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum DeviceTypeEnum {
  ARDUINO_UNO = 'arduino_uno',
  ARDUINO_NANO = 'arduino_nano',
  ESP32 = 'esp32',
  ESP8266 = 'esp8266',
  RASPBERRY_PI = 'raspberry_pi',
  SENSOR_MODULE = 'sensor_module',
  ACTUATOR_MODULE = 'actuator_module',
  GATEWAY = 'gateway',
}

export enum ComponentCategory {
  SENSOR = 'sensor',
  ACTUATOR = 'actuator',
}

export enum ConnStatus {
  UNKNOWN = 'unknown',
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export enum ComparisonOperator {
  GT = '>',
  LT = '<',
  GTE = '>=',
  LTE = '<=',
  EQ = '=',
  NEQ = '!=',
}

export enum AutomationActionType {
  CREATE_ALERT = 'create_alert',
  TRIGGER_ACTUATOR = 'trigger_actuator',
} 