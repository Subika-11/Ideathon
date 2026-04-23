#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RFID Scanner Ready. Scan a card...");
}

void loop() {
  // Look for a new card
  if (!rfid.PICC_IsNewCardPresent()) return;

  // Try to read the card serial
  if (!rfid.PICC_ReadCardSerial()) return;

  // Build UID string in format: E9:33:E2:06
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i != rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  // Send UID to serial — Python backend reads this line
  Serial.println(uid);

  // Halt card so it's not read again immediately
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // Small debounce delay
  delay(1000);
}
