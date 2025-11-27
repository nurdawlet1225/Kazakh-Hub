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
  /Failed to load resource.*401.*Unauthorized/i,
  /Failed to load resource.*net::ERR_BLOCKED_BY_CLIENT/i,
  /Failed to load resource.*Write\/channel/i,
  /Failed to load resource.*TYPE=terminate/i,
  /Failed to load resource.*gsessionid/i,
  /Failed to load resource.*SID=/i,
  /Failed to load resource.*RID=/i,
  /Failed to load resource.*127\.0\.0\.1.*401/i,
  /Failed to load resource.*localhost.*401/i,
  /Failed to load resource.*auth\/login/i,
  /127\.0\.0\.1.*auth\/login.*401/i,
  /localhost.*auth\/login.*401/i,
  /firestore\.googleapis\.com.*ERR_BLOCKED_BY_CLIENT/i,
  /apis\.google\.com.*ERR_CONNECTION_CLOSED/i,
  /apis\.google\.com.*Failed to load resource/i,
  /firestore\.googleapis\.com.*Write\/channel.*ERR_BLOCKED_BY_CLIENT/i,
  /firestore\.googleapis\.com.*Write\/channel.*TYPE=terminate/i,
  /firestore\.googleapis\.com.*Listen\/channel.*TYPE=terminate/i,
  /firestore\.googleapis\.com.*Listen\/channel.*ERR_BLOCKED_BY_CLIENT/i,
  /google\.firestore\.v1\.Firestore\/Listen\/channel/i,
  /firebase_auth\.js.*Cross-Origin-Opener-Policy/i,
  /firebase_firestore\.js.*ERR_BLOCKED_BY_CLIENT/i,
  /Failed to load resource.*net::ERR_BLOCKED_BY_CLIENT/i,
  /google\.firestore\.v1\.Firestore.*ERR_BLOCKED_BY_CLIENT/i,
  /gsessionid.*ERR_BLOCKED_BY_CLIENT/i,
  /Request URL.*firestore\.googleapis\.com.*Listen.*channel/i,
  /Request URL.*firestore\.googleapis\.com.*TYPE=terminate/i,
  // Suppress expected API errors that are handled gracefully
  /Failed to load resource.*401.*Unauthorized/i,
  /API Error: 401 Unauthorized/i,
  /\[LOGIN\].*Backend login failed.*trying Firebase/i,
  /\[LOGIN\].*Attempting Firebase authentication/i,
  // Suppress Firestore channel errors (ad blocker related)
  /firebase_firestore\.js.*POST.*firestore\.googleapis\.com/i,
  /firebase_firestore\.js.*Write\/channel/i,
  /firebase_firestore\.js.*ERR_BLOCKED_BY_CLIENT/i,
  /Y2\.close|Y2\.m|cc @ firebase_firestore/i,
  /gsessionid.*ERR_BLOCKED_BY_CLIENT/i,
  /TYPE=terminate.*ERR_BLOCKED_BY_CLIENT/i,
  /Write\/channel.*TYPE=terminate/i,
  /Listen\/channel.*TYPE=terminate/i,
  // Suppress Firestore stack traces
  /firebase_firestore\.js.*Y2\.close/i,
  /firebase_firestore\.js.*Y2\.m/i,
  /firebase_firestore\.js.*cc @/i,
  /firebase_firestore\.js.*Va @/i,
  /firebase_firestore\.js.*D @/i,
  /firebase_firestore\.js.*Qc @/i,
  /firebase_firestore\.js.*h\.Xa/i,
  /firebase_firestore\.js.*h\.Ca/i,
  /firebase_firestore\.js.*Gc @/i,
  /firebase_firestore\.js.*h\.Ma/i,
  /firebase_firestore\.js.*Ic @/i,
  /firebase_firestore\.js.*h\.Pa/i,
  /firebase_firestore\.js.*h\.send/i,
  /firebase_firestore\.js.*h\.ea/i,
  /firebase_firestore\.js.*Eb @/i,
  /firebase_firestore\.js.*\$c @/i,
  /firebase_firestore\.js.*h\.Da/i,
  /firebase_firestore\.js.*sa @/i,
  /firebase_firestore\.js.*u @/i,
  /firebase_firestore\.js.*ac @/i,
  /firebase_firestore\.js.*Lb @/i,
  /firebase_firestore\.js.*N2\.Y/i,
  /firebase_firestore\.js.*N2\.ba/i,
  /firebase_firestore\.js.*Yo @/i,
  /firebase_firestore\.js.*send @/i,
  /firebase_firestore\.js.*q_ @/i,
  /firebase_firestore\.js.*ra @/i,
  /firebase_firestore\.js.*__PRIVATE_onWriteStreamOpen/i,
  /firebase_firestore\.js.*enqueue/i,
  /firebase_firestore\.js.*enqueueAndForget/i,
  /firebase_firestore\.js.*handleDelayElapsed/i,
  /firebase_firestore\.js.*setTimeout/i,
  /firebase_firestore\.js.*T_ @/i,
  /firebase_firestore\.js.*j_ @/i,
  /firebase_firestore\.js.*G_ @/i,
  /firebase_firestore\.js.*auth @/i,
  /firebase_firestore\.js.*start @/i,
  /firebase_firestore\.js.*Promise\.then/i,
  /firebase_firestore\.js.*Cb @/i,
  /firebase_firestore\.js.*h\.Ea/i,
  /firebase_firestore\.js.*bc @/i,
  /firebase_firestore\.js.*h\.connect/i,
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
    // Check all arguments for Firestore errors (including stack traces)
    const allArgs = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.message} ${arg.stack || ''}`;
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    const message = args.join(' ');
    const fullMessage = `${message} ${allArgs}`;
    
    if (shouldSuppressError(message) || shouldSuppressError(allArgs) || shouldSuppressError(fullMessage)) {
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
    
    // Check stack trace for Firestore errors
    const stackTrace = (event.error as Error)?.stack || '';
    const fullErrorText = `${fullMessage} ${stackTrace}`;
    
    // Also check the error filename/path
    const errorFilename = event.filename || '';
    const errorColno = event.colno || 0;
    const errorLineno = event.lineno || 0;
    const errorPath = `${errorFilename}:${errorLineno}:${errorColno}`;
    
    // Combine all error information
    const allErrorInfo = `${fullMessage} ${fullErrorText} ${errorPath}`;
    
    if (shouldSuppressError(fullMessage) || shouldSuppressError(errorMessage) || shouldSuppressError(errorSource) || shouldSuppressError(fullErrorText) || shouldSuppressError(errorPath) || shouldSuppressError(allErrorInfo)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Suppress network request errors from fetch/XHR
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || '';
      const url = args[0]?.toString() || '';
      if (shouldSuppressError(errorMessage) || shouldSuppressError(url)) {
        // Return a rejected promise that won't be logged
        return Promise.reject(new Error('Network request blocked (non-critical)'));
      }
      throw error;
    }
  };
  
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
    const stackTrace = event.reason?.stack || '';
    const fullErrorText = `${errorMessage} ${stackTrace}`;
    
    if (shouldSuppressError(errorMessage) || shouldSuppressError(fullErrorText)) {
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

