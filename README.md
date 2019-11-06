# CoralPay PGP 🔐

CoralPay Encryption and Decryption Lib based on [oseme-techguy's js lib](https://github.com/oseme-techguy/coralpay-c-connect-node-sdk) and relies heavily on a [wrapper](https://github.com/drudge/node-gpg) around the GPG cli tool.

# Installation

```sh
yarn add @random-guys/coralpay-pgp
```

or

```sh
npm install @random-guys/coralpay-pgp
```

## Usage

```ts
import { Pgp } from '@random-guys/coralpay-pgp';

try {
  const publicKeyPath = join(__dirname, './keys/public_key.txt');
  const privateKeyPath = join(__dirname, './keys/private_key.txt');
  const passphrase = 'c-ronaldo';

  const pgp = new Pgp({
    privateKeyPath,
    publicKeyPath,
    passphrase
  });

  const payload = {
    accountNumber: '00000111111'
    name: 'Raymond',
    age: '20',
  };

  const encrypted = await utilities.encryptRequest(payload);
  const decrypted = await pgp.decryptResponse(encrypted);
  console.log({ encrypted, decrypted });
} catch (error) {
  console.log(error);
}
```

## Usage with Docker

### Prerequisites

1. Modify `run.sh` to change the paths to your keys. This imports the keys into your gpg keychain in the container.

2. Create a passphrase (called my `passphrase.txt`) file. Practically this may be an envionment variable on your CI that's written to the file, knock yourself out.
