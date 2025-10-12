# Performile Platform - Admin Guide

**Version:** 1.0  
**Last Updated:** October 11, 2025  
**For:** Platform Administrators

---

## 📖 Table of Contents

1. [Admin Panel Overview](#admin-panel-overview)
2. [User Management](#user-management)
3. [Courier Management](#courier-management)
4. [Store Management](#store-management)
5. [Order Management](#order-management)
6. [Subscription Management](#subscription-management)
7. [Analytics & Reports](#analytics--reports)
8. [System Settings](#system-settings)
9. [Security & Audit](#security--audit)
10. [Troubleshooting](#troubleshooting)

---

## 🎛️ Admin Panel Overview

### Accessing Admin Panel

1. **Login as Admin**
   - Use admin credentials
   - Navigate to `/admin` route
   - Or click "Admin Panel" in user menu

2. **Admin Dashboard**
   - Platform statistics
   - Recent activity
   - System health
   - Quick actions

### Admin Permissions

**Super Admin:**
- Full system access
- User management
- System configuration
- Billing management

**Admin:**
- User management
- Content moderation
- Support functions
- Limited system settings

**Moderator:**
- Content moderation
- Review management
- Basic support

---

## 👥 User Management

### Viewing Users

1. **Navigate to Admin → Users**
2. **View User List:**
   - User ID
   - Name
   - Email
   - Role (Merchant, Courier, Admin)
   - Status (Active, Suspended, Pending)
   - Registration Date
   - Last Login

### Searching Users

**Search Options:**
- By email
- By name
- By user ID
- By company name

**Filters:**
- Role type
- Account status
- Registration date range
- Subscription plan

### Creating Users

1. **Click "Add User"**
2. **Fill User Details:**
   - Email address
   - First name
   - Last name
   - Role (Merchant/Courier/Admin)
   - Company name
   - Phone number

3. **Set Initial Password**
   - Generate random password
   - Or set custom password
   - Send welcome email

4. **Assign Permissions**
   - Select role
   - Set access level
   - Configure restrictions

5. **Save User**

### Editing Users

1. **Click on User Row**
2. **Modify Details:**
   - Contact information
   - Company details
   - Role/permissions
   - Account status

3. **Save Changes**
4. **User is notified** of changes

### Suspending Users

**Reasons to Suspend:**
- Policy violations
- Payment issues
- Suspicious activity
- User request

**Process:**
1. Click "Suspend" on user profile
2. Select reason
3. Add notes (internal)
4. Confirm suspension

**Effects:**
- User cannot login
- API access revoked
- Data retained
- Can be reactivated

### Deleting Users

**Warning:** Permanent action!

**Process:**
1. Click "Delete" on user profile
2. Confirm deletion
3. Choose data retention:
   - Delete all data
   - Anonymize data
   - Archive data (30 days)

4. Final confirmation required

**GDPR Compliance:**
- User data deleted within 30 days
- Audit trail maintained
- Compliance logs generated

### Resetting Passwords

1. **Go to User Profile**
2. **Click "Reset Password"**
3. **Options:**
   - Send reset email to user
   - Generate temporary password
   - Set new password manually

4. **User receives notification**

### Viewing User Activity

1. **Click "Activity Log"** on user profile
2. **View:**
   - Login history
   - Orders created
   - Reviews submitted
   - API calls made
   - Settings changed

3. **Export Activity:**
   - CSV format
   - Date range filter
   - Activity type filter

---

## 🚚 Courier Management

### Viewing Couriers

1. **Navigate to Admin → Couriers**
2. **View Courier List:**
   - Courier name
   - Trust Score
   - Total deliveries
   - Success rate
   - Status (Active/Inactive)
   - Registration date

### Approving New Couriers

**Courier Registration Process:**
1. Courier submits application
2. Admin reviews application
3. Verify documents
4. Approve or reject

**Review Checklist:**
- [ ] Business license verified
- [ ] Insurance documents valid
- [ ] Service areas confirmed
- [ ] Pricing information complete
- [ ] Contact details verified

**Approval:**
1. Click "Review Application"
2. Check all documents
3. Click "Approve" or "Reject"
4. Add notes
5. Courier is notified

### Editing Courier Profiles

1. **Click on Courier**
2. **Edit Information:**
   - Company details
   - Service areas
   - Delivery types
   - Pricing
   - Contact information

3. **Update Trust Score Manually** (if needed)
4. **Save Changes**

### Managing Courier Performance

**Monitor Metrics:**
- On-time delivery rate
- Completion rate
- Customer ratings
- Response time
- Issue resolution

**Performance Actions:**
1. **Warning:** Send warning for poor performance
2. **Suspension:** Temporary suspension
3. **Termination:** Remove from platform

**Performance Improvement Plan:**
1. Identify issues
2. Set improvement goals
3. Monitor progress
4. Review after 30 days

### Courier Verification

**Verification Levels:**
- ✅ **Verified:** All documents approved
- ⚠️ **Pending:** Awaiting verification
- ❌ **Unverified:** Missing documents

**Documents Required:**
- Business registration
- Insurance certificate
- Vehicle documentation
- Driver licenses
- Tax documents

**Verification Process:**
1. Review submitted documents
2. Verify authenticity
3. Check expiry dates
4. Update verification status
5. Request missing documents

---

## 🏪 Store Management

### Viewing Stores

1. **Navigate to Admin → Stores**
2. **View Store List:**
   - Store name
   - Merchant
   - Location
   - Total orders
   - Status

### Creating Stores

1. **Click "Add Store"**
2. **Fill Details:**
   - Store name
   - Merchant (owner)
   - Address
   - Contact information
   - Operating hours

3. **Save Store**

### Editing Stores

1. **Click on Store**
2. **Modify Information**
3. **Save Changes**

### Deactivating Stores

1. **Click "Deactivate"**
2. **Reason:** Closed, merged, etc.
3. **Existing orders:** Continue processing
4. **New orders:** Disabled

---

## 📦 Order Management

### Viewing All Orders

1. **Navigate to Admin → Orders**
2. **View Complete Order List:**
   - All merchants
   - All couriers
   - All statuses

### Advanced Filtering

**Filter by:**
- Merchant
- Courier
- Status
- Date range
- Location
- Service type
- Value range

### Manually Creating Orders

**Use Cases:**
- Customer service requests
- System migrations
- Testing

**Process:**
1. Click "Create Order"
2. Select merchant
3. Fill order details
4. Assign courier
5. Set status
6. Save order

### Editing Orders

**Admin Override:**
- Change any field
- Update status
- Reassign courier
- Modify dates
- Add notes

**Audit Trail:**
- All changes logged
- Admin user recorded
- Timestamp captured
- Reason required

### Resolving Order Issues

**Common Issues:**
- Delivery delays
- Lost packages
- Damaged items
- Address errors
- Customer complaints

**Resolution Process:**
1. Review order details
2. Contact courier
3. Contact merchant
4. Investigate issue
5. Determine resolution
6. Update order status
7. Document resolution

### Refund Management

1. **Review refund request**
2. **Verify eligibility**
3. **Process refund:**
   - Full refund
   - Partial refund
   - Store credit

4. **Update order status**
5. **Notify parties**

---

## 💳 Subscription Management

### Viewing Subscriptions

1. **Navigate to Admin → Subscriptions**
2. **View All Subscriptions:**
   - User/Company
   - Plan type
   - Status (Active, Cancelled, Past Due)
   - MRR (Monthly Recurring Revenue)
   - Next billing date

### Subscription Analytics

**Metrics:**
- Total active subscriptions
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn rate
- Upgrade/downgrade trends
- Plan distribution

### Managing User Subscriptions

**Actions Available:**
1. **Upgrade Plan:** Move to higher tier
2. **Downgrade Plan:** Move to lower tier
3. **Cancel Subscription:** End subscription
4. **Pause Subscription:** Temporary hold
5. **Apply Discount:** Custom pricing
6. **Extend Trial:** Add trial days

### Handling Payment Issues

**Past Due Subscriptions:**
1. Automatic retry (3 attempts)
2. Email notifications sent
3. Grace period (7 days)
4. Downgrade to free plan
5. Account suspension

**Manual Resolution:**
1. Contact customer
2. Update payment method
3. Retry payment manually
4. Apply credit if needed
5. Reactivate subscription

### Creating Custom Plans

**For Enterprise Customers:**
1. Click "Create Custom Plan"
2. Set pricing
3. Define features
4. Set limits
5. Assign to customer

### Discount & Coupon Management

**Create Discount Codes:**
1. Navigate to Billing → Discounts
2. Click "Create Discount"
3. Set parameters:
   - Code name
   - Discount type (%, fixed amount)
   - Duration (once, forever, months)
   - Restrictions
   - Expiry date

4. Save discount code

**Apply Discounts:**
1. Go to user subscription
2. Click "Apply Discount"
3. Select or enter code
4. Confirm application

---

## 📊 Analytics & Reports

### Platform Analytics

**Key Metrics:**
- Total users (Merchants, Couriers)
- Total orders
- Total revenue
- Active subscriptions
- Platform usage

**Growth Metrics:**
- New user signups
- User retention rate
- Order volume growth
- Revenue growth
- Churn rate

### Generating Reports

**Available Reports:**
1. **User Activity Report**
   - Signups, logins, engagement
   - Export: CSV, PDF

2. **Order Report**
   - Volume, success rate, trends
   - Export: CSV, Excel

3. **Revenue Report**
   - MRR, ARR, by plan
   - Export: CSV, PDF

4. **Courier Performance Report**
   - Trust Scores, delivery metrics
   - Export: CSV, PDF

5. **Custom Reports**
   - Build your own
   - Select metrics
   - Set date ranges
   - Schedule delivery

### Scheduled Reports

**Automate Reporting:**
1. Navigate to Reports → Scheduled
2. Click "Create Schedule"
3. Select report type
4. Set frequency (daily, weekly, monthly)
5. Add recipients
6. Save schedule

**Reports delivered via email**

### Exporting Data

**Bulk Data Export:**
1. Navigate to Admin → Data Export
2. Select data type:
   - Users
   - Orders
   - Reviews
   - Subscriptions
   - All data

3. Select date range
4. Choose format (CSV, JSON)
5. Request export
6. Download link sent via email

---

## ⚙️ System Settings

### General Settings

**Platform Configuration:**
- Platform name
- Logo
- Primary color
- Contact email
- Support phone
- Terms of Service URL
- Privacy Policy URL

### Email Settings

**SMTP Configuration:**
- Email provider (SendGrid, Resend)
- API key
- From email
- From name
- Reply-to email

**Email Templates:**
- Welcome email
- Password reset
- Order confirmation
- Review request
- Subscription updates

**Test Email:**
- Send test to verify configuration

### Payment Settings

**Stripe Configuration:**
- Publishable key
- Secret key
- Webhook secret
- Test mode toggle

**Subscription Plans:**
- Edit plan pricing
- Modify features
- Update limits
- Change billing cycles

### Notification Settings

**Push Notifications:**
- Enable/disable
- Pusher configuration
- API keys

**Email Notifications:**
- Order updates
- System alerts
- Marketing emails

### API Settings

**API Keys:**
- Generate new keys
- Revoke keys
- Set rate limits
- Monitor usage

**Webhooks:**
- Configure webhook URLs
- Event subscriptions
- Retry settings
- Webhook logs

### Integration Settings

**E-commerce Platforms:**
- WooCommerce
- Shopify
- Magento
- Custom integrations

**Third-party Services:**
- Analytics (PostHog)
- Error tracking (Sentry)
- Customer support
- Marketing tools

---

## 🔐 Security & Audit

### Security Dashboard

**Monitor Security:**
- Failed login attempts
- Suspicious activities
- API abuse
- Data breaches (alerts)

### Audit Logs

**View All System Activities:**
1. Navigate to Admin → Audit Logs
2. Filter by:
   - User
   - Action type
   - Date range
   - Resource type

3. **Logged Actions:**
   - User logins
   - Data modifications
   - Permission changes
   - System configuration
   - API calls

4. **Export Logs:**
   - CSV format
   - Compliance reports

### Access Control

**Manage Admin Permissions:**
1. Navigate to Admin → Roles
2. View/Edit roles:
   - Super Admin
   - Admin
   - Moderator
   - Support

3. **Configure Permissions:**
   - User management
   - Content moderation
   - System settings
   - Billing access
   - Analytics access

### Security Settings

**Password Policies:**
- Minimum length
- Complexity requirements
- Expiry period
- Reuse restrictions

**Session Management:**
- Session timeout
- Concurrent sessions
- Force logout

**IP Whitelisting:**
- Restrict admin access
- Add trusted IPs
- Block suspicious IPs

### Two-Factor Authentication (Coming Soon)

**Enable 2FA:**
- For all admins (required)
- For users (optional)
- SMS or authenticator app

---

## 🔧 Troubleshooting

### Common Admin Issues

#### Can't Access Admin Panel

**Solutions:**
1. Verify admin role assigned
2. Clear browser cache
3. Check permissions
4. Contact super admin

#### Reports Not Generating

**Solutions:**
1. Check date range validity
2. Verify data exists
3. Check system logs
4. Retry generation

#### Email Notifications Not Sending

**Solutions:**
1. Verify SMTP settings
2. Check API key validity
3. Test email configuration
4. Review email logs
5. Check spam folders

#### Payment Processing Errors

**Solutions:**
1. Verify Stripe keys
2. Check webhook configuration
3. Review Stripe dashboard
4. Test in Stripe test mode

### System Maintenance

**Regular Tasks:**
- [ ] Review audit logs (weekly)
- [ ] Check system health (daily)
- [ ] Monitor error rates (daily)
- [ ] Review user feedback (weekly)
- [ ] Update documentation (monthly)
- [ ] Security patches (as needed)

### Database Maintenance

**Tasks:**
- Backup verification
- Index optimization
- Query performance review
- Storage monitoring

**Backups:**
- Automatic daily backups
- Retention: 30 days
- Manual backup option
- Restore procedures

---

## 📞 Admin Support

### Internal Support

**For Admin Issues:**
- Email: admin-support@performile.com
- Slack: #admin-support
- Emergency: +46 (0) 123 456 789

### Documentation

- Admin Guide (this document)
- API Documentation
- System Architecture
- Runbooks

### Training

- Admin onboarding
- Monthly training sessions
- Video tutorials
- Best practices guide

---

## 📚 Best Practices

### User Management
1. Regular permission audits
2. Remove inactive admins
3. Document access changes
4. Follow least privilege principle

### Security
1. Enable 2FA for all admins
2. Regular password changes
3. Monitor audit logs
4. Respond to alerts promptly

### Performance
1. Monitor system metrics
2. Optimize slow queries
3. Review error logs
4. Plan capacity upgrades

### Communication
1. Notify users of changes
2. Transparent about issues
3. Regular status updates
4. Clear documentation

---

*Admin Guide Version 1.0*  
*Last Updated: October 11, 2025*  
*For admin support: admin-support@performile.com*
