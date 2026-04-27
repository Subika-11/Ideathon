#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WebServer.h>
#include "HardwareSerial.h"
#include "DFRobotDFPlayerMini.h"

// --- CONFIG ---
const char* ssid = "Sanjayyy";
const char* password = "sanjay10";
const char* serverUrl = "http://172.20.10.4:8000"; // Laptop IP

// --- PINS ---
#define TRIG_PIN  32
#define ECHO_PIN  33
#define SDA_PIN   5
#define RST_PIN   22

MFRC522 rfid(SDA_PIN, RST_PIN);
HardwareSerial audioSerial(2); // UART2 (RX=25, TX=26)
DFRobotDFPlayerMini myDFPlayer;
WebServer server(80); 

void handlePlay() {
  if (server.hasArg("track")) {
    int track = server.arg("track").toInt();
    myDFPlayer.play(track);
    server.send(200, "text/plain", "Playing");
  }
}

void setup() {
  Serial.begin(115200);
  audioSerial.begin(9600, SERIAL_8N1, 25, 26);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\n✅ WiFi Connected: " + WiFi.localIP().toString());

  SPI.begin();
  rfid.PCD_Init();
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  if (!myDFPlayer.begin(audioSerial)) {
    Serial.println("❌ DFPlayer not detected!");
  } else {
    myDFPlayer.volume(25);
  }

  server.on("/play", handlePlay);
  server.begin();
}

void loop() {
  server.handleClient(); 

  // 1. ULTRASONIC
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distance = duration * 0.034 / 2;

  bool presence = (distance > 0 && distance < 50);
  
  // Send Presence
  HTTPClient http;
  http.begin(String(serverUrl) + "/update-presence");
  http.addHeader("Content-Type", "application/json");
  http.POST("{\"presence\":" + String(presence ? "true" : "false") + "}");
  http.end();

  // 2. RFID
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
      if (i != rfid.uid.size - 1) uid += ":";
    }
    uid.toUpperCase();
    
    http.begin(String(serverUrl) + "/update-rfid");
    http.addHeader("Content-Type", "application/json");
    http.POST("{\"uid\":\"" + uid + "\"}");
    http.end();
    
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  delay(500);
}
