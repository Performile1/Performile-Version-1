import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface TemplateData {
  [key: string]: any;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  private fromName: string;

  private constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@performile.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Performile';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email using configured provider (SendGrid, AWS SES, etc.)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      logger.info('[Email] Sending email', {
        to: options.to,
        subject: options.subject
      });

      // TODO: Implement actual email sending with SendGrid/AWS SES
      // For now, log the email
      if (process.env.NODE_ENV === 'development') {
        logger.info('[Email] Email content (dev mode)', {
          to: options.to,
          subject: options.subject,
          html: options.html.substring(0, 200) + '...'
        });
      }

      // In production, use actual email service:
      // await sendgrid.send({
      //   to: options.to,
      //   from: options.from || this.fromEmail,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text
      // });

      return true;
    } catch (error) {
      logger.error('[Email] Failed to send email', error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, firstName: string, userRole: string): Promise<boolean> {
    const subject = 'Welcome to Performile!';
    const html = this.getWelcomeTemplate(firstName, userRole);

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(
    email: string,
    inviterName: string,
    entityName: string,
    entityType: 'courier' | 'store',
    invitationToken: string
  ): Promise<boolean> {
    const subject = `You've been invited to join ${entityName} on Performile`;
    const acceptUrl = `${process.env.FRONTEND_URL}/team/accept-invitation/${invitationToken}`;
    
    const html = this.getTeamInvitationTemplate(
      inviterName,
      entityName,
      entityType,
      acceptUrl
    );

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(
    email: string,
    firstName: string,
    tier: number,
    amount: number,
    billingCycle: string
  ): Promise<boolean> {
    const subject = 'Subscription Confirmed - Performile';
    const html = this.getSubscriptionConfirmationTemplate(
      firstName,
      tier,
      amount,
      billingCycle
    );

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedEmail(
    email: string,
    firstName: string,
    amount: number
  ): Promise<boolean> {
    const subject = 'Payment Failed - Action Required';
    const html = this.getPaymentFailedTemplate(firstName, amount);

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send subscription cancelled confirmation
   */
  async sendSubscriptionCancelledEmail(
    email: string,
    firstName: string,
    endDate: Date
  ): Promise<boolean> {
    const subject = 'Subscription Cancelled - Performile';
    const html = this.getSubscriptionCancelledTemplate(firstName, endDate);

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send review request email
   */
  async sendReviewRequestEmail(
    email: string,
    orderNumber: string,
    courierName: string,
    reviewToken: string
  ): Promise<boolean> {
    const subject = `How was your delivery with ${courierName}?`;
    const reviewUrl = `${process.env.FRONTEND_URL}/review/${reviewToken}`;
    
    const html = this.getReviewRequestTemplate(
      orderNumber,
      courierName,
      reviewUrl
    );

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send document verification notification
   */
  async sendDocumentVerificationEmail(
    email: string,
    firstName: string,
    documentType: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ): Promise<boolean> {
    const subject = `Document ${status === 'verified' ? 'Verified' : 'Rejected'} - Performile`;
    const html = this.getDocumentVerificationTemplate(
      firstName,
      documentType,
      status,
      rejectionReason
    );

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(
    email: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string
  ): Promise<boolean> {
    const subject = `Order ${orderNumber} - Status Update`;
    const html = this.getOrderStatusTemplate(orderNumber, status, trackingNumber);

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const subject = 'Reset Your Password - Performile';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const html = this.getPasswordResetTemplate(resetUrl);

    return this.sendEmail({ to: email, subject, html });
  }

  // ==================== EMAIL TEMPLATES ====================

  private getWelcomeTemplate(firstName: string, userRole: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Performile!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Welcome to Performile - the logistics performance platform that helps you optimize your delivery operations.</p>
            <p>As a <strong>${userRole}</strong>, you now have access to:</p>
            <ul>
              ${this.getRoleFeatures(userRole)}
            </ul>
            <p>Get started by completing your profile and exploring the dashboard.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
            <p>support@performile.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTeamInvitationTemplate(
    inviterName: string,
    entityName: string,
    entityType: string,
    acceptUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Team Invitation</h1>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${entityName}</strong> on Performile.</p>
            <p>Join the team to collaborate and access shared resources.</p>
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
            <p><small>This invitation will expire in 7 days.</small></p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSubscriptionConfirmationTemplate(
    firstName: string,
    tier: number,
    amount: number,
    billingCycle: string
  ): string {
    const tierNames = { 1: 'Basic', 2: 'Professional', 3: 'Enterprise' };
    const tierName = tierNames[tier as keyof typeof tierNames] || 'Basic';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .price { font-size: 36px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Subscription Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Your subscription to Performile <strong>${tierName}</strong> has been confirmed!</p>
            <div style="text-align: center; padding: 20px;">
              <div class="price">$${amount}</div>
              <p>Billed ${billingCycle}</p>
            </div>
            <p>You now have access to all ${tierName} features. Visit your dashboard to get started.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentFailedTemplate(firstName: string, amount: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠ Payment Failed</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We were unable to process your payment of <strong>$${amount}</strong>.</p>
            <p>Please update your payment method to continue using Performile without interruption.</p>
            <a href="${process.env.FRONTEND_URL}/billing" class="button">Update Payment Method</a>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSubscriptionCancelledTemplate(firstName: string, endDate: Date): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Your Performile subscription has been cancelled as requested.</p>
            <p>You'll continue to have access to all features until <strong>${endDate.toLocaleDateString()}</strong>.</p>
            <p>We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime.</p>
            <a href="${process.env.FRONTEND_URL}/billing" class="button">Reactivate Subscription</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getReviewRequestTemplate(
    orderNumber: string,
    courierName: string,
    reviewUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .stars { font-size: 30px; color: #fbbf24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>How was your delivery?</h1>
          </div>
          <div class="content">
            <p>Your order <strong>${orderNumber}</strong> was delivered by <strong>${courierName}</strong>.</p>
            <p>We'd love to hear about your experience! Your feedback helps us improve our service.</p>
            <div style="text-align: center; padding: 20px;">
              <div class="stars">★ ★ ★ ★ ★</div>
            </div>
            <a href="${reviewUrl}" class="button">Leave a Review</a>
            <p><small>This should only take a minute!</small></p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDocumentVerificationTemplate(
    firstName: string,
    documentType: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ): string {
    const isVerified = status === 'verified';
    const headerColor = isVerified ? '#10b981' : '#ef4444';
    const icon = isVerified ? '✓' : '✗';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${headerColor}; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icon} Document ${status === 'verified' ? 'Verified' : 'Rejected'}</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Your <strong>${documentType}</strong> has been ${status}.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            ${isVerified ? 
              '<p>You can now access all features that require this document.</p>' :
              '<p>Please upload a new document to continue.</p>'
            }
            <a href="${process.env.FRONTEND_URL}/documents" class="button">View Documents</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getOrderStatusTemplate(
    orderNumber: string,
    status: string,
    trackingNumber?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .status { font-size: 24px; font-weight: bold; color: #2563eb; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          <div class="content">
            <p>Your order <strong>${orderNumber}</strong> status has been updated:</p>
            <div class="status">${status.toUpperCase()}</div>
            ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
            <a href="${process.env.FRONTEND_URL}/orders/${orderNumber}" class="button">Track Order</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password for your Performile account.</p>
            <p>Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p><small>This link will expire in 1 hour.</small></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Performile. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getRoleFeatures(userRole: string): string {
    const features: { [key: string]: string[] } = {
      merchant: [
        'Checkout analytics and insights',
        'Courier performance tracking',
        'Order management',
        'Team collaboration'
      ],
      courier: [
        'Performance analytics',
        'Market insights',
        'Document management',
        'Team management'
      ],
      consumer: [
        'Order tracking',
        'Delivery notifications',
        'Review system',
        'Support access'
      ],
      admin: [
        'Full platform access',
        'User management',
        'Analytics dashboard',
        'System configuration'
      ]
    };

    const roleFeatures = features[userRole] || features.consumer;
    return roleFeatures.map(f => `<li>${f}</li>`).join('');
  }
}

export default EmailService.getInstance();
