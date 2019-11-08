import { join } from 'path';
import uuid from 'uuid/v4';
import { Pgp } from '..';
import { config } from 'dotenv';
import { openSync, writeFileSync, closeSync } from 'fs';

const run = async () => {
  config();

  try {
    // create key files
    const public_key_file_path = join(__dirname, './public_key.txt');
    const private_key_file_path = join(__dirname, './private_key.txt');
    closeSync(openSync(public_key_file_path, 'w'));
    closeSync(openSync(private_key_file_path, 'w'));

    // load content from env var
    const passphrase = process.env.PASSPHRASE;
    const publicKeyBuffer = Buffer.from(process.env.PUBLIC_KEY, 'base64');
    const privateKeyBuffer = Buffer.from(process.env.PRIVATE_KEY, 'base64');

    const publicKeyPath = join(__dirname, './public_key.txt');
    const privateKeyPath = join(__dirname, './private_key.txt');

    writeFileSync(publicKeyPath, publicKeyBuffer.toString('ascii'));
    writeFileSync(privateKeyPath, privateKeyBuffer.toString('ascii'));

    const pgp = new Pgp({
      privateKeyPath,
      publicKeyPath,
      passphrase
    });

    const payload = {
      sessionId: uuid(),
      destinationInstitutionId: '000586',
      accountId: '08124319064'
    };

    const encrypted = await pgp.encryptRequest(payload);
    const decrypted = await pgp.decryptResponse(encrypted);
    console.log({ encrypted, decrypted });
  } catch (error) {
    console.log(error);
  }
};

run();
