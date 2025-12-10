import { encryptSettings, decryptSettings } from "./crypto-utils";
import {
  SettingsExportFile,
  ImportPreview,
} from "@/types/settings-export";

// Primary API keys to export (exclude cached/derived data)
const PRIMARY_KEYS = [
  "ngrok_token",
  "shortio_api_key",
  "shortio_domain",
  "openai_api_key",
  "unsplash_api_key",
];

// Export settings to encrypted file
export async function exportSettingsToFile(
  allSettings: Record<string, string>,
  password: string
): Promise<SettingsExportFile> {
  // Filter to only primary keys
  const primarySettings: Record<string, string> = {};
  for (const key of PRIMARY_KEYS) {
    if (allSettings[key]) {
      primarySettings[key] = allSettings[key];
    }
  }

  const { encryptedData, salt, iv } = await encryptSettings(
    primarySettings,
    password
  );

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    encryptedData,
    salt,
    iv,
    metadata: {
      settingsCount: Object.keys(primarySettings).length,
      settingKeys: Object.keys(primarySettings),
    },
  };
}

// Parse and validate export file structure
export function validateExportFile(fileContent: string): SettingsExportFile {
  let parsed: any;
  try {
    parsed = JSON.parse(fileContent);
  } catch {
    throw new Error("Invalid file format - not valid JSON");
  }

  if (parsed.version !== "1.0") {
    throw new Error(`Unsupported file version: ${parsed.version}`);
  }

  if (!parsed.encryptedData || !parsed.salt || !parsed.iv) {
    throw new Error("Invalid export file - missing required fields");
  }

  return parsed as SettingsExportFile;
}

// Import settings from encrypted file
export async function importSettingsFromFile(
  exportFile: SettingsExportFile,
  password: string
): Promise<Record<string, string>> {
  const payload = await decryptSettings(
    exportFile.encryptedData,
    password,
    exportFile.salt,
    exportFile.iv
  );

  // Validate settings keys are in allowed list
  for (const key of Object.keys(payload.settings)) {
    if (!PRIMARY_KEYS.includes(key)) {
      console.warn(`Skipping unknown setting key: ${key}`);
      delete payload.settings[key];
    }
  }

  return payload.settings;
}

// Generate preview of what will be imported
export async function generateImportPreview(
  exportFile: SettingsExportFile,
  password: string,
  existingSettings: Record<string, string>
): Promise<ImportPreview> {
  const newSettings = await importSettingsFromFile(exportFile, password);

  const preview = Object.keys(newSettings).map((key) => ({
    key,
    action: existingSettings[key] ? ("overwrite" as const) : ("add" as const),
  }));

  return {
    settings: preview,
    timestamp: exportFile.exportedAt,
    totalCount: preview.length,
  };
}

// Generate filename with timestamp
export function generateExportFilename(): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `quiz0r-settings-${timestamp}.json`;
}

// Download file to browser
export function downloadFile(
  content: SettingsExportFile,
  filename: string
): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
