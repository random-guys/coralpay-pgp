import { join } from 'path';
import uuid from 'uuid/v4';
import { Pgp } from '..';

const run = async () => {
  try {
    const passphrase = '5wanp6eegH';
    const publicKeyPath = join(__dirname, './keys/public_key.txt');
    const privateKeyPath = join(__dirname, './keys/private_key.txt');

    const pgp = new Pgp({
      privateKeyPath,
      publicKeyPath,
      passphrase,
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
