import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class EncryptionService {
  private static key: Buffer;

  static initialize(secretKey?: string): void {
    const key = secretKey || process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Encryption key not provided');
    }
    
    // Derive key from secret
    this.key = crypto.scryptSync(key, 'salt', KEY_LENGTH);
  }

  static encrypt(text: string): string {
    if (!this.key) {
      this.initialize();
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, this.key);
    cipher.setAAD(Buffer.from('performile-auth'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv, tag, and encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData: string): string {
    if (!this.key) {
      this.initialize();
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const ivPart = parts[0];
    const tagPart = parts[1];
    const encryptedPart = parts[2];

    if (!ivPart || !tagPart || !encryptedPart) {
      throw new Error('Invalid encrypted data parts');
    }

    const iv = Buffer.from(ivPart, 'hex');
    const tag = Buffer.from(tagPart, 'hex');

    const decipher = crypto.createDecipher(ALGORITHM, this.key);
    decipher.setAAD(Buffer.from('performile-auth'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedPart, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return actualSalt + ':' + hash.toString('hex');
  }

  static verifyHash(data: string, hashedData: string): boolean {
    const parts = hashedData.split(':');
    if (parts.length !== 2) return false;

    const salt = parts[0];
    const hash = parts[1];
    
    if (!salt || !hash) return false;
    
    const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    
    return hash === newHash.toString('hex');
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
