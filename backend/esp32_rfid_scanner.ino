#include <SPI.h>
#include <MFRC522.h>
#include "HardwareSerial.h"
#include "DFRobotDFPlayerMini.h"

// --- PIN CONFIGURATION ---
// RFID Scanner (SPI)
#define SS_PIN    5   // GPIO5 (SDA)
#define RST_PIN   22  // GPIO22
MFRC522 rfid(SS_PIN, RST_PIN);

// Ultrasonic Sensor
#define TRIG_PIN  32  // GPIO32
#define ECHO_PIN  33  // GPIO33

// Motor Control
#define IN2       14  // GPIO14 (Direction)
#define ENA       27  // GPIO27 (Speed/PWM)

// DFPlayer Mini (UART2)
#define DF_RX     25  // GPIO25
#define DF_TX     26  // GPIO26
HardwareSerial dfSerial(2);
DFRobotDFPlayerMini myDFPlayer;

// --- CONSTANTS & VARIABLES ---
const int DISTANCE_THRESHOLD = 50; // cm
long duration;
float distance;
bool lastPresence = false;
unsigned long lastDistanceCheck = 0;
const int CHECK_INTERVAL = 200; // ms

void setup() {
  // 1. Initialize Primary Serial (PC Communication)
  Serial.begin(115200);
  while(!Serial); // Wait for connection

  // 2. Initialize SPI & RFID
  SPI.begin();
  Serial.println("✅ RFID Scanner: Initializing...");
  rfid.PCD_Init();
  rfid.PCD_DumpVersionToSerial(); // This will help check if the wiring is correct
  
  // 3. Initialize Ultrasonic Pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // 3.5. Initialize Motor Control
  pinMode(IN2, OUTPUT);
  ledcAttach(ENA, 5000, 8);   // pin, frequency (5kHz), resolution (8-bit)
  digitalWrite(IN2, LOW);
  ledcWrite(ENA, 0);          // Motor off initially

  // 4. Initialize DFPlayer Serial (UART2)
  dfSerial.begin(9600, SERIAL_8N1, DF_RX, DF_TX);
  
  Serial.println("\n========================================");
  Serial.println("   LegalEdge Kiosk Hardware Suite v3.0  ");
  Serial.println("========================================");

  if (!myDFPlayer.begin(dfSerial)) {
    Serial.println("❌ DFPlayer Mini: Not Found (Check wiring/SD card)");
  } else {
    Serial.println("✅ DFPlayer Mini: Ready");
    myDFPlayer.volume(25); // 0 to 30
  }

  Serial.println("✅ RFID Scanner: Ready");
  Serial.println("✅ Ultrasonic Sensor: Ready");
  Serial.println("✅ Motor Control: Ready");
  Serial.println("----------------------------------------");
}

void loop() {
  // 1. ASYNC ULTRASONIC SENSING
  if (millis() - lastDistanceCheck >= CHECK_INTERVAL) {
    lastDistanceCheck = millis();
    
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
    distance = duration * 0.034 / 2;

    // Report presence state via serial
    if (distance > 0 && distance < DISTANCE_THRESHOLD) {
      Serial.println("PRESENCE:ON");
    } else {
      Serial.println("PRESENCE:OFF");
    }
  }

  // 2. RFID SCANNING
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

  // 3. AUDIO COMMAND LISTENER (From Backend)
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    // Check if it's a numeric track command
    if (input.length() > 0 && isDigit(input[0])) {
      int track = input.toInt();
      if (track >= 1 && track <= 30) {
        Serial.print("🔊 Playing Track: ");
        Serial.println(track);
        myDFPlayer.play(track);
      }
    }
    
    // Check for OTP verification command
    if (input == "OTP_VERIFIED") {
      Serial.println("✅ OTP Verified! Activating Motor...");
      runMotor();
    }
  }

  delay(10); // Small stability delay
}

// --- MOTOR CONTROL FUNCTION ---
void runMotor() {
  // Motor runs for a controlled sequence (450ms for new user card issuance)
  digitalWrite(IN2, HIGH);   // Set direction
  ledcWrite(ENA, 200);       // Speed (0-255)
  delay(450);                // Run for exactly 450ms
  
  ledcWrite(ENA, 0);         // Stop motor
  Serial.println("✅ Motor Sequence Complete");
}