const mongoose = require('mongoose');
const Component = require('../models/Component');
require('dotenv').config();

// Sample component data
const sampleComponents = [
  // CPUs
  {
    id: 'cpu-intel-i7-13700k',
    name: 'Intel Core i7-13700K',
    brand: 'Intel',
    category: 'CPU',
    model: '13700K',
    description: '13th Gen Intel Core processor with 16 cores and 24 threads. Perfect for gaming and content creation.',
    imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300',
    rating: 4.6,
    reviewCount: 1250,
    availability: 'in_stock',
    specifications: {
      socket: 'LGA1700',
      cores: 16,
      threads: 24,
      baseClock: '3.4 GHz',
      boostClock: '5.4 GHz',
      tdp: '125W',
      architecture: 'Raptor Lake'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 32000,
        originalPrice: 35000,
        discount: 8.5,
        availability: 'in_stock',
        url: 'https://amazon.in/intel-i7-13700k',
        shipping: { cost: 0, estimatedDays: 2, free: true },
        badges: ['Prime', 'Best Seller']
      },
      {
        retailer: 'Flipkart',
        price: 32500,
        originalPrice: 35000,
        discount: 7.1,
        availability: 'in_stock',
        url: 'https://flipkart.com/intel-i7-13700k',
        shipping: { cost: 40, estimatedDays: 3, free: false }
      }
    ],
    tags: ['gaming', 'high-performance', 'content-creation'],
    popularity: 95,
    source: 'manual'
  },
  {
    id: 'cpu-amd-ryzen-7-7800x3d',
    name: 'AMD Ryzen 7 7800X3D',
    brand: 'AMD',
    category: 'CPU',
    model: '7800X3D',
    description: 'AMD Ryzen 7 with 3D V-Cache technology. Exceptional gaming performance.',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300',
    rating: 4.8,
    reviewCount: 890,
    availability: 'in_stock',
    specifications: {
      socket: 'AM5',
      cores: 8,
      threads: 16,
      baseClock: '4.2 GHz',
      boostClock: '5.0 GHz',
      tdp: '120W',
      architecture: 'Zen 4'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 38000,
        originalPrice: 42000,
        discount: 9.5,
        availability: 'in_stock',
        url: 'https://amazon.in/amd-ryzen-7-7800x3d',
        shipping: { cost: 0, estimatedDays: 1, free: true },
        badges: ['Gaming Choice', 'Amazon\'s Choice']
      }
    ],
    tags: ['gaming', '3d-vcache', 'premium'],
    popularity: 88,
    source: 'manual'
  },
  
  // GPUs
  {
    id: 'gpu-nvidia-rtx-4070',
    name: 'NVIDIA GeForce RTX 4070',
    brand: 'NVIDIA',
    category: 'GPU',
    model: 'RTX 4070',
    description: 'Next-gen graphics card with ray tracing and DLSS 3. Perfect for 1440p gaming.',
    imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=300',
    rating: 4.5,
    reviewCount: 2340,
    availability: 'in_stock',
    specifications: {
      memory: '12GB',
      memoryType: 'GDDR6X',
      memoryBus: '192-bit',
      cuda: 5888,
      rayTracing: true,
      recommendedPSU: '650W'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 58000,
        originalPrice: 62000,
        discount: 6.5,
        availability: 'in_stock',
        url: 'https://amazon.in/nvidia-rtx-4070',
        shipping: { cost: 0, estimatedDays: 2, free: true },
        badges: ['Gaming', 'Ray Tracing']
      },
      {
        retailer: 'Flipkart',
        price: 59500,
        originalPrice: 62000,
        discount: 4.0,
        availability: 'limited_stock',
        url: 'https://flipkart.com/nvidia-rtx-4070',
        shipping: { cost: 60, estimatedDays: 4, free: false }
      }
    ],
    tags: ['gaming', 'ray-tracing', 'dlss', '1440p'],
    popularity: 92,
    source: 'manual'
  },
  {
    id: 'gpu-amd-rx-7800-xt',
    name: 'AMD Radeon RX 7800 XT',
    brand: 'AMD',
    category: 'GPU',
    model: 'RX 7800 XT',
    description: 'High-performance graphics card with 16GB VRAM. Excellent for 1440p and 4K gaming.',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300',
    rating: 4.4,
    reviewCount: 1580,
    availability: 'in_stock',
    specifications: {
      memory: '16GB',
      memoryType: 'GDDR6',
      memoryBus: '256-bit',
      rayTracing: true,
      recommendedPSU: '700W'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 52000,
        originalPrice: 55000,
        discount: 5.5,
        availability: 'in_stock',
        url: 'https://amazon.in/amd-rx-7800-xt',
        shipping: { cost: 0, estimatedDays: 3, free: true },
        badges: ['High VRAM', 'Value']
      }
    ],
    tags: ['gaming', 'high-vram', '1440p', '4k'],
    popularity: 78,
    source: 'manual'
  },
  
  // RAM
  {
    id: 'ram-corsair-vengeance-32gb',
    name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4-3200',
    brand: 'Corsair',
    category: 'RAM',
    model: 'Vengeance LPX',
    description: 'High-performance DDR4 memory with low-profile design. Perfect for gaming and multitasking.',
    imageUrl: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=300',
    rating: 4.7,
    reviewCount: 3450,
    availability: 'in_stock',
    specifications: {
      capacity: '32GB',
      speed: '3200MHz',
      memoryType: 'DDR4',
      latency: 'CL16',
      voltage: '1.35V'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 8500,
        originalPrice: 9500,
        discount: 10.5,
        availability: 'in_stock',
        url: 'https://amazon.in/corsair-vengeance-32gb',
        shipping: { cost: 0, estimatedDays: 1, free: true },
        badges: ['Best Seller', 'Low Profile']
      }
    ],
    tags: ['gaming', 'multitasking', 'low-profile'],
    popularity: 85,
    source: 'manual'
  },
  {
    id: 'ram-gskill-trident-16gb',
    name: 'G.Skill Trident Z RGB 16GB (2x8GB) DDR4-3600',
    brand: 'G.Skill',
    category: 'RAM',
    model: 'Trident Z RGB',
    description: 'Premium DDR4 memory with RGB lighting. High-speed performance for gaming enthusiasts.',
    imageUrl: 'https://images.unsplash.com/photo-1562976540-199ba9dca79a?w=300',
    rating: 4.6,
    reviewCount: 2890,
    availability: 'in_stock',
    specifications: {
      capacity: '16GB',
      speed: '3600MHz',
      memoryType: 'DDR4',
      latency: 'CL16',
      voltage: '1.35V'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 6800,
        originalPrice: 7500,
        discount: 9.3,
        availability: 'in_stock',
        url: 'https://amazon.in/gskill-trident-z-rgb',
        shipping: { cost: 0, estimatedDays: 2, free: true },
        badges: ['RGB', 'High Speed']
      }
    ],
    tags: ['gaming', 'rgb', 'high-speed'],
    popularity: 79,
    source: 'manual'
  },
  
  // Motherboards
  {
    id: 'mobo-asus-rog-strix-z790',
    name: 'ASUS ROG Strix Z790-E Gaming WiFi',
    brand: 'ASUS',
    category: 'Motherboard',
    model: 'ROG Strix Z790-E',
    description: 'Premium Z790 motherboard with WiFi 6E, RGB lighting, and advanced cooling.',
    imageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300',
    rating: 4.5,
    reviewCount: 1150,
    availability: 'in_stock',
    specifications: {
      socket: 'LGA1700',
      chipset: 'Z790',
      formFactor: 'ATX',
      ramSlots: 4,
      maxRam: '128GB',
      memoryType: 'DDR4/DDR5'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 28000,
        originalPrice: 32000,
        discount: 12.5,
        availability: 'in_stock',
        url: 'https://amazon.in/asus-rog-strix-z790',
        shipping: { cost: 0, estimatedDays: 2, free: true },
        badges: ['WiFi 6E', 'Premium']
      }
    ],
    tags: ['gaming', 'wifi', 'rgb', 'premium'],
    popularity: 82,
    source: 'manual'
  },
  
  // Storage
  {
    id: 'ssd-samsung-980-pro-1tb',
    name: 'Samsung 980 PRO 1TB NVMe SSD',
    brand: 'Samsung',
    category: 'Storage',
    model: '980 PRO',
    description: 'High-performance NVMe SSD with PCIe 4.0 interface. Perfect for gaming and professional workloads.',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300',
    rating: 4.8,
    reviewCount: 4560,
    availability: 'in_stock',
    specifications: {
      capacity: '1TB',
      interface: 'NVMe PCIe 4.0',
      readSpeed: '7000 MB/s',
      writeSpeed: '5000 MB/s'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 8200,
        originalPrice: 9500,
        discount: 13.7,
        availability: 'in_stock',
        url: 'https://amazon.in/samsung-980-pro-1tb',
        shipping: { cost: 0, estimatedDays: 1, free: true },
        badges: ['Fast', 'Reliable', 'Amazon\'s Choice']
      }
    ],
    tags: ['nvme', 'fast', 'reliable', 'pcie4'],
    popularity: 94,
    source: 'manual'
  },
  
  // PSU
  {
    id: 'psu-corsair-rm750x',
    name: 'Corsair RM750x 750W 80+ Gold Modular PSU',
    brand: 'Corsair',
    category: 'PSU',
    model: 'RM750x',
    description: '750W fully modular power supply with 80+ Gold efficiency and silent operation.',
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300',
    rating: 4.7,
    reviewCount: 2890,
    availability: 'in_stock',
    specifications: {
      wattage: '750W',
      efficiency: '80+ Gold',
      modular: 'Fully Modular',
      warranty: '10 Years'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 9500,
        originalPrice: 11000,
        discount: 13.6,
        availability: 'in_stock',
        url: 'https://amazon.in/corsair-rm750x',
        shipping: { cost: 0, estimatedDays: 2, free: true },
        badges: ['80+ Gold', 'Modular']
      }
    ],
    tags: ['modular', 'efficient', 'quiet', '750w'],
    popularity: 87,
    source: 'manual'
  },
  
  // Case
  {
    id: 'case-nzxt-h7-elite',
    name: 'NZXT H7 Elite Mid-Tower Case',
    brand: 'NZXT',
    category: 'Case',
    model: 'H7 Elite',
    description: 'Premium mid-tower case with tempered glass panels and RGB lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300',
    rating: 4.4,
    reviewCount: 1780,
    availability: 'in_stock',
    specifications: {
      size: 'Mid-Tower',
      motherboardSupport: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      maxGpuLength: '381mm',
      color: 'Black'
    },
    offers: [
      {
        retailer: 'Amazon',
        price: 12500,
        originalPrice: 14000,
        discount: 10.7,
        availability: 'in_stock',
        url: 'https://amazon.in/nzxt-h7-elite',
        shipping: { cost: 100, estimatedDays: 3, free: false },
        badges: ['Tempered Glass', 'RGB']
      }
    ],
    tags: ['mid-tower', 'rgb', 'tempered-glass', 'premium'],
    popularity: 73,
    source: 'manual'
  }
];

async function seedComponents() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing components (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      await Component.deleteMany({});
      console.log('Cleared existing components');
    }

    // Insert sample components
    const insertedComponents = await Component.insertMany(sampleComponents);
    console.log(`✅ Successfully inserted ${insertedComponents.length} components`);

    // Log summary
    const categoryCounts = await Component.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Component Summary:');
    categoryCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} components`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedComponents();
}

module.exports = { seedComponents, sampleComponents };
