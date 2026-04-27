let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter<string> | null = null;

export async function connectSerial() {
  // Disabled: We are using Wireless WiFi Mode now.
  // This prevents the "wants to connect to a serial port" browser popup.
  return;
}

export async function sendToESP32(message: string) {
  if (!writer) {
    await connectSerial();
  }

  await writer!.write(message + "\n");
}
