import { GpgOptions, ImportKeysOptions, KeyStoreOptions } from '../typings';

/**
 * GPG status output file descriptor. The status file descriptor outputs
 * detailed information for many GPG commands. See the second section of
 * the file <b>doc/DETAILS</b> in the
 * {@link http://www.gnupg.org/download/ GPG package} for a detailed
 * description of GPG's status output.
 */
export const FD_STATUS = 3;

/**
 * Command input file descriptor. This is used for methods requiring
 * passphrases.
 */
export const FD_COMMAND = 4;

export const defaultArguments = [
  '--status-fd ' + FD_STATUS,
  '--command-fd ' + FD_COMMAND,
  '--exit-on-status-write-error',
  '--no-permission-warning',
  '--no-secmem-warning',
  '--no-tty',
  '--no-default-keyring', // ignored if keying files are not specified
  '--no-options' // prevent creation of ~/.gnupg directory
];

/**
 * Default GPG Decrypt Options
 */
export const defaultOptions: GpgOptions = {
  homedir: null,
  armor: true,
  format: 'binary'
};

export const defaultKeyStoreOptions: KeyStoreOptions = {
  decryptionKey: '',
  encryptionKey: ''
};

/** This is used to calculate Cyclic Redundancy Checksum on a string
 *
 * @see http://tools.ietf.org/html/rfc4880#section-6
 * @see http://tools.ietf.org/html/rfc4880#section-6.1
 */
export const crc24 = data => {
  let crc = 0x00b704ce;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= (ord(data[i]) & 255) << 16;
    for (let j = 0; j < 8; j += 1) {
      crc <<= 1;
      if (crc & 0x01000000) {
        crc ^= 0x01864cfb;
      }
    }
  }
  return crc & 0x00ffffff;
};

const ord = str => str.charCodeAt(0);

/**
 * @see http://tools.ietf.org/html/rfc4880#section-6.2
 */
export const header = marker => '-----BEGIN ' + marker.toUpperCase() + '-----';

/**
 * @see http://tools.ietf.org/html/rfc4880#section-6.2
 */
export const footer = marker => '-----END ' + marker.toUpperCase() + '-----';

/**
 * Method to perform word wrap operation on a string
 *
 * @param {*} word
 * @param {*} width
 * @param {*} breakChar
 * @param {*} shouldCut
 */
export const wordwrap = (
  word: string,
  width?: number,
  breakChar?: string,
  shouldCut?: boolean
) => {
  breakChar = breakChar || 'n';
  width = width || 76;
  shouldCut = shouldCut || false;

  if (!word) return word;

  const wordLength = word.length;
  let startIndex = 0;
  let wrappedWordLines = [];
  while (startIndex < wordLength) {
    const acceptableWidth =
      startIndex + width > wordLength ? wordLength - startIndex : width;
    wrappedWordLines.push(word.substr(startIndex, acceptableWidth));
    startIndex += width;
  }
  return wrappedWordLines.join(breakChar);
};

/**
 * Utility function to convert Uint8 array to a binary string.
 *
 * @param {*} u8Array
 */
const convertUint8ArrayToBinaryString = (u8Array: Uint8Array) => {
  let len = u8Array.length,
    binaryString = '';
  for (let i = 0; i < len; i++) binaryString += String.fromCharCode(u8Array[i]);
  return binaryString;
};

/**
 * Utility function to convert from a binary string to an Uint8 array.
 *
 * @param {*} binaryString
 */
const convertBinaryStringToUint8Array = (binaryString: string) => {
  let len = binaryString.length,
    u8_array = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8_array[i] = binaryString.charCodeAt(i);
  return u8_array;
};
