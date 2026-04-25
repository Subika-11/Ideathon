#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

const char* ssid = "Sanjayyy";        
const char* password = "sanjay10"; 
const char* backendUrl = "http://10.10.166.122:8000/update-rfid";

#define SS_PIN  D2   // GPIO4
#define RST_PIN D1   // GPIO5

MFRC522 rfid(SS_PIN, RST_PIN);

void sendToBackend(String uid) {
  if(WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    Serial.print("Sending UID to backend: ");
    Serial.println(uid);

    http.begin(client, backendUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"uid\": \"" + uid + "\"}";
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      Serial.print("Backend response: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  Serial.println("\nConnecting to WiFi (Sanjayyy)...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! Ready for scans.");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i != rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();
  
  Serial.print("Card Scanned: ");
  Serial.println(uid);

  sendToBackend(uid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);
}
