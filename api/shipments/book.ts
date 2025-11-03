import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';
import { CourierApiService } from '../week3-integrations/courier-api-service';

const pool = getPool();
const courierApi = new CourierApiService();

/**
 * Shipment Booking API
 * Books shipments with courier APIs and generates tracking numbers
 * 
 * POST /api/shipments/book
 * 
 * Body:
 * {
 *   order_id: string,
 *   courier_id: string,
 *   service_type: 'home_delivery' | 'parcel_shop' | 'parcel_locker',
 *   pickup_address: { ... },
 *   delivery_address: { ... },
 *   package_details: { weight, dimensions, value },
 *   delivery_instructions?: string
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    order_id,
    courier_id,
    service_type = 'home_delivery',
    pickup_address,
    delivery_address,
    package_details,
    delivery_instructions,
    parcel_shop_id
  } = req.body;

  // Validation
  if (!order_id || !courier_id || !pickup_address || !delivery_address || !package_details) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['order_id', 'courier_id', 'pickup_address', 'delivery_address', 'package_details']
    });
  }

  try {
    // Get courier details
    const courierQuery = await pool.query(
      'SELECT courier_id, courier_name, courier_code, company_name FROM couriers WHERE courier_id = $1',
      [courier_id]
    );

    if (courierQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Courier not found' });
    }

    const courier = courierQuery.rows[0];

    // Get order details
    const orderQuery = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [order_id]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderQuery.rows[0];

    // Build booking request based on courier
    let bookingData: any;
    let bookingEndpoint: string;

    switch (courier.courier_code?.toUpperCase()) {
      case 'POSTNORD':
        bookingData = buildPostNordBooking(order, pickup_address, delivery_address, package_details, service_type, parcel_shop_id);
        bookingEndpoint = '/rest/businesslocation/v5/booking';
        break;

      case 'BRING':
        bookingData = buildBringBooking(order, pickup_address, delivery_address, package_details, service_type, parcel_shop_id);
        bookingEndpoint = '/api/booking/v1/shipments';
        break;

      case 'DHL':
        bookingData = buildDHLBooking(order, pickup_address, delivery_address, package_details, service_type);
        bookingEndpoint = '/shipments/v1';
        break;

      case 'UPS':
        bookingData = buildUPSBooking(order, pickup_address, delivery_address, package_details, service_type);
        bookingEndpoint = '/api/shipments/v1/ship';
        break;

      default:
        return res.status(400).json({
          error: 'Courier not supported for booking',
          courier: courier.courier_name,
          supported: ['PostNord', 'Bring', 'DHL', 'UPS']
        });
    }

    // Make booking API call
    console.log(`Booking shipment with ${courier.courier_name}...`);
    
    const bookingResponse = await courierApi.makeApiCall(
      courier.courier_name,
      bookingEndpoint,
      'POST',
      bookingData,
      {
        userId: security.user?.id,
        entityType: 'shipment_booking',
        entityId: order_id
      }
    );

    // Extract tracking number and label URL from response
    const { tracking_number, label_url, shipment_id } = extractBookingDetails(
      bookingResponse,
      courier.courier_code
    );

    // Update order with tracking info
    await pool.query(
      `UPDATE orders 
       SET tracking_number = $1,
           shipment_id = $2,
           order_status = 'confirmed',
           updated_at = NOW()
       WHERE order_id = $3`,
      [tracking_number, shipment_id, order_id]
    );

    // Store shipment booking record
    await pool.query(
      `INSERT INTO shipment_bookings (
        booking_id,
        order_id,
        courier_id,
        tracking_number,
        shipment_id,
        service_type,
        label_url,
        booking_response,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        crypto.randomUUID(),
        order_id,
        courier_id,
        tracking_number,
        shipment_id,
        service_type,
        label_url,
        JSON.stringify(bookingResponse),
        security.user?.id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Shipment booked successfully',
      booking: {
        order_id,
        courier: courier.courier_name,
        tracking_number,
        shipment_id,
        label_url,
        service_type,
        estimated_delivery: bookingResponse.estimated_delivery || null
      }
    });

  } catch (error: any) {
    console.error('Shipment booking error:', error);

    // Log failed booking
    await pool.query(
      `INSERT INTO shipment_booking_errors (
        error_id,
        order_id,
        courier_id,
        error_message,
        error_details,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        crypto.randomUUID(),
        order_id,
        courier_id,
        error.message,
        JSON.stringify({ stack: error.stack, response: error.response?.data })
      ]
    );

    return res.status(500).json({
      error: 'Failed to book shipment',
      message: error.message,
      courier: courier_id
    });
  }
}

// =====================================================
// COURIER-SPECIFIC BOOKING BUILDERS
// =====================================================

/**
 * Build PostNord booking request
 * API: https://developer.postnord.com/api/docs/booking
 * Format: PostNord Business Location API v5
 */
function buildPostNordBooking(order: any, pickup: any, delivery: any, pkg: any, serviceType: string, parcelShopId?: string) {
  // PostNord requires weight in grams
  const weightInGrams = Math.round((pkg.weight || 1) * 1000);
  
  return {
    order: {
      senderParty: {
        partyId: process.env.POSTNORD_CUSTOMER_NUMBER || 'PERFORMILE',
        name: pickup.name || 'Performile Merchant',
        address: {
          streetName: pickup.street || pickup.address_line_1,
          streetNumber: pickup.street_number || '',
          postalCode: pickup.postal_code,
          city: pickup.city,
          countryCode: pickup.country || 'SE'
        },
        contact: {
          name: pickup.contact_name || pickup.name,
          email: pickup.email,
          phone: pickup.phone
        }
      },
      recipientParty: {
        name: delivery.name,
        address: {
          streetName: delivery.street || delivery.address_line_1,
          streetNumber: delivery.street_number || '',
          postalCode: delivery.postal_code,
          city: delivery.city,
          countryCode: delivery.country || 'SE'
        },
        contact: {
          name: delivery.contact_name || delivery.name,
          email: delivery.email,
          phone: delivery.phone
        }
      },
      parcels: [{
        weight: weightInGrams,
        volume: {
          length: pkg.length || 30,
          width: pkg.width || 20,
          height: pkg.height || 10
        },
        contents: pkg.description || 'Package',
        valueAmount: pkg.value || 0,
        valueCurrency: 'SEK'
      }],
      service: {
        id: getPostNordServiceId(serviceType),
        addOns: []
      },
      ...(parcelShopId && { 
        servicePoint: {
          id: parcelShopId
        }
      }),
      orderReference: order.order_number || order.order_id
    }
  };
}

/**
 * Get PostNord service ID based on service type
 * https://developer.postnord.com/api/docs/services
 */
function getPostNordServiceId(serviceType: string): string {
  const serviceMap: Record<string, string> = {
    'home_delivery': '17', // Varubrev 1:a-klass
    'parcel_shop': '19',   // MyPack Collect
    'parcel_locker': '19', // MyPack Collect (includes lockers)
    'express': '14'        // Express Parcel
  };
  
  return serviceMap[serviceType] || '17';
}

function buildBringBooking(order: any, pickup: any, delivery: any, pkg: any, serviceType: string, parcelShopId?: string) {
  return {
    schemaVersion: 1,
    consignments: [{
      shippingDateTime: new Date().toISOString(),
      parties: {
        sender: {
          name: pickup.name,
          addressLine: pickup.street,
          postalCode: pickup.postal_code,
          city: pickup.city,
          countryCode: pickup.country || 'NO',
          contact: {
            name: pickup.name,
            email: pickup.email,
            phoneNumber: pickup.phone
          }
        },
        recipient: {
          name: delivery.name,
          addressLine: delivery.street,
          postalCode: delivery.postal_code,
          city: delivery.city,
          countryCode: delivery.country || 'NO',
          contact: {
            name: delivery.name,
            email: delivery.email,
            phoneNumber: delivery.phone
          }
        }
      },
      product: {
        id: serviceType === 'parcel_shop' ? 'SERVICEPAKKE' : 'PAKKE_I_POSTKASSEN',
        customerNumber: process.env.BRING_CUSTOMER_NUMBER
      },
      packages: [{
        weightInKg: pkg.weight,
        dimensions: {
          heightInCm: pkg.height,
          widthInCm: pkg.width,
          lengthInCm: pkg.length
        }
      }],
      ...(parcelShopId && { pickupPoint: { id: parcelShopId } })
    }]
  };
}

function buildDHLBooking(order: any, pickup: any, delivery: any, pkg: any, serviceType: string) {
  return {
    plannedShippingDateAndTime: new Date().toISOString(),
    pickup: {
      isRequested: false
    },
    productCode: serviceType === 'parcel_shop' ? 'N' : 'P',
    accounts: [{
      typeCode: 'shipper',
      number: process.env.DHL_ACCOUNT_NUMBER
    }],
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: pickup.postal_code,
          cityName: pickup.city,
          countryCode: pickup.country || 'SE',
          addressLine1: pickup.street
        },
        contactInformation: {
          email: pickup.email,
          phone: pickup.phone,
          companyName: pickup.name,
          fullName: pickup.name
        }
      },
      receiverDetails: {
        postalAddress: {
          postalCode: delivery.postal_code,
          cityName: delivery.city,
          countryCode: delivery.country || 'SE',
          addressLine1: delivery.street
        },
        contactInformation: {
          email: delivery.email,
          phone: delivery.phone,
          companyName: delivery.name,
          fullName: delivery.name
        }
      }
    },
    content: {
      packages: [{
        weight: pkg.weight,
        dimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height
        }
      }],
      isCustomsDeclarable: false,
      declaredValue: pkg.value || 0,
      declaredValueCurrency: 'SEK',
      incoterm: 'DAP'
    }
  };
}

function buildUPSBooking(order: any, pickup: any, delivery: any, pkg: any, serviceType: string) {
  return {
    ShipmentRequest: {
      Shipment: {
        Shipper: {
          Name: pickup.name,
          Address: {
            AddressLine: pickup.street,
            City: pickup.city,
            PostalCode: pickup.postal_code,
            CountryCode: pickup.country || 'SE'
          }
        },
        ShipTo: {
          Name: delivery.name,
          Address: {
            AddressLine: delivery.street,
            City: delivery.city,
            PostalCode: delivery.postal_code,
            CountryCode: delivery.country || 'SE'
          }
        },
        Service: {
          Code: serviceType === 'parcel_shop' ? '11' : '07' // 11 = UPS Standard, 07 = Express
        },
        Package: {
          PackagingType: {
            Code: '02' // Customer Supplied Package
          },
          Dimensions: {
            UnitOfMeasurement: { Code: 'CM' },
            Length: pkg.length.toString(),
            Width: pkg.width.toString(),
            Height: pkg.height.toString()
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: 'KGS' },
            Weight: pkg.weight.toString()
          }
        }
      }
    }
  };
}

// =====================================================
// RESPONSE EXTRACTORS
// =====================================================

function extractBookingDetails(response: any, courierCode: string) {
  switch (courierCode?.toUpperCase()) {
    case 'POSTNORD':
      return {
        tracking_number: response.shipmentId || response.trackingNumber,
        label_url: response.labelUrl || response.labels?.[0]?.url,
        shipment_id: response.shipmentId
      };

    case 'BRING':
      return {
        tracking_number: response.consignments?.[0]?.confirmation?.consignmentNumber,
        label_url: response.consignments?.[0]?.confirmation?.links?.labels,
        shipment_id: response.consignments?.[0]?.confirmation?.consignmentNumber
      };

    case 'DHL':
      return {
        tracking_number: response.shipmentTrackingNumber,
        label_url: response.documents?.[0]?.url,
        shipment_id: response.shipmentTrackingNumber
      };

    case 'UPS':
      return {
        tracking_number: response.ShipmentResponse?.ShipmentResults?.PackageResults?.TrackingNumber,
        label_url: response.ShipmentResponse?.ShipmentResults?.PackageResults?.ShippingLabel?.GraphicImage,
        shipment_id: response.ShipmentResponse?.ShipmentResults?.ShipmentIdentificationNumber
      };

    default:
      return {
        tracking_number: response.tracking_number || response.trackingNumber,
        label_url: response.label_url || response.labelUrl,
        shipment_id: response.shipment_id || response.shipmentId
      };
  }
}
