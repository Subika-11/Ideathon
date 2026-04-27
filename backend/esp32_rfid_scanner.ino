#include <SPI.h>
#include <MFRC522.h>
#include <WiFiClient.h>

// --- RFID CONFIG ---
#define SS_PIN  4    // GPIO4 (D2 on NodeMCU)
#define RST_PIN 5    // GPIO5 (D1 on NodeMCU)
MFRC522 rfid(SS_PIN, RST_PIN);

// --- ULTRASONIC CONFIG ---
#define TRIG 5
#define ECHO 18
long duration;
float distance;
bool lastPresence = false;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  Serial.println("\n--- LegalEdge Hardware Ready ---");
  Serial.println("RFID Scanner: Active");
  Serial.println("Ultrasonic Sensor: Active (Threshold: 50cm)");
}

void loop() {
  // 1. ULTRASONIC SENSOR LOGIC
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  
  duration = pulseIn(ECHO, HIGH, 30000);
  distance = duration * 0.034 / 2;

  // Detection logic - Send every loop for reliability
  if (distance > 0 && distance < 50) {
    Serial.println("PRESENCE:ON");
  } else {
    Serial.println("PRESENCE:OFF");
  }

  // 2. RFID SCANNER LOGIC
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
      if (i != rfid.uid.size - 1) uid += ":";
    }
    uid.toUpperCase();
    
    Serial.print("RFID:");
    Serial.println(uid);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  delay(500);
}
