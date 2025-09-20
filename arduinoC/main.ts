
//% color="#aa00ff" iconWidth=50 iconHeight=40
    namespace k10Camera2base64{
        
        //% block="初始化设置" blockType="tag"
        export function networkSettings() {}
        
        //% block="Connect WiFi name [WIFI_NAME] password [WIFI_PASSWORD]" blockType="command"
        //% WIFI_NAME.shadow="string" WIFI_NAME.defl="wifi name"
        //% WIFI_PASSWORD.shadow="string" WIFI_PASSWORD.defl="wifi password"
        export function connectWiFi(parameter: any, block: any) {
            let wifiName = parameter.WIFI_NAME.code;
            let wifiPassword = parameter.WIFI_PASSWORD.code;
            
            Generator.addInclude('WiFi', '#include <WiFi.h>');
            Generator.addObject('wifi_ssid', 'const char*', `ssid = ${wifiName};`);
            Generator.addObject('wifi_password', 'const char*', `password = ${wifiPassword};`);
            
            Generator.addObject('connectWiFi', 'void', `connectWiFi() 
{
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) 
    {
    delay(500);
    Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) 
    {
    Serial.println("WiFi connected.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    } 
    else 
    {
        Serial.println("WiFi connection failed!");
    }
}
`);
        }
        
        //% block="Connect SIoT V2 server IP [SERVER_IP] account [ACCOUNT] password [PASSWORD]" blockType="command"
        //% SERVER_IP.shadow="string" SERVER_IP.defl="192.168."
        //% ACCOUNT.shadow="string" ACCOUNT.defl="siot"
        //% PASSWORD.shadow="string" PASSWORD.defl="dfrobot"
        export function connectSIoT(parameter: any, block: any) {
            let serverIP = parameter.SERVER_IP.code;
            let account = parameter.ACCOUNT.code;
            let password = parameter.PASSWORD.code;
            
            Generator.addInclude('ArduinoMqttClient', '#include <ArduinoMqttClient.h>');
            Generator.addObject('mqtt_server', 'const char*', `mqtt_server = ${serverIP};`);
            Generator.addObject('mqtt_port', 'const int', 'mqtt_port = 1883;');
            Generator.addObject('mqtt_user', 'const char*', `mqtt_user = ${account};`);
            Generator.addObject('mqtt_password', 'const char*', `mqtt_password = ${password};`);
            Generator.addObject('wifiClient', 'WiFiClient', 'wifiClient;');
            Generator.addObject('mqttClient', 'MqttClient', 'mqttClient(wifiClient);');
            
            Generator.addObject('reconnectMQTT', 'void', `reconnectMQTT()
{
    if (mqttClient.connected()) {return;}
    Serial.print("Connecting to MQTT...");
    mqttClient.setId("ESP32Client");
    mqttClient.setUsernamePassword(mqtt_user, mqtt_password);
    if (mqttClient.connect(mqtt_server, mqtt_port)) {Serial.println("MQTT connected.");}
    else{ Serial.println("MQTT connection failed!");}
}
`);
        }
        
        //% block="Set image transmission topic [TOPIC] interval [INTERVAL] ms" blockType="command"
        //% TOPIC.shadow="string" TOPIC.defl="siot/测试"
        //% INTERVAL.shadow="number" INTERVAL.defl=2000
        export function setImageConfig(parameter: any, block: any) {
            let topic = parameter.TOPIC.code;
            let interval = parameter.INTERVAL.code;
            
            Generator.addObject('mqtt_topic', 'const char*', `mqtt_topic = ${topic};`);
            Generator.addObject('publishInterval', 'const unsigned long', `publishInterval = ${interval};`);
            Generator.addObject('lastPublishTime', 'unsigned long', 'lastPublishTime = 0;');
        }
        
        //% block="Start camera image transmission with configured parameters" blockType="command"
        export function startCameraTransmission(parameter: any, block: any) {
            Generator.addInclude('k10_base64', '#include "k10_base64.h"');
            Generator.addInclude('unihiker_k10', '#include "unihiker_k10.h"');
            Generator.addObject('k10', 'UNIHIKER_K10', 'k10;');
            Generator.addObject('base64_cam', 'K10_base64', 'base64_cam;');
            
            Generator.addSetup('k10_serial', 'Serial.begin(9600);');
            Generator.addSetup('k10_init', 'k10.begin();');
            Generator.addSetup('k10_screen', 'k10.initScreen();');
            Generator.addSetup('k10_camera', 'k10.initBgCamerImage();');
            Generator.addSetup('wifi_connect', 'connectWiFi();');
            Generator.addSetup('mqtt_connect', 'reconnectMQTT();');
        }
        
        //% block="循环执行" blockType="tag"
        export function tag2() {}

        //% block="Transmit one image using configured interval" blockType="command"
        export function transmitImage(parameter: any, block: any) {
            Generator.addCode(`if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi lost, reconnecting...");
        connectWiFi();
    }

    reconnectMQTT();
    mqttClient.poll();

    if (millis() - lastPublishTime >= publishInterval) {
        lastPublishTime = millis();
        String base64Image = "data:image/jpg;base64,";
        base64Image += base64_cam.K10tobase64();
        Serial.println("Publishing message...");
        mqttClient.setTxPayloadSize(base64Image.length());
        mqttClient.beginMessage(mqtt_topic, true, 0);
        mqttClient.print(base64Image);
        mqttClient.endMessage();
        Serial.println("Message sent!");
     }`);
        }
    }
    