const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Test data for each email type
const testEmails = {
  orderConfirmation: {
    to: 'test@example.com', // Replace with your test email
    subject: 'Order Confirmation - Performile',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Order Confirmation</h2>
        <p>Dear Test User,</p>
        <p>Thank you for your order! Your delivery request has been confirmed.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> TEST-12345</p>
          <p><strong>Courier:</strong> Test Courier Service</p>
          <p><strong>Service Type:</strong> Express Delivery</p>
          <p><strong>Pickup Address:</strong> 123 Test St, Test City</p>
          <p><strong>Delivery Address:</strong> 456 Delivery Ave, Test City</p>
          <p><strong>Estimated Delivery:</strong> Tomorrow by 6 PM</p>
        </div>
        
        <p>You will receive updates as your order progresses.</p>
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  },
  orderStatusUpdate: {
    to: 'test@example.com', // Replace with your test email
    subject: 'Order Status Update - Performile',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Order Status Update</h2>
        <p>Dear Test User,</p>
        <p>Your order status has been updated.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order #TEST-12345</h3>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">In Transit</span></p>
          <p><strong>Update:</strong> Your package is on its way to the delivery address.</p>
          <p><strong>Track Your Order:</strong> <a href="https://performile.com/track/TEST-12345">Click here</a></p>
        </div>
        
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  },
  leadPurchaseNotification: {
    to: 'test@example.com', // Replace with your test email
    subject: 'New Lead Purchase - Performile',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">New Lead Purchase</h2>
        <p>Dear Test Courier,</p>
        <p>Great news! You have a new lead purchase.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Lead Details</h3>
          <p><strong>Company:</strong> Test Company</p>
          <p><strong>Contact:</strong> John Doe</p>
          <p><strong>Email:</strong> john@testcompany.com</p>
          <p><strong>Phone:</strong> +1234567890</p>
          <p><strong>Service Type:</strong> Same-day Delivery</p>
          <p><strong>Location:</strong> Test City</p>
          <p><strong>Estimated Value:</strong> $150</p>
        </div>
        
        <p>Please contact this lead within 24 hours for the best conversion rate.</p>
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  },
  courierWelcome: {
    to: 'test@example.com', // Replace with your test email
    subject: 'Welcome to Performile - Complete Your Profile',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Welcome to Performile!</h2>
        <p>Dear Test Courier,</p>
        <p>Thank you for joining Performile! We're excited to have you on board.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps</h3>
          <p>1. Complete your courier profile</p>
          <p>2. Set up your service areas</p>
          <p>3. Start receiving delivery requests</p>
          <p style="margin-top: 15px;">
            <a href="https://performile.com/courier/dashboard" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </p>
        </div>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  }
};

// Send test emails
async function sendTestEmails() {
  try {
    for (const [emailType, email] of Object.entries(testEmails)) {
      console.log(`Sending ${emailType} email...`);
      const { data, error } = await resend.emails.send({
        from: 'Performile <noreply@performile.com>', // Make sure this is a verified domain in Resend
        to: email.to,
        subject: email.subject,
        html: email.html,
      });

      if (error) {
        console.error(`Error sending ${emailType}:`, error);
      } else {
        console.log(`✅ ${emailType} sent successfully!`);
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
      // Add a small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error sending test emails:', error);
  }
}

// Run the test
sendTestEmails();
