let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter<string> | null = null;

export async function connectSerial() {
  if (!("serial" in navigator)) {
    alert("Web Serial API not supported. Use Chrome or Edge.");
    return;
  }

  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  if (!port.writable) {
    throw new Error("Serial port writable stream not available");
  }

  // ✅ Encode strings → Uint8Array automatically
  const textEncoder = new TextEncoderStream();
  textEncoder.readable.pipeTo(port.writable);

  writer = textEncoder.writable.getWriter();
}

export async function sendToESP32(message: string) {
  if (!writer) {
    await connectSerial();
  }

  await writer!.write(message + "\n");
}
