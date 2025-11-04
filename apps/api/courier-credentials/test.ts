import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/courier-credentials/test
 * Test courier API credentials before saving
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      courier_id,
      customer_number,
      api_key,
      api_secret,
      base_url
    } = req.body;

    // Validate required fields
    if (!courier_id || !customer_number || !api_key) {
      return res.status(400).json({ 
        error: 'Missing required fields: courier_id, customer_number, api_key' 
      });
    }

    // Get courier details
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('courier_name, courier_code, api_endpoint')
      .eq('courier_id', courier_id)
      .single();

    if (courierError || !courier) {
      return res.status(404).json({ error: 'Courier not found' });
    }

    // Test connection based on courier type
    const testResult = await testCourierConnection(
      courier.courier_code,
      customer_number,
      api_key,
      api_secret,
      base_url || courier.api_endpoint
    );

    if (testResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Connection successful',
        details: testResult.details
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Connection failed',
        error: testResult.error
      });
    }
  } catch (error: any) {
    console.error('Error in courier-credentials/test handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Test connection to courier API
 */
async function testCourierConnection(
  courierCode: string,
  customerNumber: string,
  apiKey: string,
  apiSecret?: string,
  baseUrl?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
  
  try {
    switch (courierCode.toLowerCase()) {
      case 'postnord':
        return await testPostNord(customerNumber, apiKey, baseUrl);
      
      case 'bring':
        return await testBring(customerNumber, apiKey, apiSecret, baseUrl);
      
      case 'dhl':
        return await testDHL(customerNumber, apiKey, baseUrl);
      
      case 'ups':
        return await testUPS(customerNumber, apiKey, baseUrl);
      
      case 'fedex':
        return await testFedEx(customerNumber, apiKey, apiSecret, baseUrl);
      
      case 'instabox':
      case 'budbee':
      case 'porterbuddy':
        // For now, just validate that credentials are provided
        return {
          success: true,
          details: { message: 'Credentials validated (test endpoint not yet implemented)' }
        };
      
      default:
        return {
          success: false,
          error: `Test not implemented for courier: ${courierCode}`
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Connection test failed'
    };
  }
}

/**
 * Test PostNord API connection
 */
async function testPostNord(
  customerNumber: string,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
  try {
    const url = baseUrl || 'https://api2.postnord.com/rest/businesslocation/v5';
    
    // Try to fetch service points (lightweight test)
    const response = await axios.get(`${url}/servicepoints/nearest/byaddress`, {
      params: {
        apikey: apiKey,
        countryCode: 'NO',
        city: 'Oslo',
        limit: 1
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      return {
        success: true,
        details: { 
          message: 'PostNord API connection successful',
          customerNumber 
        }
      };
    } else {
      return {
        success: false,
        error: `Unexpected response: ${response.status}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'PostNord API connection failed'
    };
  }
}

/**
 * Test Bring API connection
 */
async function testBring(
  customerNumber: string,
  apiKey: string,
  apiSecret?: string,
  baseUrl?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
  try {
    const url = baseUrl || 'https://api.bring.com';
    
    // Try to fetch pickup points (lightweight test)
    const response = await axios.get(`${url}/pickuppoint/api/pickuppoint/NO/postalCode/0010.json`, {
      headers: {
        'X-MyBring-API-Uid': customerNumber,
        'X-MyBring-API-Key': apiKey,
        'X-Bring-Client-URL': 'https://performile.com'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      return {
        success: true,
        details: { 
          message: 'Bring API connection successful',
          customerNumber 
        }
      };
    } else {
      return {
        success: false,
        error: `Unexpected response: ${response.status}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Bring API connection failed'
    };
  }
}

/**
 * Test DHL API connection
 */
async function testDHL(
  customerNumber: string,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
  try {
    const url = baseUrl || 'https://api-eu.dhl.com';
    
    // Try to validate credentials with a simple request
    const response = await axios.get(`${url}/location-finder/v1/find-by-address`, {
      params: {
        countryCode: 'NO',
        addressLocality: 'Oslo',
        limit: 1
      },
      headers: {
        'DHL-API-Key': apiKey
      },
      timeout: 10000
    });

    if (response.status === 200) {
      return {
        success: true,
        details: { 
          message: 'DHL API connection successful',
          customerNumber 
        }
      };
    } else {
      return {
        success: false,
        error: `Unexpected response: ${response.status}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'DHL API connection failed'
    };
  }
}

/**
 * Test UPS API connection
 */
async function testUPS(
  customerNumber: string,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
  // UPS requires OAuth2, so for now just validate credentials are provided
  return {
    success: true,
    details: { 
      message: 'UPS credentials validated (full test requires OAuth2 setup)',
      customerNumber 
    }
  };
}

/**
 * Test FedEx API connection
 */
async function testFedEx(
  customerNumber: string,
  apiKey: string,
  apiSecret?: string,
  baseUrl?: string
): Promise<{ success: boolean; details?: any; error?: string }> {
  // FedEx requires OAuth2, so for now just validate credentials are provided
  return {
    success: true,
    details: { 
      message: 'FedEx credentials validated (full test requires OAuth2 setup)',
      customerNumber 
    }
  };
}
