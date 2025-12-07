import { EncryptedPayload } from "@/types/settings-export";

// Check if Web Crypto API is available
function checkCryptoAvailability(): void {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "Web Crypto API is not available. Please ensure you are accessing this page over HTTPS or localhost."
    );
  }
}

// Public function to check if crypto is available (returns boolean instead of throwing)
export function isCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && !!crypto.subtle;
}

// Generate cryptographically secure random salt (16 bytes)
export function generateSalt(): Uint8Array {
  checkCryptoAvailability();
  return crypto.getRandomValues(new Uint8Array(16));
}

// Generate cryptographically secure random IV (12 bytes for GCM)
export function generateIV(): Uint8Array {
  checkCryptoAvailability();
  return crypto.getRandomValues(new Uint8Array(12));
}

// Derive encryption key from password using PBKDF2
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  checkCryptoAvailability();

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 600_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt settings object
export async function encryptSettings(
  settings: Record<string, string>,
  password: string
): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
  checksum: string;
}> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  // Create payload with checksum
  const payload: EncryptedPayload = {
    settings,
    exportedBy: "Quiz Master Settings",
    timestamp: new Date().toISOString(),
    checksum: await calculateChecksum(JSON.stringify(settings)),
  };

  // Encrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    data
  );

  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    checksum: payload.checksum,
  };
}

// Decrypt settings data
export async function decryptSettings(
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<EncryptedPayload> {
  const key = await deriveKey(password, base64ToBuffer(salt));

  const encryptedBuffer = base64ToBuffer(encryptedData);
  const ivBuffer = base64ToBuffer(iv);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer as BufferSource },
      key,
      encryptedBuffer as BufferSource
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    const payload: EncryptedPayload = JSON.parse(decryptedText);

    // Verify checksum
    const actualChecksum = await calculateChecksum(
      JSON.stringify(payload.settings)
    );
    if (actualChecksum !== payload.checksum) {
      throw new Error("Data integrity check failed");
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "OperationError") {
      throw new Error("Incorrect password or corrupted file");
    }
    throw error;
  }
}

// Calculate SHA-256 checksum
export async function calculateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return bufferToBase64(hashBuffer);
}

// Helper: Buffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to Buffer
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
