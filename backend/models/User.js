const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  avatar: {
    type: String,
    default: function() {
      // Generate avatar URL with user's initials
      const name = this.name || 'User';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1E40AF&color=fff&size=128`;
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'es', 'fr'],
      default: 'en'
    }
  },
  wishlist: [{
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    priceWhenAdded: {
      type: Number,
      min: 0
    },
    priceAlerts: {
      enabled: {
        type: Boolean,
        default: false
      },
      targetPrice: {
        type: Number,
        min: 0
      }
    }
  }],
  stats: {
    totalBuilds: {
      type: Number,
      default: 0
    },
    totalDealsFound: {
      type: Number,
      default: 0
    },
    totalMoneySaved: {
      type: Number,
      default: 0
    },
    wishlistItems: {
      type: Number,
      default: 0
    }
  },
  lastLoginAt: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      return ret;
    }
  }
});

// Indexes for performance (email index is already created by unique: true)
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ 'wishlist.componentId': 1 });

// Virtual for join date formatting
userSchema.virtual('joinDate').get(function() {
  return this.createdAt;
});

// Virtual for member duration
userSchema.virtual('memberSince').get(function() {
  if (!this.createdAt) return '';
  
  const now = new Date();
  const joined = new Date(this.createdAt);
  const monthsDiff = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
  
  if (monthsDiff < 1) return 'New member';
  if (monthsDiff < 12) return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`;
  
  const years = Math.floor(monthsDiff / 12);
  return `${years} year${years > 1 ? 's' : ''}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('User password not found');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update login stats
userSchema.methods.updateLoginStats = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

// Instance method to generate avatar URL
userSchema.methods.generateAvatar = function() {
  const name = this.name || 'User';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1E40AF&color=fff&size=128`;
};

// Instance method to add item to wishlist
userSchema.methods.addToWishlist = function(componentId, priceWhenAdded) {
  // Check if item already exists
  const existingItem = this.wishlist.find(item => 
    item.componentId.toString() === componentId.toString()
  );
  
  if (existingItem) {
    throw new Error('Component already in wishlist');
  }
  
  this.wishlist.push({
    componentId,
    priceWhenAdded,
    addedAt: new Date()
  });
  
  this.stats.wishlistItems = this.wishlist.length;
  return this.save();
};

// Instance method to remove item from wishlist
userSchema.methods.removeFromWishlist = function(componentId) {
  this.wishlist = this.wishlist.filter(item => 
    item.componentId.toString() !== componentId.toString()
  );
  
  this.stats.wishlistItems = this.wishlist.length;
  return this.save();
};

// Instance method to check if component is in wishlist
userSchema.methods.isInWishlist = function(componentId) {
  return this.wishlist.some(item => 
    item.componentId.toString() === componentId.toString()
  );
};

// Instance method to set price alert for wishlist item
userSchema.methods.setPriceAlert = function(componentId, targetPrice) {
  const wishlistItem = this.wishlist.find(item => 
    item.componentId.toString() === componentId.toString()
  );
  
  if (!wishlistItem) {
    throw new Error('Component not found in wishlist');
  }
  
  wishlistItem.priceAlerts.enabled = true;
  wishlistItem.priceAlerts.targetPrice = targetPrice;
  
  return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);
