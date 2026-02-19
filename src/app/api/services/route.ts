import { NextRequest, NextResponse } from 'next/server';
import servicesData from '@/data/services.json';

export const dynamic = 'force-dynamic';

// Types
interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
  image?: string;
}

// Transform raw service data
function transformService(raw: typeof servicesData.services[0]): Service {
  return {
    id: raw.id,
    category: raw.category,
    name: raw.name,
    description: raw.description,
    durationMinutes: raw.duration_minutes,
    priceCents: raw.price_cents,
    isActive: raw.is_active,
    image: raw.image,
  };
}

// Get all services from local JSON (fallback when Sheets not configured)
function getLocalServices(): Service[] {
  return servicesData.services
    .filter((s) => s.is_active)
    .map(transformService);
}

function getLocalServiceById(id: string): Service | null {
  const raw = servicesData.services.find((s) => s.id === id && s.is_active);
  return raw ? transformService(raw) : null;
}

function getLocalServicesByCategory(): Record<string, Service[]> {
  const services = getLocalServices();
  return services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);
}

/**
 * GET /api/services
 * Fetch all active services, optionally grouped by category.
 * Uses local JSON data (can be extended to use Google Sheets when configured)
 *
 * Query params:
 * - grouped: "true" to return services grouped by category
 * - id: specific service ID to fetch single service
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';
    const serviceId = searchParams.get('id');

    // Fetch single service by ID
    if (serviceId) {
      const service = getLocalServiceById(serviceId);

      if (!service) {
        return NextResponse.json(
          { success: false, error: 'Service not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: service,
      });
    }

    // Fetch all services
    if (grouped) {
      const servicesByCategory = getLocalServicesByCategory();

      return NextResponse.json({
        success: true,
        data: servicesByCategory,
      });
    }

    const services = getLocalServices();

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('[API] Services error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch services',
      },
      { status: 500 }
    );
  }
}
