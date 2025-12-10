/// <reference types="vitest" />
import { describe, expect, it, beforeAll } from "vitest";
import {
  calculateChecksum,
  decryptSettings,
  encryptSettings,
  generateIV,
  generateSalt,
  isCryptoAvailable,
} from "@/lib/crypto-utils";

describe("crypto-utils", () => {
  beforeAll(() => {
    // Ensure Web Crypto is available in the test environment
    if (!(global as any).crypto || !(global as any).crypto.subtle) {
      (global as any).crypto = require("crypto").webcrypto;
    }
  });

  it("detects crypto availability", () => {
    expect(isCryptoAvailable()).toBe(true);
  });

  it("generates salt and iv with expected lengths", () => {
    expect(generateSalt()).toHaveLength(16);
    expect(generateIV()).toHaveLength(12);
  });

  it("encrypts and decrypts settings round-trip", async () => {
    const secret = { foo: "bar" };
    const password = "super-secure-password";
    const encrypted = await encryptSettings(secret, password);
    const payload = await decryptSettings(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );
    expect(payload.settings).toEqual(secret);
    expect(payload.checksum).toBe(encrypted.checksum);
  });

  it("calculates checksum deterministically", async () => {
    const c1 = await calculateChecksum("abc");
    const c2 = await calculateChecksum("abc");
    expect(c1).toBe(c2);
  });
});
