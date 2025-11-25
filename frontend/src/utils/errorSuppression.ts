/**
 * Utility to suppress known Firebase console errors that are expected
 * and don't affect functionality (e.g., COOP errors, ad blocker blocks)
 * 
 * Note: ERR_BLOCKED_BY_CLIENT errors in the browser console are caused by
 * ad blockers or security extensions blocking Firestore requests. These errors
 * are non-critical - the app will continue to work using backend API instead.
 * These errors cannot be completely suppressed as they appear in browser DevTools,
 * but they don't affect the application functionality.
 */

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Expose original methods for debugging (to avoid suppression)
(console as any).__originalError = originalError;
(console as any).__originalWarn = originalWarn;

// Patterns to suppress
const SUPPRESSED_ERROR_PATTERNS = [
  /Cross-Origin-Opener-Policy.*would block.*window\.(closed|close)/i,
  /ERR_BLOCKED_BY_CLIENT/i,
  /BLOCKED_BY_CLIENT/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
  /net::ERR_CONNECTION_CLOSED/i,
  /ERR_CONNECTION_CLOSED/i,
  /Failed to load resource.*apis\.google\.com/i,
  /Failed to load resource.*firestore\.googleapis\.com/i,
  /firestore\.googleapis\.com.*ERR_BLOCKED_BY_CLIENT/i,
  /apis\.google\.com.*ERR_CONNECTION_CLOSED/i,
  /apis\.google\.com.*Failed to load resource/i,
  /firestore\.googleapis\.com.*Write\/channel.*ERR_BLOCKED_BY_CLIENT/i,
  /firestore\.googleapis\.com.*Write\/channel.*TYPE=terminate/i,
  /firebase_auth\.js.*Cross-Origin-Opener-Policy/i,
  /firebase_firestore\.js.*ERR_BLOCKED_BY_CLIENT/i,
  /Failed to load resource.*net::ERR_BLOCKED_BY_CLIENT/i,
  /google\.firestore\.v1\.Firestore.*ERR_BLOCKED_BY_CLIENT/i,
  /gsessionid.*ERR_BLOCKED_BY_CLIENT/i,
];

// Patterns to suppress warnings
const SUPPRESSED_WARN_PATTERNS = [
  /Firestore connection blocked.*ad blocker/i,
  /Firestore.*blocked.*non-critical/i,
];

/**
 * Check if an error message should be suppressed
 */
export const shouldSuppressError = (message: string): boolean => {
  return SUPPRESSED_ERROR_PATTERNS.some(pattern => pattern.test(message));
};

/**
 * Check if a warning message should be suppressed
 */
export const shouldSuppressWarning = (message: string): boolean => {
  return SUPPRESSED_WARN_PATTERNS.some(pattern => pattern.test(message));
};

/**
 * Initialize error suppression for known Firebase issues
 * This should be called early in the app lifecycle
 */
export const initErrorSuppression = () => {
  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (shouldSuppressError(message)) {
      // Suppress known errors silently
      return;
    }
    // Call original for other errors
    originalError.apply(console, args);
  };

  // Override console.warn for known warnings
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (shouldSuppressWarning(message)) {
      // Suppress known warnings silently
      return;
    }
    // Call original for other warnings
    originalWarn.apply(console, args);
  };

  // Add global error handler for unhandled errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.filename || event.target?.toString() || '';
    const errorSource = (event.target as HTMLElement)?.src || (event.target as HTMLElement)?.href || '';
    const fullMessage = `${errorMessage} ${errorSource}`;
    
    if (shouldSuppressError(fullMessage) || shouldSuppressError(errorMessage) || shouldSuppressError(errorSource)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Suppress network errors from Performance API
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name && shouldSuppressError(entry.name)) {
            // Suppress this entry silently
            return;
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // PerformanceObserver might not be available or supported
    }
  }

  // Add global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    if (shouldSuppressError(errorMessage)) {
      event.preventDefault();
      return false;
    }
  });
};

/**
 * Check if COOP (Cross-Origin-Opener-Policy) is likely blocking popups
 * This can be detected by checking if we're in a cross-origin context
 */
export const isCOOPBlockingPopups = (): boolean => {
  try {
    // Check if we can access opener (indicates COOP might be blocking)
    if (window.opener && window.opener !== window) {
      try {
        // Try to access a property - if COOP is blocking, this might fail
        const test = window.opener.location;
        return false;
      } catch (e) {
        // If we can't access opener location, COOP is likely blocking
        return true;
      }
    }
    return false;
  } catch (e) {
    // If any error occurs, assume COOP might be an issue
    return true;
  }
};

/**
 * Check if ad blocker is likely active (by checking for blocked requests)
 */
export const isAdBlockerActive = (): boolean => {
  // This is a heuristic - we can't definitively detect ad blockers
  // but we can check if certain patterns suggest it
  return false; // Return false by default, let error handling deal with it
};

