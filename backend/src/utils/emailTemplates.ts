export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface RatingRequestData {
  customerName: string;
  orderNumber: string;
  courierName: string;
  deliveryDate: string;
  serviceType: string;
  ratingUrl: string;
}

export class EmailTemplates {
  static ratingRequest(data: RatingRequestData): EmailTemplate {
    const serviceTypeLabels: { [key: string]: string } = {
      home_delivery: 'Home Delivery',
      parcelshop: 'Parcel Shop',
      parcellocker: 'Parcel Locker',
      pickup_point: 'Pickup Point',
      office_delivery: 'Office Delivery'
    };

    const serviceLabel = serviceTypeLabels[data.serviceType] || data.serviceType;

    return {
      subject: `Rate Your ${serviceLabel} Experience - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rate Your Delivery</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #1976d2; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .service-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rate Your Delivery Experience</h1>
            </div>
            
            <div class="content">
              <p>Hi ${data.customerName},</p>
              
              <p>We hope you received your order successfully! Your feedback helps us improve our delivery services.</p>
              
              <div class="service-info">
                <h3>Delivery Details</h3>
                <p><strong>Order:</strong> ${data.orderNumber}</p>
                <p><strong>Courier:</strong> ${data.courierName}</p>
                <p><strong>Service Type:</strong> ${serviceLabel}</p>
                <p><strong>Delivered:</strong> ${data.deliveryDate}</p>
              </div>
              
              <p>Please take a moment to rate your experience and let us know if you received the delivery service you requested:</p>
              
              <div style="text-align: center;">
                <a href="${data.ratingUrl}" class="button">Rate Your Delivery</a>
              </div>
              
              <p><strong>Your feedback helps us:</strong></p>
              <ul>
                <li>Improve courier performance</li>
                <li>Ensure accurate service delivery</li>
                <li>Enhance customer satisfaction</li>
                <li>Optimize delivery methods</li>
              </ul>
              
              <p>This rating link will expire in 30 days.</p>
            </div>
            
            <div class="footer">
              <p>© 2024 Performile - Logistics Performance Platform</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Rate Your Delivery Experience - Order ${data.orderNumber}
        
        Hi ${data.customerName},
        
        We hope you received your order successfully! Your feedback helps us improve our delivery services.
        
        Delivery Details:
        - Order: ${data.orderNumber}
        - Courier: ${data.courierName}
        - Service Type: ${serviceLabel}
        - Delivered: ${data.deliveryDate}
        
        Please rate your experience: ${data.ratingUrl}
        
        Your feedback helps us improve courier performance, ensure accurate service delivery, enhance customer satisfaction, and optimize delivery methods.
        
        This rating link will expire in 30 days.
        
        © 2024 Performile - Logistics Performance Platform
      `
    };
  }

  static ratingReminder(data: RatingRequestData): EmailTemplate {
    return {
      subject: `Reminder: Rate Your Delivery - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rating Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #ff9800; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Don't Forget to Rate Your Delivery</h1>
            </div>
            
            <div class="content">
              <p>Hi ${data.customerName},</p>
              
              <p>We noticed you haven't rated your recent delivery yet. Your feedback is valuable to us!</p>
              
              <p><strong>Order ${data.orderNumber}</strong> delivered by ${data.courierName}</p>
              
              <div style="text-align: center;">
                <a href="${data.ratingUrl}" class="button">Rate Now - Takes 2 Minutes</a>
              </div>
              
              <p>If you don't provide feedback, we'll assume you were satisfied with the service (70% satisfaction rating).</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reminder: Rate Your Delivery - Order ${data.orderNumber}
        
        Hi ${data.customerName},
        
        We noticed you haven't rated your recent delivery yet. Your feedback is valuable to us!
        
        Order ${data.orderNumber} delivered by ${data.courierName}
        
        Rate now: ${data.ratingUrl}
        
        If you don't provide feedback, we'll assume you were satisfied with the service.
      `
    };
  }
}
