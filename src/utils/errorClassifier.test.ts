import { describe, it, expect } from 'vitest';
import { isAuthError, isNetworkError } from './errorClassifier';

describe('errorClassifier', () => {
  describe('isAuthError', () => {
    it('identifies status 401 as auth error', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
      expect(isAuthError({ result: { error: { code: 401 } } })).toBe(true);
      expect(isAuthError({ statusText: 'UNAUTHENTICATED' })).toBe(true);
    });

    it('identifies 403 insufficient scopes as auth error', () => {
      expect(isAuthError({ status: 403, message: 'Request had insufficient authentication scopes.' })).toBe(true);
      expect(isAuthError({ status: 403, message: 'Invalid credentials or token expired.' })).toBe(true);
    });

    it('does NOT classify file permission denied (share error) as auth token error', () => {
      expect(isAuthError({ status: 403, message: 'The caller does not have permission' })).toBe(false);
      expect(isAuthError({ message: 'User does not have permission to view this sheet' })).toBe(false);
    });

    it('identifies token expired and credentials missing messages as auth error', () => {
      expect(isAuthError({ message: 'API credentials missing in .env' })).toBe(true);
      expect(isAuthError({ message: 'Access token has expired' })).toBe(true);
      expect(isAuthError(new Error('Invalid OAuth 2 access token'))).toBe(true);
    });

    it('returns false for non-auth errors', () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError(new Error('SyntaxError'))).toBe(false);
      expect(isAuthError({ status: 500, message: 'Internal Server Error' })).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('identifies network TypeError', () => {
      expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new TypeError('NetworkError when attempting to fetch resource.'))).toBe(true);
    });

    it('identifies error without status code as potential network error', () => {
      expect(isNetworkError({})).toBe(true);
    });

    it('returns false when status code exists and isOnline is true', () => {
      expect(isNetworkError({ status: 404 })).toBe(false);
      expect(isNetworkError({ status: 500 })).toBe(false);
    });
  });
});
