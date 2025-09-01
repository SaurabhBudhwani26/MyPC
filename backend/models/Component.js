const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  id: String,
  componentId: String,
  retailer: {
    type: String,
    required: true,
    enum: ['Amazon', 'Flipkart', 'EarnKaro', 'Other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  availability: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'limited_stock', 'pre_order'],
    default: 'in_stock'
  },
  url: {
    type: String,
    required: true
  },
  affiliateUrl: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  shipping: {
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    estimatedDays: {
      type: Number,
      min: 1,
      default: 3
    },
    free: {
      type: Boolean,
      default: false
    }
  },
  badges: [String],
  cashback: String,
  warranty: String
}, { _id: false });

const componentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
    maxlength: [200, 'Component name cannot exceed 200 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Case', 'Cooling', 'Other']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [100, 'Model name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  imageUrl: String,
  images: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  availability: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  averagePrice: {
    type: Number,
    min: 0
  },
  priceRange: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    }
  },
  specifications: {
    // CPU specific
    socket: String,
    cores: Number,
    threads: Number,
    baseClock: String,
    boostClock: String,
    tdp: String,
    architecture: String,
    
    // GPU specific
    memory: String,
    memoryType: String,
    memoryBus: String,
    cuda: Number,
    rayTracing: Boolean,
    recommendedPSU: String,
    
    // RAM specific
    capacity: String,
    speed: String,
    latency: String,
    voltage: String,
    
    // Motherboard specific
    chipset: String,
    formFactor: String,
    ramSlots: Number,
    maxRam: String,
    
    // Storage specific
    capacity: String,
    interface: String,
    readSpeed: String,
    writeSpeed: String,
    
    // PSU specific
    wattage: String,
    efficiency: String,
    modular: String,
    warranty: String,
    
    // Case specific
    size: String,
    motherboardSupport: [String],
    maxGpuLength: String,
    
    // General
    dimensions: String,
    weight: String,
    color: String
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  offers: [offerSchema],
  popularity: {
    type: Number,
    default: 0
  },
  searchCount: {
    type: Number,
    default: 0
  },
  lastPriceUpdate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['api', 'scraper', 'manual'],
    default: 'api'
  },
  sourceId: String,
  dataQuality: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
componentSchema.index({ category: 1, isActive: 1 });
componentSchema.index({ brand: 1 });
componentSchema.index({ averagePrice: 1 });
componentSchema.index({ rating: -1 });
componentSchema.index({ popularity: -1 });
componentSchema.index({ name: 'text', brand: 'text', model: 'text' });
componentSchema.index({ 'offers.price': 1 });
componentSchema.index({ lastPriceUpdate: -1 });

// Virtual for best offer
componentSchema.virtual('bestOffer').get(function() {
  if (!this.offers || this.offers.length === 0) return null;
  
  return this.offers.reduce((best, current) => {
    return current.price < best.price ? current : best;
  });
});

// Virtual for availability status
componentSchema.virtual('availabilityStatus').get(function() {
  if (this.offers && this.offers.length > 0) {
    const inStockOffers = this.offers.filter(offer => offer.availability === 'in_stock');
    return inStockOffers.length > 0 ? 'in_stock' : 'out_of_stock';
  }
  return this.availability;
});

// Virtual for price trend (simplified)
componentSchema.virtual('priceTrend').get(function() {
  if (!this.offers || this.offers.length === 0) return 'stable';
  
  const bestPrice = this.bestOffer?.price || 0;
  const avgPrice = this.averagePrice || 0;
  
  if (bestPrice < avgPrice * 0.9) return 'down';
  if (bestPrice > avgPrice * 1.1) return 'up';
  return 'stable';
});

// Pre-save middleware to update price range and average
componentSchema.pre('save', function(next) {
  if (this.offers && this.offers.length > 0) {
    const prices = this.offers.map(offer => offer.price);
    const validPrices = prices.filter(price => price > 0);
    
    if (validPrices.length > 0) {
      this.priceRange = {
        min: Math.min(...validPrices),
        max: Math.max(...validPrices)
      };
      
      this.averagePrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
    }
    
    // Update last price update time
    this.lastPriceUpdate = new Date();
  }
  
  next();
});

// Instance method to add offer
componentSchema.methods.addOffer = function(offer) {
  // Remove existing offer from same retailer
  this.offers = this.offers.filter(existingOffer => 
    existingOffer.retailer !== offer.retailer
  );
  
  // Add new offer
  this.offers.push(offer);
  
  return this.save();
};

// Instance method to update popularity
componentSchema.methods.incrementPopularity = function() {
  this.popularity += 1;
  this.searchCount += 1;
  return this.save();
};

// Instance method to get category-specific specs
componentSchema.methods.getCategorySpecs = function() {
  const specs = this.specifications || {};
  
  switch (this.category) {
    case 'CPU':
      return {
        socket: specs.socket,
        cores: specs.cores,
        threads: specs.threads,
        baseClock: specs.baseClock,
        boostClock: specs.boostClock,
        tdp: specs.tdp
      };
    case 'GPU':
      return {
        memory: specs.memory,
        memoryType: specs.memoryType,
        baseClock: specs.baseClock,
        boostClock: specs.boostClock,
        cuda: specs.cuda,
        rayTracing: specs.rayTracing
      };
    case 'RAM':
      return {
        capacity: specs.capacity,
        speed: specs.speed,
        memoryType: specs.memoryType,
        latency: specs.latency
      };
    default:
      return specs;
  }
};

// Static method to search components
componentSchema.statics.searchComponents = function(query, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    brand,
    limit = 20,
    sort = 'popularity'
  } = options;
  
  let searchQuery = { isActive: true };
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Category filter
  if (category) {
    searchQuery.category = category;
  }
  
  // Price range filter
  if (minPrice || maxPrice) {
    searchQuery.averagePrice = {};
    if (minPrice) searchQuery.averagePrice.$gte = minPrice;
    if (maxPrice) searchQuery.averagePrice.$lte = maxPrice;
  }
  
  // Brand filter
  if (brand) {
    searchQuery.brand = new RegExp(brand, 'i');
  }
  
  // Sort options
  let sortOptions = {};
  switch (sort) {
    case 'price_low':
      sortOptions = { averagePrice: 1 };
      break;
    case 'price_high':
      sortOptions = { averagePrice: -1 };
      break;
    case 'rating':
      sortOptions = { rating: -1, reviewCount: -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    default:
      sortOptions = { popularity: -1, rating: -1 };
  }
  
  return this.find(searchQuery)
    .sort(sortOptions)
    .limit(limit);
};

// Static method to get trending components
componentSchema.statics.getTrending = function(category, limit = 10) {
  const query = { isActive: true };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ searchCount: -1, popularity: -1 })
    .limit(limit);
};

// Static method to get best deals
componentSchema.statics.getBestDeals = function(category, limit = 20) {
  const query = { 
    isActive: true,
    'offers.0': { $exists: true }
  };
  
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ 'offers.discount': -1, popularity: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Component', componentSchema);
