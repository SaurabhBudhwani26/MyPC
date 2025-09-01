const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  id: String,
  name: String,
  brand: String,
  model: String,
  category: {
    type: String,
    enum: ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Case', 'Cooling', 'Other']
  },
  price: Number,
  originalPrice: Number,
  discount: Number,
  imageUrl: String,
  url: String,
  retailer: String,
  specifications: mongoose.Schema.Types.Mixed,
  selectedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const compatibilitySchema = new mongoose.Schema({
  isCompatible: {
    type: Boolean,
    default: true
  },
  warnings: [{
    type: String
  }],
  issues: [{
    type: String
  }],
  estimatedWattage: {
    type: Number,
    default: 0
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const pcBuildSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Build name is required'],
    trim: true,
    maxlength: [100, 'Build name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  components: {
    cpu: componentSchema,
    gpu: componentSchema,
    ram: componentSchema,
    motherboard: componentSchema,
    storage: componentSchema,
    psu: componentSchema,
    case: componentSchema,
    cooling: componentSchema
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  originalTotalPrice: {
    type: Number,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalSavings: {
    type: Number,
    default: 0
  },
  compatibility: compatibilitySchema,
  isPublic: {
    type: Boolean,
    default: false
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
  buildType: {
    type: String,
    enum: ['gaming', 'workstation', 'office', 'budget', 'high-end', 'custom'],
    default: 'custom'
  },
  targetBudget: {
    type: Number,
    min: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharedCount: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
pcBuildSchema.index({ user: 1, createdAt: -1 });
pcBuildSchema.index({ isPublic: 1, likes: -1 });
pcBuildSchema.index({ buildType: 1 });
pcBuildSchema.index({ totalPrice: 1 });
pcBuildSchema.index({ tags: 1 });

// Virtual for component count
pcBuildSchema.virtual('componentCount').get(function() {
  const components = this.components;
  return Object.keys(components).filter(key => components[key] && components[key].id).length;
});

// Virtual for required components completion
pcBuildSchema.virtual('requiredComponentsComplete').get(function() {
  const required = ['cpu', 'ram', 'motherboard', 'storage'];
  return required.every(component => this.components[component] && this.components[component].id);
});

// Virtual for build completion percentage
pcBuildSchema.virtual('completionPercentage').get(function() {
  const allComponents = ['cpu', 'gpu', 'ram', 'motherboard', 'storage', 'psu', 'case', 'cooling'];
  const selectedComponents = allComponents.filter(component => 
    this.components[component] && this.components[component].id
  ).length;
  
  return Math.round((selectedComponents / allComponents.length) * 100);
});

// Pre-save middleware to calculate totals
pcBuildSchema.pre('save', function(next) {
  let totalPrice = 0;
  let originalTotalPrice = 0;
  
  Object.keys(this.components).forEach(key => {
    const component = this.components[key];
    if (component && component.price) {
      totalPrice += component.price;
      originalTotalPrice += component.originalPrice || component.price;
    }
  });
  
  this.totalPrice = totalPrice;
  this.originalTotalPrice = originalTotalPrice;
  this.totalSavings = originalTotalPrice - totalPrice;
  this.totalDiscount = originalTotalPrice > 0 ? 
    Math.round(((originalTotalPrice - totalPrice) / originalTotalPrice) * 100) : 0;
  
  this.isComplete = this.requiredComponentsComplete;
  this.lastModified = new Date();
  
  next();
});

// Instance method to add component
pcBuildSchema.methods.addComponent = function(category, component) {
  this.components[category] = component;
  return this.save();
};

// Instance method to remove component
pcBuildSchema.methods.removeComponent = function(category) {
  this.components[category] = undefined;
  return this.save();
};

// Instance method to check compatibility
pcBuildSchema.methods.checkCompatibility = function() {
  const warnings = [];
  const issues = [];
  
  const cpu = this.components.cpu;
  const motherboard = this.components.motherboard;
  const ram = this.components.ram;
  const gpu = this.components.gpu;
  const psu = this.components.psu;
  const pcCase = this.components.case;
  const storage = this.components.storage;
  const cooling = this.components.cooling;
  
  // 1. CPU and Motherboard socket compatibility (CRITICAL)
  if (cpu && motherboard) {
    const cpuSocket = cpu.specifications?.socket;
    const mbSocket = motherboard.specifications?.socket;
    
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push(`❌ CPU socket ${cpuSocket} is not compatible with motherboard socket ${mbSocket}`);
    }
    
    // Check CPU generation compatibility
    if (cpuSocket === mbSocket) {
      const cpuGen = this._extractCpuGeneration(cpu.name, cpu.model);
      const mbChipset = motherboard.specifications?.chipset;
      
      if (!this._isCpuChipsetCompatible(cpuGen, mbChipset, cpuSocket)) {
        warnings.push(`⚠️ CPU ${cpu.model} may need BIOS update for ${mbChipset} chipset`);
      }
    }
  }
  
  // 2. RAM and Motherboard compatibility (CRITICAL)
  if (ram && motherboard) {
    const ramType = ram.specifications?.memoryType || ram.specifications?.type;
    const mbRamType = motherboard.specifications?.memoryType;
    
    if (ramType && mbRamType) {
      // Handle motherboard supporting multiple RAM types (e.g., "DDR4/DDR5")
      const supportedTypes = mbRamType.split('/').map(type => type.trim());
      if (!supportedTypes.includes(ramType)) {
        issues.push(`❌ RAM type ${ramType} is not compatible with motherboard (supports: ${mbRamType})`);
      }
    }
    
    // Check RAM capacity vs motherboard limits
    const ramCapacityStr = ram.specifications?.capacity;
    const maxRamStr = motherboard.specifications?.maxRam;
    
    if (ramCapacityStr && maxRamStr) {
      const ramCapacity = this._parseMemorySize(ramCapacityStr);
      const maxRam = this._parseMemorySize(maxRamStr);
      
      if (ramCapacity > maxRam) {
        issues.push(`❌ RAM capacity ${ramCapacityStr} exceeds motherboard limit of ${maxRamStr}`);
      }
    }
    
    // Check RAM speed compatibility
    const ramSpeed = this._extractMemorySpeed(ram.specifications?.speed);
    if (ramSpeed > 3200 && motherboard.specifications?.chipset) {
      const chipset = motherboard.specifications.chipset.toLowerCase();
      if (chipset.includes('h610') || chipset.includes('b660')) {
        warnings.push(`⚠️ High-speed RAM (${ram.specifications.speed}) may not run at full speed on ${chipset} chipset`);
      }
    }
  }
  
  // 3. Power Supply wattage calculation (CRITICAL)
  const estimatedWattage = this._calculatePowerRequirements(cpu, gpu, ram, motherboard, storage);
  
  if (psu) {
    const psuWattageStr = psu.specifications?.wattage;
    const psuWattage = this._parseWattage(psuWattageStr);
    
    if (psuWattage && estimatedWattage) {
      const recommendedWattage = Math.ceil(estimatedWattage * 1.2); // 20% headroom
      
      if (psuWattage < estimatedWattage) {
        issues.push(`❌ PSU wattage (${psuWattage}W) insufficient for build (needs ~${estimatedWattage}W minimum)`);
      } else if (psuWattage < recommendedWattage) {
        warnings.push(`⚠️ PSU wattage (${psuWattage}W) is close to requirements. Recommend ${recommendedWattage}W for safety`);
      }
    }
  } else if (estimatedWattage) {
    const recommendedWattage = Math.ceil(estimatedWattage * 1.2);
    warnings.push(`⚠️ No PSU selected. Estimated requirement: ${recommendedWattage}W (80+ Gold recommended)`);
  }
  
  // 4. GPU clearance and case compatibility
  if (gpu && pcCase) {
    const gpuLength = this._extractGpuLength(gpu.specifications?.dimensions || gpu.name);
    const maxGpuLength = this._parseLength(pcCase.specifications?.maxGpuLength);
    
    if (gpuLength && maxGpuLength) {
      if (gpuLength > maxGpuLength) {
        issues.push(`❌ GPU length (~${gpuLength}mm) exceeds case clearance (${maxGpuLength}mm)`);
      } else if (gpuLength > maxGpuLength * 0.9) {
        warnings.push(`⚠️ GPU will be a tight fit in case (${gpuLength}mm vs ${maxGpuLength}mm max)`);
      }
    } else {
      warnings.push(`⚠️ Please verify GPU will fit in selected case`);
    }
  }
  
  // 5. Case and motherboard form factor compatibility
  if (motherboard && pcCase) {
    const mbFormFactor = motherboard.specifications?.formFactor;
    const supportedFormFactors = pcCase.specifications?.motherboardSupport;
    
    if (mbFormFactor && supportedFormFactors) {
      if (Array.isArray(supportedFormFactors)) {
        if (!supportedFormFactors.includes(mbFormFactor)) {
          issues.push(`❌ Motherboard form factor ${mbFormFactor} not supported by case`);
        }
      }
    }
  }
  
  // 6. Cooling compatibility
  if (cooling && cpu) {
    const cpuSocket = cpu.specifications?.socket;
    const coolingSocket = cooling.specifications?.socket;
    
    if (coolingSocket && cpuSocket && coolingSocket !== cpuSocket) {
      issues.push(`❌ CPU cooler socket ${coolingSocket} not compatible with CPU socket ${cpuSocket}`);
    }
    
    // Check if cooling is adequate for CPU TDP
    const cpuTdp = this._parseWattage(cpu.specifications?.tdp);
    const coolerTdp = this._parseWattage(cooling.specifications?.tdpRating || cooling.specifications?.maxTdp);
    
    if (cpuTdp && coolerTdp && coolerTdp < cpuTdp) {
      warnings.push(`⚠️ CPU cooler TDP rating (${coolerTdp}W) may be insufficient for CPU TDP (${cpuTdp}W)`);
    }
  } else if (cpu) {
    const cpuTdp = this._parseWattage(cpu.specifications?.tdp);
    if (cpuTdp && cpuTdp > 65) {
      warnings.push(`⚠️ High TDP CPU (${cpuTdp}W) - aftermarket cooling recommended`);
    }
  }
  
  // 7. Storage interface compatibility
  if (storage && motherboard) {
    const storageInterface = storage.specifications?.interface;
    if (storageInterface && storageInterface.includes('NVMe')) {
      const chipset = motherboard.specifications?.chipset;
      if (chipset && (chipset.includes('H610') || chipset.includes('older'))) {
        warnings.push(`⚠️ NVMe SSD may have limited performance on ${chipset} chipset`);
      }
    }
  }
  
  // 8. General warnings and recommendations
  const componentCount = Object.values(this.components).filter(comp => comp && comp.id).length;
  if (componentCount < 4) {
    warnings.push(`⚠️ Build is incomplete. Essential components: CPU, Motherboard, RAM, Storage`);
  }
  
  // Budget vs performance warnings
  if (cpu && gpu) {
    const cpuPrice = cpu.price || 0;
    const gpuPrice = gpu.price || 0;
    const totalPrice = cpuPrice + gpuPrice;
    
    if (totalPrice > 0) {
      const cpuRatio = cpuPrice / totalPrice;
      const gpuRatio = gpuPrice / totalPrice;
      
      if (cpuRatio > 0.7) {
        warnings.push(`⚠️ CPU-heavy build - consider upgrading GPU for better gaming performance`);
      } else if (gpuRatio > 0.7) {
        warnings.push(`⚠️ GPU-heavy build - ensure CPU won't bottleneck performance`);
      }
    }
  }
  
  this.compatibility = {
    isCompatible: issues.length === 0,
    warnings,
    issues,
    estimatedWattage,
    lastChecked: new Date()
  };
  
  return this.save();
};

// Helper methods for compatibility checking
pcBuildSchema.methods._extractCpuGeneration = function(name, model) {
  // Extract CPU generation from name/model
  if (name.includes('Intel')) {
    const gen = name.match(/(\d+)th Gen|i[3-9]-?(\d{1,2})\d{2,3}/i);
    return gen ? (gen[1] || gen[2]) : null;
  } else if (name.includes('AMD')) {
    const gen = name.match(/Ryzen \d+ (\d)\d{3}/i);
    return gen ? gen[1] : null;
  }
  return null;
};

pcBuildSchema.methods._isCpuChipsetCompatible = function(cpuGen, chipset, socket) {
  if (!cpuGen || !chipset) return true; // Assume compatible if info missing
  
  const compatibilityMap = {
    'LGA1700': {
      '12': ['Z690', 'H670', 'B660', 'H610'],
      '13': ['Z790', 'Z690', 'H670', 'B660', 'H610']
    },
    'AM5': {
      '7': ['X670E', 'X670', 'B650E', 'B650'],
      '8': ['X670E', 'X670', 'B650E', 'B650']
    }
  };
  
  const supportedChipsets = compatibilityMap[socket]?.[cpuGen] || [];
  return supportedChipsets.some(supported => chipset.includes(supported));
};

pcBuildSchema.methods._parseMemorySize = function(sizeStr) {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/(\d+)\s*GB/i);
  return match ? parseInt(match[1]) : 0;
};

pcBuildSchema.methods._extractMemorySpeed = function(speedStr) {
  if (!speedStr) return 0;
  const match = speedStr.match(/(\d+)/i);
  return match ? parseInt(match[1]) : 0;
};

pcBuildSchema.methods._parseWattage = function(wattageStr) {
  if (!wattageStr) return 0;
  const match = wattageStr.match(/(\d+)\s*W/i);
  return match ? parseInt(match[1]) : 0;
};

pcBuildSchema.methods._parseLength = function(lengthStr) {
  if (!lengthStr) return 0;
  const match = lengthStr.match(/(\d+)\s*mm/i);
  return match ? parseInt(match[1]) : 0;
};

pcBuildSchema.methods._extractGpuLength = function(info) {
  // Try to extract GPU length from dimensions or estimate from model
  if (!info) return 0;
  const match = info.match(/(\d+)\s*mm/i);
  if (match) return parseInt(match[1]);
  
  // Rough estimates for common GPU series
  if (info.includes('RTX 4090')) return 315;
  if (info.includes('RTX 4080')) return 310;
  if (info.includes('RTX 4070')) return 285;
  if (info.includes('RTX 4060')) return 245;
  if (info.includes('RX 7900')) return 320;
  if (info.includes('RX 7800')) return 295;
  
  return 270; // Average modern GPU length
};

pcBuildSchema.methods._calculatePowerRequirements = function(cpu, gpu, ram, motherboard, storage) {
  let totalWattage = 0;
  
  // Base system power
  totalWattage += 50; // Motherboard, fans, etc.
  
  // CPU power
  if (cpu) {
    const cpuTdp = this._parseWattage(cpu.specifications?.tdp);
    totalWattage += cpuTdp || this._estimateCpuPower(cpu.name);
  }
  
  // GPU power
  if (gpu) {
    const recommendedPsu = this._parseWattage(gpu.specifications?.recommendedPSU);
    if (recommendedPsu) {
      // Use recommended PSU as indication of GPU power draw
      totalWattage += Math.max(recommendedPsu - 200, this._estimateGpuPower(gpu.name));
    } else {
      totalWattage += this._estimateGpuPower(gpu.name);
    }
  }
  
  // RAM power (rough estimate)
  if (ram) {
    const capacity = this._parseMemorySize(ram.specifications?.capacity || '');
    const speed = this._extractMemorySpeed(ram.specifications?.speed || '');
    const ramPower = Math.max(10, capacity * 2 + (speed > 3200 ? 5 : 0));
    totalWattage += ramPower;
  }
  
  // Storage power
  if (storage) {
    const interface = storage.specifications?.interface;
    if (interface && interface.includes('NVMe')) {
      totalWattage += 8; // NVMe SSD
    } else {
      totalWattage += 25; // Traditional HDD/SATA SSD
    }
  }
  
  return Math.ceil(totalWattage);
};

pcBuildSchema.methods._estimateCpuPower = function(cpuName) {
  if (!cpuName) return 65;
  
  // Intel estimates
  if (cpuName.includes('i9')) return 125;
  if (cpuName.includes('i7')) return 65;
  if (cpuName.includes('i5')) return 65;
  if (cpuName.includes('i3')) return 60;
  
  // AMD estimates
  if (cpuName.includes('Ryzen 9')) return 105;
  if (cpuName.includes('Ryzen 7')) return 65;
  if (cpuName.includes('Ryzen 5')) return 65;
  if (cpuName.includes('Ryzen 3')) return 65;
  
  return 65; // Default
};

pcBuildSchema.methods._estimateGpuPower = function(gpuName) {
  if (!gpuName) return 150;
  
  // NVIDIA estimates
  if (gpuName.includes('RTX 4090')) return 320;
  if (gpuName.includes('RTX 4080')) return 280;
  if (gpuName.includes('RTX 4070')) return 200;
  if (gpuName.includes('RTX 4060')) return 140;
  if (gpuName.includes('RTX 3090')) return 300;
  if (gpuName.includes('RTX 3080')) return 250;
  if (gpuName.includes('RTX 3070')) return 200;
  
  // AMD estimates
  if (gpuName.includes('RX 7900')) return 280;
  if (gpuName.includes('RX 7800')) return 230;
  if (gpuName.includes('RX 7700')) return 180;
  if (gpuName.includes('RX 6900')) return 230;
  if (gpuName.includes('RX 6800')) return 200;
  
  return 180; // Default mid-range GPU
};

// Static method to find user builds
pcBuildSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ updatedAt: -1 });
};

// Static method to find public builds
pcBuildSchema.statics.findPublic = function(limit = 20) {
  return this.find({ isPublic: true })
    .sort({ likes: -1, createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar');
};

// Static method to find builds by type
pcBuildSchema.statics.findByType = function(buildType, limit = 20) {
  return this.find({ buildType, isPublic: true })
    .sort({ likes: -1 })
    .limit(limit)
    .populate('user', 'name avatar');
};

module.exports = mongoose.model('PCBuild', pcBuildSchema);
