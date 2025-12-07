export interface SettingsExportFile {
  version: "1.0";
  exportedAt: string;
  encryptedData: string;
  salt: string;
  iv: string;
  metadata: {
    settingsCount: number;
    settingKeys: string[];
  };
}

export interface EncryptedPayload {
  settings: Record<string, string>;
  exportedBy: "Quiz0r Settings";
  timestamp: string;
  checksum: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // weak, fair, good, strong, very strong
  feedback: string[];
  isValid: boolean;
}

export interface ImportPreview {
  settings: Array<{
    key: string;
    action: "add" | "overwrite";
  }>;
  timestamp: string;
  totalCount: number;
}
