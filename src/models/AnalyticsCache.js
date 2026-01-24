const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  cacheType: {
    type: String,
    required: true,
    default: 'general',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  metadata: {
    hitCount: {
      type: Number,
      default: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    size: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Get cache by key
analyticsCacheSchema.statics.getByKey = async function(cacheKey) {
  try {
    const cache = await this.findOne({
      cacheKey,
      expiresAt: { $gt: new Date() }
    });
    
    if (!cache) {
      return null;
    }
    
    // Update metadata
    cache.metadata.hitCount += 1;
    cache.metadata.lastAccessed = new Date();
    await cache.save({ validateBeforeSave: false });
    
    return cache;
  } catch (error) {
    console.error('Error getting cache by key:', error);
    return null;
  }
};

// Set cache with data
analyticsCacheSchema.statics.setCache = async function(cacheKey, data, options = {}) {
  try {
    const { cacheType = 'general', ttl = 300 } = options;
    
    const expiresAt = new Date(Date.now() + ttl * 1000);
    
    // Calculate approximate size
    const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    
    const cacheData = {
      cacheKey,
      data,
      cacheType,
      expiresAt,
      metadata: {
        hitCount: 0,
        lastAccessed: new Date(),
        size: dataSize
      }
    };
    
    await this.findOneAndUpdate(
      { cacheKey },
      cacheData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
};

// Invalidate cache by type
analyticsCacheSchema.statics.invalidateByType = async function(cacheType) {
  try {
    const result = await this.deleteMany({ cacheType });
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error invalidating cache by type:', error);
    return { success: false, error: error.message };
  }
};

// Clean expired cache entries
analyticsCacheSchema.statics.cleanExpired = async function() {
  try {
    const result = await this.deleteMany({ expiresAt: { $lt: new Date() } });
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
    return { success: false, error: error.message };
  }
};

// Get cache statistics
analyticsCacheSchema.statics.getCacheStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$cacheType',
          count: { $sum: 1 },
          totalSize: { $sum: '$metadata.size' },
          avgHitCount: { $avg: '$metadata.hitCount' },
          totalHitCount: { $sum: '$metadata.hitCount' }
        }
      },
      {
        $project: {
          cacheType: '$_id',
          count: 1,
          totalSize: 1,
          avgHitCount: { $round: ['$avgHitCount', 2] },
          totalHitCount: 1,
          _id: 0
        }
      }
    ]);
    
    const totalStats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalSize: { $sum: '$metadata.size' },
          expiredEntries: {
            $sum: {
              $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    return {
      success: true,
      byType: stats,
      overall: totalStats[0] || {
        totalEntries: 0,
        totalSize: 0,
        expiredEntries: 0
      }
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { success: false, error: error.message };
  }
};

// Invalidate all cache
analyticsCacheSchema.statics.invalidateAll = async function() {
  try {
    const result = await this.deleteMany({});
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error invalidating all cache:', error);
    return { success: false, error: error.message };
  }
};

// Update cache TTL
analyticsCacheSchema.statics.updateTTL = async function(cacheKey, newTTL) {
  try {
    const cache = await this.findOne({ cacheKey });
    
    if (!cache) {
      return { success: false, message: 'Cache not found' };
    }
    
    cache.expiresAt = new Date(Date.now() + newTTL * 1000);
    await cache.save();
    
    return { success: true, message: 'TTL updated successfully' };
  } catch (error) {
    console.error('Error updating cache TTL:', error);
    return { success: false, error: error.message };
  }
};

// Get cache by type
analyticsCacheSchema.statics.getByType = async function(cacheType, limit = 100) {
  try {
    const cacheEntries = await this.find({ cacheType })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return cacheEntries;
  } catch (error) {
    console.error('Error getting cache by type:', error);
    return [];
  }
};

const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);

module.exports = AnalyticsCache;