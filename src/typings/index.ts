export interface GpgOptions {
  homedir?: string;
  armor?: boolean;
  format: 'binary' | 'hex' | 'armor';
}

export interface DecryptOptions {
  encryptedResponse: string;
  keyIdForPrivateKey?: string;
  passphrase?: string;
  gpgDecryptOptions?: GpgOptions;
}

export interface EncryptOptions {
  message: string;
  publicKey: string;
  encryptOptions: GpgOptions;
}

export interface ImportKeysOptions {
  keyContentToImport?: string;
}

export interface PgpConfig {
  debug?: boolean;
  passphrase: string;
  publicKeyPath: string;
  privateKeyPath: string;
}

export interface KeyStoreOptions {
  encryptionKey: any;
  decryptionKey: any;
  decryptionKeyPublic?: any;
}
