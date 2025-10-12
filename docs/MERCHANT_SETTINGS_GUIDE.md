# Merchant Settings - Complete Guide

## Overview

The unified Merchant Settings page consolidates all merchant-specific settings into one organized interface with 12 comprehensive sections.

**Access:** Navigate to `/settings` (for merchants only)

**Last Updated:** October 12, 2025

---

## Settings Sections

### 1. 🏪 Shops

**Purpose:** Manage multiple shops and locations

**Features:**
- Add/edit/delete shops
- Multiple shop support (based on subscription)
- Shop activation/deactivation
- Contact information per shop
- Location details (address, city, postal code, country)
- Website URL and description

**Subscription Limits:**
- **Free:** 1 shop
- **Starter:** 1 shop
- **Professional:** 3 shops
- **Enterprise:** Unlimited shops

**Usage:**
- Each shop can have its own tracking page
- Orders are associated with specific shops
- Shop-specific analytics available

---

### 2. 🚚 Couriers

**Purpose:** Select which couriers appear in your checkout

**Features:**
- Browse 44+ courier companies with logos
- Select couriers for your checkout
- Drag-and-drop reordering
- Custom courier names for branding
- Enable/disable without removing
- Priority levels (normal, recommended, premium)
- Visual usage indicators

**Subscription Limits:**
- **Free:** 2 couriers
- **Starter:** 5 couriers
- **Professional:** 20 couriers
- **Enterprise:** Unlimited couriers

**Key Benefits:**
- Only selected couriers show to customers
- Optimize checkout conversion
- Brand consistency with custom names
- Easy courier management

---

### 3. 📍 Tracking Page

**Purpose:** Customize your branded order tracking page

**Features:**
- **Custom URL:** `yoursite.com/track/your-id`
- **Branding:**
  - Custom logo
  - Primary & secondary colors
  - Page title and header text
  - Custom footer text
- **Display Options:**
  - Show/hide estimated delivery
  - Show/hide courier information
  - Show/hide order history timeline
- **Custom Domain:** (Professional+) `track.yourstore.com`
- **Custom CSS:** (Professional+) Full styling control
- **Integration Options:**
  - Direct link
  - Embedded iframe
  - WooCommerce/Shopify plugins

**How Customers Use It:**
1. Customer receives tracking number
2. Visits your tracking page
3. Enters tracking number
4. Sees real-time order status with your branding

**Embed Code:**
```html
<iframe src="https://yoursite.com/track/your-id" 
        width="100%" 
        height="600" 
        frameborder="0">
</iframe>
```

---

### 4. ⭐ Rating Settings

**Purpose:** Configure automated review requests

**Features:**
- **Automated Review Requests:**
  - Send X days after delivery
  - Customizable delay (0-30 days)
  - Email or SMS delivery
- **Review Reminders:**
  - Send reminder if no response
  - Configurable reminder delay
- **Review Form Customization:**
  - Custom questions
  - Rating scales (1-5 stars)
  - Required vs optional fields
- **Incentives:**
  - Offer discount codes for reviews
  - Loyalty points integration
- **Moderation:**
  - Auto-publish or manual approval
  - Profanity filter
  - Minimum rating threshold

**Best Practices:**
- Wait 2-3 days after delivery
- Keep review form short (5 questions max)
- Offer small incentive (5-10% discount)
- Respond to all reviews

---

### 5. 📧 Email Templates

**Purpose:** Customize email communications

**Available Templates:**
1. **Order Confirmation**
   - Sent immediately after order placed
   - Include order details, tracking link
2. **Shipping Notification**
   - Sent when order ships
   - Include tracking number, courier info
3. **Delivery Confirmation**
   - Sent when order delivered
   - Include review request link
4. **Review Request**
   - Sent X days after delivery
   - Include direct review link
5. **Review Reminder**
   - Sent if no review after Y days
6. **Order Delayed**
   - Sent if delivery delayed
   - Include apology, new ETA
7. **Custom Templates** (Professional+)
   - Create unlimited custom templates

**Customization Options:**
- Subject line
- Email body (HTML editor)
- Logo and branding
- Primary/secondary colors
- Footer text
- Unsubscribe link (required)

**Variables Available:**
- `{customer_name}`
- `{order_number}`
- `{tracking_number}`
- `{courier_name}`
- `{estimated_delivery}`
- `{shop_name}`
- `{shop_url}`

**Example:**
```
Subject: Your order #{order_number} has shipped!

Hi {customer_name},

Great news! Your order from {shop_name} has been shipped 
via {courier_name}.

Track your order: {tracking_link}
Estimated delivery: {estimated_delivery}

Thanks for shopping with us!
```

---

### 6. 📦 Returns (Professional+)

**Purpose:** Manage product returns and RMAs

**Features:**
- **Return Request Form:**
  - Customer-facing return portal
  - Reason for return dropdown
  - Photo upload for damaged items
  - Return shipping label generation
- **Return Policies:**
  - Return window (14, 30, 60, 90 days)
  - Restocking fees
  - Return shipping costs
  - Refund methods
- **RMA Management:**
  - Automatic RMA number generation
  - Return status tracking
  - Quality inspection workflow
  - Refund processing
- **Return Analytics:**
  - Return rate by product
  - Return reasons analysis
  - Cost of returns
  - Return fraud detection

**Return Workflow:**
1. Customer requests return
2. System generates RMA number
3. Return shipping label sent
4. Customer ships item back
5. Merchant receives and inspects
6. Refund processed

**Coming Soon:**
- Automated return label generation
- Integration with return logistics providers
- Instant refunds for trusted customers

---

### 7. 💳 Payments

**Purpose:** Configure payment and billing settings

**Features:**
- **Subscription Management:**
  - Current plan details
  - Usage statistics
  - Upgrade/downgrade options
  - Billing history
- **Payment Methods:**
  - Credit card on file
  - Add/remove payment methods
  - Set default payment method
- **Invoices:**
  - Download past invoices
  - Email invoices
  - Tax information
- **Billing Alerts:**
  - Payment failed notifications
  - Upcoming renewal reminders
  - Usage limit warnings

---

### 8. 🔔 Notifications

**Purpose:** Control notification preferences

**Notification Types:**
- **Email Notifications:**
  - New orders
  - Order status changes
  - Review submissions
  - Low stock alerts
  - Weekly reports
- **SMS Notifications:** (Professional+)
  - Urgent order issues
  - Delivery confirmations
  - Customer inquiries
- **Push Notifications:**
  - Browser notifications
  - Real-time order updates
- **Slack/Teams Integration:** (Professional+)
  - Order notifications to Slack
  - Team collaboration

**Frequency Settings:**
- Instant
- Hourly digest
- Daily digest
- Weekly summary

---

### 9. 🔌 API & Integrations (Professional+)

**Purpose:** Connect with external systems

**Features:**
- **API Keys:**
  - Generate API keys
  - Manage key permissions
  - View API usage
  - Rate limits
- **Webhooks:**
  - Configure webhook endpoints
  - Event subscriptions
  - Retry logic
  - Webhook logs
- **E-commerce Platforms:**
  - WooCommerce plugin
  - Shopify app
  - Magento extension
  - Custom API integration
- **Shipping Carriers:**
  - DHL API integration
  - FedEx API integration
  - UPS API integration
  - PostNord API integration
- **Other Integrations:**
  - Zapier
  - Make.com
  - Google Sheets
  - Slack/Teams

**API Documentation:**
- RESTful API
- Authentication via Bearer token
- Rate limits: 1000 requests/hour (Professional), Unlimited (Enterprise)
- Webhooks for real-time updates

---

### 10. ⚙️ General

**Purpose:** Basic account settings

**Features:**
- **Profile Information:**
  - Name, email, phone
  - Company name
  - Profile photo
  - Bio/description
- **Business Information:**
  - Business type
  - Tax ID/VAT number
  - Business address
  - Business hours
- **Account Status:**
  - Account creation date
  - Last login
  - Account verification status
- **Data Export:**
  - Export all data (GDPR)
  - Download order history
  - Download customer data

---

### 11. 🔒 Security

**Purpose:** Account security settings

**Features:**
- **Password Management:**
  - Change password
  - Password strength indicator
  - Password history
- **Two-Factor Authentication (2FA):**
  - Enable/disable 2FA
  - SMS or authenticator app
  - Backup codes
- **Session Management:**
  - Active sessions list
  - Logout from all devices
  - Session timeout settings
- **Login History:**
  - Recent login attempts
  - IP addresses
  - Device information
  - Suspicious activity alerts
- **API Security:**
  - API key rotation
  - IP whitelist
  - Rate limiting

---

### 12. 🌍 Preferences

**Purpose:** Personalization settings

**Features:**
- **Language:**
  - English, Swedish, Norwegian, Danish, Finnish
  - German, French, Spanish, Italian
- **Timezone:**
  - Automatic detection
  - Manual selection
  - Display times in local timezone
- **Currency:**
  - USD, EUR, GBP, SEK, NOK, DKK
  - Automatic conversion
  - Display format
- **Date & Time Format:**
  - MM/DD/YYYY or DD/MM/YYYY
  - 12-hour or 24-hour time
- **Number Format:**
  - Decimal separator (. or ,)
  - Thousands separator
- **Theme:**
  - Light mode
  - Dark mode
  - Auto (system preference)

---

## Additional Settings Ideas

### Suggested Future Additions:

1. **📊 Analytics Settings**
   - Google Analytics integration
   - Custom event tracking
   - Data retention period
   - Privacy compliance

2. **👥 Team Management**
   - Invite team members
   - Role-based permissions
   - Activity logs
   - Team notifications

3. **🎨 Branding**
   - Brand colors
   - Logo management
   - Email signatures
   - Social media links

4. **📱 Mobile App Settings**
   - Push notification preferences
   - Offline mode
   - Data sync settings

5. **🤖 Automation**
   - Auto-respond to reviews
   - Auto-tag orders
   - Auto-assign couriers
   - Workflow automation

6. **📈 Reports**
   - Scheduled reports
   - Custom report builder
   - Export formats
   - Report recipients

7. **🌐 Multi-language**
   - Translate tracking page
   - Translate emails
   - Translate product descriptions

8. **💬 Customer Communication**
   - Live chat settings
   - Chatbot configuration
   - Canned responses
   - Auto-replies

9. **🎁 Loyalty Program**
   - Points system
   - Reward tiers
   - Referral program
   - Discount codes

10. **📦 Inventory**
    - Low stock alerts
    - Reorder points
    - Supplier management
    - Stock sync settings

---

## Implementation Checklist

- [x] Create unified MerchantSettings page
- [x] Implement Shops settings
- [x] Implement Couriers settings
- [x] Implement Tracking Page settings
- [ ] Implement Rating settings
- [ ] Implement Email Templates settings
- [ ] Implement Returns settings (Professional+)
- [ ] Implement Payment settings
- [ ] Implement Notification settings
- [ ] Implement API settings (Professional+)
- [ ] Implement General settings
- [ ] Implement Security settings
- [ ] Implement Preferences settings

---

## Navigation

**URL Structure:**
- `/settings` - Main settings page (defaults to Shops tab)
- `/settings#shops` - Shops tab
- `/settings#couriers` - Couriers tab
- `/settings#tracking` - Tracking page tab
- `/settings#ratings` - Rating settings tab
- `/settings#emails` - Email templates tab
- `/settings#returns` - Returns tab
- `/settings#payments` - Payments tab
- `/settings#notifications` - Notifications tab
- `/settings#api` - API & Integrations tab
- `/settings#general` - General settings tab
- `/settings#security` - Security tab
- `/settings#preferences` - Preferences tab

**Deep Linking:**
You can link directly to any tab using the hash in the URL.

---

## Best Practices

1. **Save Frequently:** Changes are not auto-saved
2. **Test Tracking Page:** Preview before publishing
3. **Review Email Templates:** Send test emails
4. **Monitor API Usage:** Check rate limits
5. **Enable 2FA:** Protect your account
6. **Regular Backups:** Export data monthly
7. **Update Contact Info:** Keep email/phone current
8. **Check Notifications:** Don't miss important alerts

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Maintained by:** Performile Development Team
