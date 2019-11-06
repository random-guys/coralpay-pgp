import GPG from 'gpg';
import { pack } from 'locutus/php/misc';
import {
  crc24,
  header,
  footer,
  wordwrap,
  defaultArguments,
  defaultOptions
} from './utils';
import { DecryptOptions, EncryptOptions } from './typings';

export default class KeyManager {
  private debug: boolean = false;
  private logger = console.log;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  private log = (...args) => {
    if (this.debug) this.logger('LOGGER ==> ', ...args);
  };

  /**
   * Used to import a key into the GPG keychain.
   *
   * @param key The GPG key to be imported
   * @param importOptions
   */
  importKey = async (key: string) => {
    return new Promise((resolve, reject) => {
      GPG.importKey(key, (importError, result, fingerprint) => {
        if (importError) {
          if (this.debug) this.log('Error occurred while importing key!\n');

          return reject(importError);
        }

        if (this.debug)
          this.log(
            `Succesfully imported the key!!! \nImported Key Data: \n${result}\n`
          );

        const keyId = fingerprint ? fingerprint : null;
        return resolve(keyId);
      });
    });
  };

  /**
   * This method is used to decrypt the response that is received from CoralPay's Cgate.
   *
   * @param {*} encryptedResponse - the encrypted response to decrypt
   * @param {*} keyIdForPrivateKey - the Long/Short ID for the imported public key
   * @param {*} passphrase - the passphrase associated with the Private key
   * @param {*} decryptOptions - options to control how the decryption process flows
   */
  decryptRequest = async (options: DecryptOptions): Promise<string> => {
    const argOptions = options.gpgDecryptOptions || defaultOptions;

    if (!options.keyIdForPrivateKey) {
      if (this.debug) this.log('Error: Key Not Found with Id');
      throw new Error('Error: Key Not Found with Id');
    }

    let optionArgs = [
      '--skip-verify',
      '--ignore-mdc-error',
      // '--options /dev/null', // ignore any saved options
      //'--pinentry-mode loopback', // Since 2.1.13 we can use "loopback mode" instead of gpg-agent
      '--default-key',
      options.keyIdForPrivateKey,
      '-u',
      options.keyIdForPrivateKey,
      '--trust-model',
      'always', // so we don't get "no assurance this key belongs to the given user"
      // 'echo your_password | gpg --batch --yes --passphrase-fd 0',
      '--batch', // '--quiet',
      '--yes',
      '--passphrase',
      options.passphrase
    ];

    if (argOptions.homedir) {
      optionArgs.push('--homedir');
      optionArgs.push(argOptions.homedir);
    }

    if (argOptions.format === 'armor') {
      optionArgs.push('--armor');
    }

    // Add the default options
    optionArgs.concat(defaultArguments);

    if (this.debug)
      this.log(`\nRunning GPG with options: \n${JSON.stringify(optionArgs)}`);

    const binaryEncryptedResponse = Buffer.from(
      options.encryptedResponse,
      'hex'
    ).toString('binary');

    const armoredBinMessage = this.enarmor(
      binaryEncryptedResponse,
      'PGP MESSAGE'
    );

    // swicth the context of `this`
    const keymanger = this;

    return new Promise((resolve, reject) => {
      GPG.decrypt(armoredBinMessage, optionArgs, function(
        error,
        decryptedBuffer
      ) {
        if (error) {
          if (keymanger.debug)
            keymanger.log(
              `Error occurred while decrypting response with GPG.\n${error}\n`
            );

          reject(error);
        }

        const outputString: string =
          argOptions.format === 'hex'
            ? decryptedBuffer.toString('hex')
            : decryptedBuffer.toString();

        if (keymanger.debug)
          keymanger.log(`Successfully Decrypted With GPG: \n${outputString}`);

        resolve(outputString);
      });
    });
  };

  /**
   * This method is used to encrypt the request to be sent to Cgate.
   *
   * @param plainMessage - the plain request to encrypt
   * @param keyIdForPublicKey - the Long/Short ID for the imported public key
   * @param encryptOptions - options to control how the output is generated
   */
  encryptRequest = async (options: EncryptOptions): Promise<string> => {
    const argOptions = options.encryptOptions || defaultOptions;

    if (!options.publicKey) {
      if (this.debug) this.log(`Error: Key Not Found with Id`);
      throw new Error(`Error: Key Not Found with Id`);
    }

    let optionArgs = [
      '--default-key',
      options.publicKey,
      '--recipient',
      options.publicKey,
      '--trust-model',
      'always' // so we don't get "no assurance this key belongs to the given user"
    ];

    if (argOptions.homedir) {
      optionArgs.push('--homedir');
      optionArgs.push(argOptions.homedir);
    }

    if (argOptions.format === 'armor') optionArgs.push('--armor');

    // Add the default options
    optionArgs.concat(defaultArguments);

    if (this.debug)
      this.log(`Calling GPG with options: \n${JSON.stringify(optionArgs)}\n`);

    // swicth the context of `this`
    const keymanger = this;

    return new Promise((resolve, reject) => {
      GPG.encrypt(options.message, optionArgs, function(
        error,
        encryptedBuffer
      ) {
        if (error) {
          if (keymanger.debug)
            keymanger.log(
              `Error occurred while encrypting request with GPG. Error: \n${error}\n`
            );

          reject(error);
        }
        const outputString: string =
          argOptions.format === 'hex'
            ? encryptedBuffer.toString('hex')
            : encryptedBuffer.toString();

        if (keymanger.debug) {
          keymanger.log(`Successfully Encrypted With GPG: \n${outputString}\n`);
        }

        resolve(outputString);
      });
    });
  };

  /** Ernamor's a PGP message
   * @see http://tools.ietf.org/html/rfc4880#section-6
   * @see http://tools.ietf.org/html/rfc4880#section-6.2
   * @see http://tools.ietf.org/html/rfc2045
   */
  enarmor = (data, marker = 'MESSAGE', headers = {}) => {
    let text = header(marker) + '\n';
    const headerKeys = Object.keys(headers);
    for (let i = 0; i < headerKeys.length; i += 1) {
      text += headerKeys[i] + ': ' + headers[headerKeys[i]] + '\n';
    }

    const base64Data = Buffer.from(data, 'binary').toString('base64');
    const packDataToUInt32BE = pack('N', crc24(data)); // pack line here
    const base64PackedData = Buffer.from(
      packDataToUInt32BE.substr(1),
      'binary'
    ).toString('base64');

    text += '\n' + wordwrap(base64Data, 76, '\n', true);
    text += '\n' + '=' + base64PackedData + '\n';
    text += footer(marker) + '\n';
    return text;
  };
}
