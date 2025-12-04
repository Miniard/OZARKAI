/**
 * Rate limiting pour protéger les API
 * Implémentation simple en mémoire (pour production, utiliser Redis)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store en mémoire (⚠️ ne persiste pas entre redémarrages)
const store = new Map<string, RateLimitEntry>();

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 min par défaut

/**
 * Vérifie si une requête est autorisée selon le rate limit
 * @param identifier - Identifiant unique (IP, user ID, etc.)
 * @param maxRequests - Nombre max de requêtes (optionnel)
 * @param windowMs - Fenêtre de temps en ms (optionnel)
 * @returns true si la requête est autorisée
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  // Première requête ou fenêtre expirée
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  // Fenêtre en cours
  if (entry.count < maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Limite atteinte
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
  };
}

/**
 * Réinitialise le compteur pour un identifiant
 * @param identifier - Identifiant unique
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Nettoie les entrées expirées (à appeler périodiquement)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Middleware Next.js pour rate limiting
 * @param identifier - Identifiant (ex: IP address)
 * @returns Response si bloqué, null sinon
 */
export function rateLimitMiddleware(identifier: string): Response | null {
  const result = checkRateLimit(identifier);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes',
        message: 'Vous avez atteint la limite de requêtes. Veuillez réessayer plus tard.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toString(),
        },
      }
    );
  }
  
  return null;
}

// Nettoyer les entrées expirées toutes les 10 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 10 * 60 * 1000);
}

