import { readFile } from 'fs';
import openpgp, { config, key, message } from 'openpgp';
import Keymanager from './key_manager';
import { KeyStoreOptions, PgpConfig } from './typings';
import { defaultKeyStoreOptions } from './utils';

config.ignore_mdc_error = true;
config.use_native = true;

/**
 * Performs three main tasks
 * 1. Loads the keys into the Keychain
 * 2. Encrypts the request payload
 * 3. Decrypts the response payload
 */
export default class Pgp {
  private debug: boolean = false;
  private keysLoaded: boolean = false;
  private keyStore: KeyStoreOptions;
  private config: PgpConfig;
  private logger = console.log;
  private keyManager: Keymanager;

  constructor(config: PgpConfig) {
    this.keyManager = new Keymanager(config.debug);
    this.keyStore = defaultKeyStoreOptions;
    this.debug = config.debug;
    this.config = config;
  }

  /**
   * Loads a key from a file and writes out the contents
   * @param pathLike The absolute path to the key
   */
  private loadKeyFromPath(pathLike: string): Promise<string> {
    return new Promise((resolve, reject) => {
      readFile(pathLike, { encoding: 'utf8' }, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }

  /**
   * Load the keys into the KeyChain
   */
  async loadKeys() {
    if (this.keysLoaded) return;

    const loadedKey = await this.loadKeyFromPath(
      this.config.publicEncryptionKeyPath
    );
    this.keyStore.encryptionKey = await this.keyManager.importKey(loadedKey);

    const privateKey_Armored = await this.loadKeyFromPath(
      this.config.privateKeyPath
    );

    const privateKey = await key.readArmored(privateKey_Armored);

    this.keyStore.decryptionKey = privateKey.keys[0];

    await this.keyStore.decryptionKey.decrypt(this.config.passphrase);
    this.keysLoaded = true;
    this.log(
      '\nThe keys were successfully imported into your GPG keychain!!!\n'
    );
  }

  /**
   * Decrypts the response body from CGate
   * @param body the reponse from CGate
   */
  async decryptResponse(body: string): Promise<any> {
    try {
      await this.loadKeys();

      if (!body || body === '') return body;

      const binaryEncryptedResponse = Buffer.from(body, 'hex').toString(
        'binary'
      );
      const armored = this.keyManager.enarmor(
        binaryEncryptedResponse,
        'PGP MESSAGE'
      );

      const msgObj = await message.readArmored(armored);
      const decrypted = await openpgp.decrypt({
        message: msgObj,
        privateKeys: this.keyStore.decryptionKey
      });

      return JSON.parse(decrypted.data);
    } catch (error) {
      this.log(error);
      this.log('Response is not a valid JSON');
      throw new Error(error);
    }
  }

  async encryptRequest(payload: any): Promise<string> {
    await this.loadKeys();

    return await this.keyManager.encryptRequest({
      message: JSON.stringify(payload),
      encryptOptions: { format: 'hex' },
      publicKey: this.keyStore.encryptionKey
    });
  }

  private log = (...args) => {
    if (this.debug) this.logger(...args);
  };
}
