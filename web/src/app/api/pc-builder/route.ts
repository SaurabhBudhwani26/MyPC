import { NextRequest, NextResponse } from 'next/server';

interface PCComponent {
  id: string;
  name: string;
  brand: string;
  category: string;
  model: string;
  description: string;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  availability: string;
  averagePrice: number;
  priceRange: { min: number; max: number };
  lastUpdated: string;
  specifications: Record<string, any>;
  offers: ComponentOffer[];
}

interface ComponentOffer {
  id: string;
  componentId: string;
  retailer: string;
  price: number;
  originalPrice: number;
  discount: number;
  availability: string;
  url: string;
  lastUpdated: string;
  shipping: {
    cost: number;
    estimatedDays: number;
    free: boolean;
  };
  badges: string[];
}

interface PCBuild {
  id: string;
  name: string;
  description?: string;
  components: {
    cpu?: PCComponent;
    gpu?: PCComponent;
    ram?: PCComponent;
    motherboard?: PCComponent;
    storage?: PCComponent;
    psu?: PCComponent;
    case?: PCComponent;
    cooling?: PCComponent;
  };
  totalPrice: number;
  originalTotalPrice: number;
  totalDiscount: number;
  compatibility: {
    isCompatible: boolean;
    warnings: string[];
    errors: string[];
  };
  created: string;
  updated: string;
}

// In a real app, this would be stored in a database
const pcBuilds: Map<string, PCBuild> = new Map();

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function calculateBuildTotals(components: PCBuild['components']) {
  let totalPrice = 0;
  let originalTotalPrice = 0;

  Object.values(components).forEach(component => {
    if (component && component.offers && component.offers.length > 0) {
      const bestOffer = component.offers.reduce((best, current) => 
        current.price < best.price ? current : best
      );
      totalPrice += bestOffer.price;
      originalTotalPrice += bestOffer.originalPrice || bestOffer.price;
    }
  });

  const totalDiscount = originalTotalPrice > totalPrice 
    ? Math.round(((originalTotalPrice - totalPrice) / originalTotalPrice) * 100) 
    : 0;

  return { totalPrice, originalTotalPrice, totalDiscount };
}

function checkCompatibility(components: PCBuild['components']) {
  const warnings: string[] = [];
  const errors: string[] = [];
  let isCompatible = true;

  // Basic compatibility checks
  if (components.cpu && components.motherboard) {
    // Check CPU socket compatibility (simplified)
    const cpuBrand = components.cpu.brand.toLowerCase();
    const motherboardTitle = components.motherboard.name.toLowerCase();
    
    if (cpuBrand.includes('intel') && !motherboardTitle.includes('intel') && !motherboardTitle.includes('lga')) {
      warnings.push('CPU and motherboard compatibility should be verified');
    }
    if (cpuBrand.includes('amd') && !motherboardTitle.includes('amd') && !motherboardTitle.includes('am4') && !motherboardTitle.includes('am5')) {
      warnings.push('CPU and motherboard compatibility should be verified');
    }
  }

  // Check if PSU power is sufficient (simplified)
  if (components.psu && components.gpu) {
    const psuSpecs = components.psu.specifications;
    const gpuSpecs = components.gpu.specifications;
    
    // This is a simplified check - in reality, you'd need more detailed power calculations
    if (psuSpecs.power && gpuSpecs.power) {
      const psuWattage = parseInt(psuSpecs.power.toString().replace(/\D/g, ''));
      const gpuPower = parseInt(gpuSpecs.power.toString().replace(/\D/g, ''));
      
      if (psuWattage < gpuPower + 200) { // 200W headroom for other components
        warnings.push('PSU wattage might be insufficient for this GPU');
      }
    }
  }

  // Check RAM compatibility
  if (components.ram && components.motherboard) {
    const ramSpecs = components.ram.specifications;
    const motherboardSpecs = components.motherboard.specifications;
    
    if (ramSpecs.memoryType && motherboardSpecs.memoryType) {
      if (ramSpecs.memoryType !== motherboardSpecs.memoryType) {
        errors.push('RAM type is incompatible with motherboard');
        isCompatible = false;
      }
    }
  }

  // Essential components check
  const essentialComponents = ['cpu', 'motherboard', 'ram', 'storage'];
  const missingEssential = essentialComponents.filter(comp => !components[comp as keyof typeof components]);
  
  if (missingEssential.length > 0) {
    warnings.push(`Consider adding: ${missingEssential.join(', ')}`);
  }

  return { isCompatible, warnings, errors };
}

// GET - Retrieve a PC build
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const buildId = searchParams.get('id');

  if (!buildId) {
    return NextResponse.json(
      { error: 'Build ID is required' },
      { status: 400 }
    );
  }

  const build = pcBuilds.get(buildId);
  if (!build) {
    return NextResponse.json(
      { error: 'PC build not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    build,
    timestamp: new Date().toISOString()
  });
}

// POST - Create a new PC build
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    const buildId = generateId();
    const now = new Date().toISOString();

    const newBuild: PCBuild = {
      id: buildId,
      name: name || `PC Build ${buildId}`,
      description,
      components: {},
      totalPrice: 0,
      originalTotalPrice: 0,
      totalDiscount: 0,
      compatibility: {
        isCompatible: true,
        warnings: ['Add components to start building'],
        errors: []
      },
      created: now,
      updated: now
    };

    pcBuilds.set(buildId, newBuild);

    return NextResponse.json({
      success: true,
      build: newBuild,
      message: 'PC build created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating PC build:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create PC build'
      },
      { status: 500 }
    );
  }
}

// PUT - Update a PC build (add/remove components)
export async function PUT(request: NextRequest) {
  try {
    const { buildId, action, category, component } = await request.json();

    if (!buildId || !action || !category) {
      return NextResponse.json(
        { error: 'Build ID, action, and category are required' },
        { status: 400 }
      );
    }

    const build = pcBuilds.get(buildId);
    if (!build) {
      return NextResponse.json(
        { error: 'PC build not found' },
        { status: 404 }
      );
    }

    // Validate category
    const validCategories = ['cpu', 'gpu', 'ram', 'motherboard', 'storage', 'psu', 'case', 'cooling'];
    if (!validCategories.includes(category.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid component category' },
        { status: 400 }
      );
    }

    const categoryKey = category.toLowerCase() as keyof PCBuild['components'];

    if (action === 'add') {
      if (!component) {
        return NextResponse.json(
          { error: 'Component is required for add action' },
          { status: 400 }
        );
      }
      build.components[categoryKey] = component;
    } else if (action === 'remove') {
      delete build.components[categoryKey];
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }

    // Recalculate totals and compatibility
    const totals = calculateBuildTotals(build.components);
    build.totalPrice = totals.totalPrice;
    build.originalTotalPrice = totals.originalTotalPrice;
    build.totalDiscount = totals.totalDiscount;
    build.compatibility = checkCompatibility(build.components);
    build.updated = new Date().toISOString();

    pcBuilds.set(buildId, build);

    return NextResponse.json({
      success: true,
      build,
      message: `Component ${action}ed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating PC build:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update PC build'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a PC build
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const buildId = searchParams.get('id');

  if (!buildId) {
    return NextResponse.json(
      { error: 'Build ID is required' },
      { status: 400 }
    );
  }

  const deleted = pcBuilds.delete(buildId);
  if (!deleted) {
    return NextResponse.json(
      { error: 'PC build not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'PC build deleted successfully',
    timestamp: new Date().toISOString()
  });
}
