import { TokenEncryption } from './TokenEncryption';
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_SECRET || 'your-secret-key-2024';

export class SecureTokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static readonly USER_DATA_KEY = 'auth_user_data';

  /**
   * Encrypt any data (not just JWT tokens)
   */
  private static encryptData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Data encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt any data
   */
  private static decryptData(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt data');
      }
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Data decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store encrypted JWT access token in sessionStorage
   */
  static setAccessToken(token: string): void {
    try {
      // Validate it's a proper JWT before storing
      if (!TokenEncryption.isValidJWT(token)) {
        throw new Error('Invalid JWT access token provided');
      }

      const encryptedToken = TokenEncryption.encrypt(token);
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedToken);
      
      console.log('🔒 JWT access token encrypted and stored successfully');
    } catch (error) {
      console.error('Failed to store JWT access token:', error);
      throw error;
    }
  }

  /**
   * Get and decrypt JWT access token from sessionStorage
   */
  static getAccessToken(): string | null {
    try {
      const encryptedToken = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (!encryptedToken) return null;

      const decryptedToken = TokenEncryption.getDecryptedToken(encryptedToken);
      
      // Check if token is expired
      if (decryptedToken && TokenEncryption.isTokenExpired(decryptedToken)) {
        console.warn('⚠️ JWT access token is expired, removing from storage');
        this.removeAccessToken();
        return null;
      }

      return decryptedToken;
    } catch (error) {
      console.error('Failed to retrieve JWT access token:', error);
      // Clear corrupted token
      this.removeAccessToken();
      return null;
    }
  }

  /**
   * Store encrypted JWT refresh token in localStorage
   */
  static setRefreshToken(refreshToken: string): void {
    try {
      // Validate it's a proper JWT before storing
      if (!TokenEncryption.isValidJWT(refreshToken)) {
        throw new Error('Invalid JWT refresh token provided');
      }

      const encryptedToken = TokenEncryption.encrypt(refreshToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedToken);
      
      console.log('🔒 JWT refresh token encrypted and stored successfully');
    } catch (error) {
      console.error('Failed to store JWT refresh token:', error);
      throw error;
    }
  }

  /**
   * Get and decrypt refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    try {
      const encryptedToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!encryptedToken) return null;

      const decryptedToken = TokenEncryption.getDecryptedToken(encryptedToken);
      
      // Check if refresh token is expired
      if (decryptedToken && TokenEncryption.isTokenExpired(decryptedToken)) {
        console.warn('⚠️ JWT refresh token is expired, removing from storage');
        this.removeRefreshToken();
        return null;
      }

      return decryptedToken;
    } catch (error) {
      console.error('Failed to retrieve JWT refresh token:', error);
      // Clear corrupted token
      this.removeRefreshToken();
      return null;
    }
  }

  /**
   * Store encrypted user data in localStorage
   */
  static setUserData(userData: any): void {
    try {
      if (!userData) {
        throw new Error('No user data provided');
      }

      // Use general data encryption for user data (not JWT encryption)
      const encryptedUserData = this.encryptData(userData);
      localStorage.setItem(this.USER_DATA_KEY, encryptedUserData);
      
      console.log('🔒 User data encrypted and stored successfully');
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw error;
    }
  }

  /**
   * Get and decrypt user data from localStorage
   */
  static getUserData(): any {
    try {
      const encryptedUserData = localStorage.getItem(this.USER_DATA_KEY);
      if (!encryptedUserData) return null;

      const decryptedUserData = this.decryptData(encryptedUserData);
      return decryptedUserData;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      // Clear corrupted data
      this.removeUserData();
      return null;
    }
  }

  /**
   * Remove access token
   */
  static removeAccessToken(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    console.log('🗑️ Access token removed from storage');
  }

  /**
   * Remove refresh token
   */
  static removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    console.log('🗑️ Refresh token removed from storage');
  }

  /**
   * Remove user data
   */
  static removeUserData(): void {
    localStorage.removeItem(this.USER_DATA_KEY);
    console.log('🗑️ User data removed from storage');
  }

  /**
   * Remove all stored data
   */
  static clearAll(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUserData();
    console.log('🗑️ All encrypted data cleared from storage');
  }

  /**
   * Check if valid (non-expired) access token exists
   */
  static hasValidToken(): boolean {
    const token = this.getAccessToken();
    return !!token && !TokenEncryption.isTokenExpired(token);
  }

  /**
   * Get user info from stored token (if available) or stored user data
   */
  static getUserFromStoredToken(): any {
    // First try to get user from access token
    const token = this.getAccessToken();
    if (token) {
      const userFromToken = TokenEncryption.getUserFromToken(token);
      if (userFromToken) return userFromToken;
    }

    // Fallback to stored user data
    return this.getUserData();
  }

  /**
   * Get comprehensive token and user info
   */
  static getAuthInfo(): {
    hasValidToken: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    user: any;
    tokenInfo: any;
  } {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const userData = this.getUserData();
    
    return {
      hasValidToken: this.hasValidToken(),
      accessToken,
      refreshToken,
      user: userData,
      tokenInfo: accessToken ? TokenEncryption.validateDjangoJWT(accessToken) : null,
    };
  }

  /**
   * Auto-refresh token if it's about to expire (within 5 minutes)
   */
  static shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    return token ? TokenEncryption.shouldRefreshToken(token) : false;
  }

  /**
   * Alias for shouldRefreshToken() - for backward compatibility
   */
  static shouldRefreshAccessToken(): boolean {
    return this.shouldRefreshToken();
  }

  /**
   * Debug function to log all stored auth data
   */
  static debugAuthStorage(): void {
    console.group('🔍 Auth Storage Debug');
    
    const authInfo = this.getAuthInfo();
    console.log('Has Valid Token:', authInfo.hasValidToken);
    console.log('Access Token:', authInfo.accessToken ? '✅ Present' : '❌ Missing');
    console.log('Refresh Token:', authInfo.refreshToken ? '✅ Present' : '❌ Missing');
    console.log('User Data:', authInfo.user);
    console.log('Token Info:', authInfo.tokenInfo);
    
    if (authInfo.tokenInfo) {
      console.log('Token Expires At:', authInfo.tokenInfo.expiresAt);
      console.log('Token Type:', authInfo.tokenInfo.tokenType);
      console.log('Is Expired:', authInfo.tokenInfo.isExpired);
    }
    
    console.groupEnd();
  }
}