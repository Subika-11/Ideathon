#include "HardwareSerial.h"
#include "DFRobotDFPlayerMini.h"

HardwareSerial mySerial(2); // UART2 (RX=25, TX=26)
DFRobotDFPlayerMini myDFPlayer;

void setup() {
  Serial.begin(115200);
  
  // Audio Setup: RX = GPIO25, TX = GPIO26
  mySerial.begin(9600, SERIAL_8N1, 25, 26);
  
  Serial.println("\n--- LegalEdge Audio Ready ---");
  
  if (!myDFPlayer.begin(mySerial)) {
    Serial.println("❌ DFPlayer not detected!");
  } else {
    Serial.println("✅ DFPlayer Ready!");
    myDFPlayer.volume(25); // Set volume (0-30)
  }
}

void loop() {
  // Listen for song numbers from the laptop
  if (Serial.available()) {
    int songNumber = Serial.parseInt(); 
    if (songNumber >= 1 && songNumber <= 17) {
      Serial.print("🔊 Playing track: ");
      Serial.println(songNumber);
      myDFPlayer.play(songNumber);
    } 
  }
}
