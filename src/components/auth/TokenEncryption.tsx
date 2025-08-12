import CryptoJS from 'crypto-js';

// Secret key for encryption (in production, use environment variable)
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_SECRET || 'your-secret-key-2024';

export class TokenEncryption {
  /**
   * Encrypt a JWT token for secure storage
   */
  static encrypt(token: string): string {
    try {
      // Validate it's a JWT before encrypting
      if (!this.isValidJWT(token)) {
        throw new Error('Invalid JWT token format');
      }

      const encrypted = CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
      // console.log('🔒 JWT token encrypted successfully');
      return encrypted;
    } catch (error) {
      console.error('JWT encryption failed:', error);
      throw new Error('JWT token encryption failed');
    }
  }

  /**
   * Decrypt a JWT token from storage
   */
  static decrypt(encryptedToken: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt token - invalid data');
      }

      // Validate decrypted token is a valid JWT
      if (!this.isValidJWT(decrypted)) {
        throw new Error('Decrypted data is not a valid JWT token');
      }
      
      // console.log('🔓 JWT token decrypted successfully');
      return decrypted;
    } catch (error) {
      console.error('JWT decryption failed:', error);
      throw new Error('JWT token decryption failed');
    }
  }

  /**
   * Check if a string is a valid JWT token (matches Django Simple JWT format)
   */
  static isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    // JWT tokens have exactly 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      // Validate header
      const header = JSON.parse(atob(parts[0]));
      if (!header.typ || !header.alg) return false;
      
      // Validate payload structure (should have standard JWT claims)
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp || !payload.iat) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if token is encrypted (not a plain JWT)
   */
  static isEncrypted(token: string): boolean {
    if (!token) return false;
    
    // If it's a valid JWT, it's not encrypted
    if (this.isValidJWT(token)) {
      return false;
    }
    
    // Try to decrypt and check if result is a valid JWT
    try {
      const decrypted = this.decrypt(token);
      return this.isValidJWT(decrypted);
    } catch {
      return false;
    }
  }

  /**
   * Safely get JWT token (decrypt if needed)
   */
  static getDecryptedToken(token: string | null): string | null {
    if (!token) return null;
    
    try {
      // If it's already a valid JWT, return as is
      if (this.isValidJWT(token)) {
        return token;
      }
      
      // Try to decrypt
      const decrypted = this.decrypt(token);
      return this.isValidJWT(decrypted) ? decrypted : null;
      
    } catch (error) {
      console.error('Failed to get decrypted JWT token:', error);
      return null;
    }
  }

  /**
   * Decode JWT payload without verification (for reading user data)
   */
  static decodeJWTPayload(token: string | null): any {
    try {
      const decryptedToken = this.getDecryptedToken(token);
      if (!decryptedToken) return null;
      
      const parts = decryptedToken.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode JWT payload:', error);
      return null;
    }
  }

  /**
   * Check if JWT token is expired
   */
  static isTokenExpired(token: string | null): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      if (!payload || !payload.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        console.warn('⚠️ JWT token is expired');
      }
      
      return isExpired;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string | null): Date | null {
    try {
      const payload = this.decodeJWTPayload(token);
      if (!payload || !payload.exp) return null;
      
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Get user info from JWT token (Django Simple JWT format)
   */
  static getUserFromToken(token: string | null): any {
    try {
      const payload = this.decodeJWTPayload(token);
      if (!payload) return null;
      
      // Django Simple JWT typical payload structure
      return {
        id: payload.user_id,
        email: payload.email,
        name: payload.name,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti, // JWT ID
        token_type: payload.token_type, // 'access' or 'refresh'
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if token should be refreshed (within 5 minutes of expiry)
   */
  static shouldRefreshToken(token: string | null): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      if (!payload || !payload.exp) return false;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh if token expires within 5 minutes (300 seconds)
      return timeUntilExpiry < 300 && timeUntilExpiry > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get token type (access or refresh)
   */
  static getTokenType(token: string | null): 'access' | 'refresh' | null {
    try {
      const payload = this.decodeJWTPayload(token);
      return payload?.token_type || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate token against Django backend structure
   */
  static validateDjangoJWT(token: string | null): {
    isValid: boolean;
    isExpired: boolean;
    tokenType: 'access' | 'refresh' | null;
    user: any;
    expiresAt: Date | null;
  } {
    const decryptedToken = this.getDecryptedToken(token);
    
    return {
      isValid: !!decryptedToken && this.isValidJWT(decryptedToken),
      isExpired: this.isTokenExpired(token),
      tokenType: this.getTokenType(token),
      user: this.getUserFromToken(token),
      expiresAt: this.getTokenExpiration(token),
    };
  }
}