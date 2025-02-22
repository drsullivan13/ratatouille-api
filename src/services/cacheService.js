class CacheService {
    constructor() {
      this.cache = new Map()
      this.stats = {
        hits: 0,
        misses: 0,
        lastCleared: null
      }
      this.startCleanupInterval()
    }
  
    startCleanupInterval() {
      setInterval(() => {
        const now = Date.now()
        let cleaned = 0
        
        for (const [key, entry] of this.cache.entries()) {
          if (entry.expiresAt && entry.expiresAt < now) {
            this.cache.delete(key)
            cleaned++
          }
        }
        
        if (cleaned > 0) {
          this.stats.lastCleared = new Date().toISOString()
        }
      }, 1000 * 60 * 60) // Clean every hour
    }
  
    async get(key) {
      const entry = this.cache.get(key)
      
      if (!entry) {
        this.stats.misses++
        return null
      }
  
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(key)
        this.stats.misses++
        return null
      }
  
      this.stats.hits++
      return entry.value
    }
  
    async set(key, value, ttl = 3600) {
      const expiresAt = ttl ? Date.now() + (ttl * 1000) : null
      this.cache.set(key, { value, expiresAt })
      return true
    }
  
    getStats() {
      return {
        ...this.stats,
        size: this.cache.size,
        hitRate: `${((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)}%`
      }
    }
  }
  
  export const cacheService = new CacheService()