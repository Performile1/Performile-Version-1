# Performile Platform - User Guide

**Version:** 1.0  
**Last Updated:** October 11, 2025  
**For:** Merchants & Couriers

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Orders](#managing-orders)
4. [Working with Couriers](#working-with-couriers)
5. [Reviews & Ratings](#reviews--ratings)
6. [Analytics & Insights](#analytics--insights)
7. [Account Settings](#account-settings)
8. [Billing & Subscriptions](#billing--subscriptions)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Creating an Account

1. **Navigate to the Platform**
   - Go to: https://frontend-two-swart-31.vercel.app
   - Click **"Sign Up"** button

2. **Choose Account Type**
   - **Merchant:** For businesses shipping products
   - **Courier:** For delivery service providers

3. **Complete Registration**
   - Enter your email address
   - Create a strong password (min 8 characters)
   - Fill in business details
   - Verify your email address

4. **Email Verification**
   - Check your inbox for verification email
   - Click the verification link
   - Your account is now active!

### First Login

1. **Login**
   - Enter your email and password
   - Click **"Login"**

2. **Complete Your Profile**
   - Add company logo
   - Fill in business information
   - Set notification preferences

3. **Dashboard Tour**
   - Familiarize yourself with the main dashboard
   - Explore key metrics and widgets

---

## 📊 Dashboard Overview

### Main Dashboard

The dashboard is your central hub for monitoring shipping performance.

#### Key Widgets

**1. Performance Metrics**
- **Total Orders:** Number of orders processed
- **Success Rate:** Percentage of successful deliveries
- **Average Delivery Time:** Days from pickup to delivery
- **Active Shipments:** Currently in-transit orders

**2. Performance Trends Chart**
- Visual representation of delivery performance over time
- Toggle between daily, weekly, and monthly views
- Compare different couriers

**3. Recent Activity**
- Latest order updates
- New reviews
- System notifications
- Important alerts

**4. Quick Actions**
- Create New Order
- Export Reports
- View Analytics
- Contact Support

#### Top Couriers Widget
- See your most-used couriers
- View their Trust Scores
- Quick access to courier profiles

---

## 📦 Managing Orders

### Viewing Orders

1. **Navigate to Orders**
   - Click **"Orders"** in the main menu
   - View all your orders in a table

2. **Order Information Displayed**
   - Tracking Number
   - Order Number
   - Store Name
   - Courier Name
   - Status (with color coding)
   - Order Date
   - Delivery Date
   - Location (City, Country)

### Order Status Colors

- 🟠 **Pending** - Order created, awaiting pickup
- 🔵 **Confirmed** - Courier confirmed pickup
- 🟣 **Picked Up** - Package collected
- 🟠 **In Transit** - On the way to destination
- 🟢 **Delivered** - Successfully delivered
- 🔴 **Cancelled** - Order cancelled
- 🟤 **Failed** - Delivery failed

### Creating a New Order

1. **Click "New Order" Button**
   - Located in top-right of Orders page

2. **Fill in Order Details**
   - **Tracking Number:** Unique identifier
   - **Order Number:** Your internal reference
   - **Store:** Select from dropdown
   - **Courier:** Choose delivery service
   - **Customer Email:** Recipient's email
   - **Service Level:** Standard, Express, etc.
   - **Delivery Type:** Home, Parcel Shop, Locker

3. **Add Delivery Information**
   - Postal Code
   - City
   - Country
   - Estimated Delivery Date (optional)

4. **Submit Order**
   - Click **"Create Order"**
   - Order is added to your list

### Filtering Orders

**Search Bar**
- Search by tracking number, order number, or customer email

**Status Filter**
- Click status chips to filter by order status
- Multiple statuses can be selected

**Date Range Filter**
- **Quick Presets:**
  - Today
  - Last 7 days
  - Last 30 days
  - Last 90 days
- **Custom Range:**
  - Select "From Date"
  - Select "To Date"

**Courier Filter**
- Select one or more couriers from dropdown
- View orders for specific delivery services

**Store Filter**
- Filter by store/warehouse location
- Useful for multi-location businesses

**Country Filter**
- Filter by destination country
- Analyze international vs. domestic shipments

**Clear Filters**
- Click **"Clear All"** to reset filters

### Sorting Orders

Click on any column header to sort:
- Tracking Number
- Order Number
- Store Name
- Courier Name
- Status
- Order Date
- Delivery Date

Click again to reverse sort order (ascending ↔ descending)

### Bulk Actions

1. **Select Multiple Orders**
   - Check boxes next to orders
   - Or check header box to select all

2. **Available Actions**
   - **Export Selected:** Download as CSV
   - **Delete Selected:** Remove multiple orders
   - **Update Status:** Bulk status change (coming soon)

### Quick View Drawer

1. **Click Eye Icon** on any order
2. **View Details** in side panel:
   - Full order information
   - Tracking history
   - Customer details
   - Delivery notes
3. **Quick Actions:**
   - Edit order
   - View full details
   - Track shipment

### Exporting Orders

**Export All Orders**
1. Click **"Export"** button (top-right)
2. CSV file downloads automatically
3. Open in Excel or Google Sheets

**Export Selected Orders**
1. Select orders with checkboxes
2. Click **"Export Selected"** in bulk actions bar
3. Only selected orders are exported

**CSV Includes:**
- All order details
- Timestamps
- Status information
- Customer data

### Editing an Order

1. **Click Three Dots** (⋮) on order row
2. Select **"Edit"**
3. Modify order details
4. Click **"Save Changes"**

**Note:** Some fields may be locked after courier pickup

### Deleting an Order

1. **Click Three Dots** (⋮) on order row
2. Select **"Delete"**
3. Confirm deletion
4. Order is permanently removed

**Warning:** This action cannot be undone!

---

## 🚚 Working with Couriers

### Viewing Couriers

1. **Navigate to Couriers**
   - Click **"Couriers"** in main menu
   - View list of available couriers

2. **Courier Information**
   - Courier Name
   - Trust Score (0-100)
   - On-Time Rate (%)
   - Completion Rate (%)
   - Average Rating (stars)
   - Total Deliveries

### Understanding Trust Score

**Trust Score** is a comprehensive metric (0-100) based on:
- **On-Time Delivery Rate** (40%)
- **Completion Rate** (30%)
- **Customer Reviews** (20%)
- **Response Time** (10%)

**Score Ranges:**
- 90-100: Excellent ⭐⭐⭐⭐⭐
- 80-89: Very Good ⭐⭐⭐⭐
- 70-79: Good ⭐⭐⭐
- 60-69: Fair ⭐⭐
- Below 60: Needs Improvement ⭐

### Viewing Courier Details

1. **Click on Courier Name**
2. **View Profile:**
   - Contact information
   - Service areas
   - Delivery types offered
   - Pricing information
   - Performance history

3. **Performance Metrics:**
   - Delivery success rate
   - Average delivery time
   - Customer satisfaction
   - Recent reviews

### Comparing Couriers

1. **Navigate to Analytics**
2. **Select "Courier Comparison"**
3. **View Side-by-Side:**
   - Trust Scores
   - Delivery times
   - Costs
   - Success rates

4. **Make Data-Driven Decisions**
   - Choose best courier for your needs
   - Optimize shipping costs
   - Improve delivery performance

### TrustScore Rankings

1. **Navigate to TrustScore Page**
2. **View Complete Rankings:**
   - All couriers ranked by Trust Score
   - Detailed metrics for each
   - Trends over time

3. **Filter by:**
   - Service type
   - Geographic region
   - Delivery speed

---

## ⭐ Reviews & Ratings

### Submitting a Review

1. **After Delivery Completion**
   - You'll receive email prompt to review
   - Or go to completed order

2. **Rate the Delivery**
   - Click **"Leave Review"** button
   - Select star rating (1-5 stars)
   - 5 stars = Excellent
   - 1 star = Poor

3. **Write Review**
   - Describe your experience
   - Be specific and constructive
   - Mention positives and negatives

4. **Submit Review**
   - Click **"Submit Review"**
   - Review is published immediately
   - Courier is notified

### Review Guidelines

**Do:**
- Be honest and fair
- Provide specific details
- Focus on the delivery experience
- Mention both pros and cons

**Don't:**
- Use offensive language
- Include personal information
- Make false claims
- Review based on product issues (not delivery)

### Viewing Your Reviews

1. **Go to Account Settings**
2. **Click "My Reviews"**
3. **View All Reviews You've Written:**
   - Edit recent reviews (within 24 hours)
   - See courier responses
   - Track review impact

### Viewing Courier Reviews

1. **Go to Courier Profile**
2. **Scroll to Reviews Section**
3. **Read Reviews from Other Merchants:**
   - Sort by date or rating
   - Filter by delivery type
   - See verified reviews only

---

## 📈 Analytics & Insights

### Performance Dashboard

1. **Navigate to Analytics**
2. **View Key Metrics:**
   - Total shipments
   - Success rate trends
   - Cost analysis
   - Delivery time averages

### Cost Analysis

**View Shipping Costs:**
- Total spent per month
- Cost per courier
- Cost per delivery type
- Cost trends over time

**Identify Savings:**
- Compare courier costs
- Find most economical options
- Track cost changes

### Delivery Performance

**Track Performance:**
- On-time delivery rates
- Average delivery times
- Delay patterns
- Success rates by route

**Improve Operations:**
- Identify problem areas
- Optimize courier selection
- Reduce delays

### Market Insights (Coming Soon)

- Industry benchmarks
- Competitor analysis
- Pricing trends
- Best practices

---

## ⚙️ Account Settings

### Profile Settings

1. **Navigate to Settings**
2. **Click "Profile"**
3. **Update Information:**
   - Company name
   - Contact email
   - Phone number
   - Business address
   - Company logo

### Changing Password

1. **Go to Settings → Security**
2. **Click "Change Password"**
3. **Enter:**
   - Current password
   - New password
   - Confirm new password

4. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character

5. **Click "Update Password"**

### Forgot Password

1. **On Login Page**
2. **Click "Forgot Password?"**
3. **Enter Your Email**
4. **Check Email for Reset Link**
5. **Click Link and Create New Password**
6. **Link expires in 1 hour**

### Notification Preferences

**Email Notifications:**
- [ ] Order updates
- [ ] Delivery confirmations
- [ ] Review requests
- [ ] Weekly reports
- [ ] Marketing emails

**In-App Notifications:**
- [ ] Real-time order updates
- [ ] System alerts
- [ ] New features

**Save Preferences**

### Team Management

**Add Team Members:**
1. Go to Settings → Team
2. Click "Invite Member"
3. Enter email address
4. Select role (Admin, Manager, Viewer)
5. Send invitation

**Manage Permissions:**
- Admin: Full access
- Manager: Create/edit orders, view reports
- Viewer: View-only access

---

## 💳 Billing & Subscriptions

### Viewing Current Plan

1. **Navigate to Billing**
2. **View Current Subscription:**
   - Plan name (Free, Basic, Pro, Enterprise)
   - Monthly cost
   - Features included
   - Renewal date

### Subscription Plans

**Free Plan**
- 50 orders/month
- Basic analytics
- Email support

**Basic Plan - $29/month**
- 500 orders/month
- Advanced analytics
- Priority support
- CSV exports

**Pro Plan - $99/month**
- Unlimited orders
- Market insights
- API access
- Dedicated support
- Custom reports

**Enterprise Plan - Custom**
- Everything in Pro
- White-label option
- Custom integrations
- SLA guarantee
- Account manager

### Upgrading Your Plan

1. **Go to Billing**
2. **Click "Change Plan"**
3. **Select New Plan**
4. **Review Changes:**
   - New features
   - Price difference
   - Prorated amount

5. **Confirm Upgrade**
6. **Immediate Access** to new features

### Updating Payment Method

1. **Go to Billing**
2. **Click "Update Payment Method"**
3. **Stripe Portal Opens**
4. **Add/Update Card:**
   - Card number
   - Expiry date
   - CVC
   - Billing address

5. **Save Changes**

### Viewing Invoices

1. **Go to Billing → Invoices**
2. **View Invoice History:**
   - Date
   - Amount
   - Status (Paid/Pending)
   - Download PDF

3. **Download Invoice:**
   - Click download icon
   - PDF opens in new tab
   - Save or print

### Cancelling Subscription

1. **Go to Billing**
2. **Click "Cancel Subscription"**
3. **Select Reason** (optional feedback)
4. **Confirm Cancellation**

**Important:**
- Access continues until end of billing period
- Data is retained for 30 days
- Can reactivate anytime
- No refunds for partial months

---

## 🔧 Troubleshooting

### Common Issues

#### Can't Login

**Problem:** "Invalid credentials" error

**Solutions:**
1. Check email spelling
2. Verify password (case-sensitive)
3. Use "Forgot Password" if needed
4. Clear browser cache
5. Try different browser

#### Orders Not Loading

**Problem:** Orders page is blank or loading forever

**Solutions:**
1. Refresh the page (F5)
2. Check internet connection
3. Clear browser cache
4. Try different browser
5. Contact support if persists

#### Filter Dropdowns Empty

**Problem:** Courier/Store dropdowns have no options

**Solutions:**
1. Ensure you have created stores/added couriers
2. Refresh the page
3. Check browser console for errors
4. Contact support with error details

#### Export Not Working

**Problem:** CSV export fails or downloads empty file

**Solutions:**
1. Ensure you have orders to export
2. Try exporting fewer orders
3. Check browser pop-up blocker
4. Try different browser
5. Contact support

#### Can't Create Order

**Problem:** "Create Order" button doesn't work or form errors

**Solutions:**
1. Fill all required fields (marked with *)
2. Check tracking number is unique
3. Verify email format
4. Ensure store and courier are selected
5. Check browser console for errors

### Getting Help

**Email Support**
- Email: support@performile.com
- Response time: Within 24 hours
- Include: Account email, issue description, screenshots

**Live Chat**
- Available: Monday-Friday, 9 AM - 5 PM CET
- Click chat icon in bottom-right
- Instant responses during business hours

**Documentation**
- User Guide (this document)
- Developer Guide
- API Reference
- FAQ

**Community Forum** (Coming Soon)
- Ask questions
- Share tips
- Connect with other users

---

## 📱 Mobile Access

### Mobile Browser

The platform is mobile-responsive:
- Access from any mobile browser
- Optimized for touch
- All features available
- Responsive design

**Recommended Browsers:**
- Chrome (Android)
- Safari (iOS)
- Firefox
- Edge

### Mobile App (Coming 2026)

Native mobile apps in development:
- iOS app (App Store)
- Android app (Google Play)
- Push notifications
- Offline support
- Camera integration

---

## 🔐 Security & Privacy

### Data Security

- **Encryption:** All data encrypted in transit (HTTPS)
- **Secure Storage:** Database encrypted at rest
- **Access Control:** Role-based permissions
- **Audit Logs:** All actions tracked

### Privacy

- **GDPR Compliant:** EU data protection
- **Data Retention:** Configurable retention periods
- **Data Export:** Download your data anytime
- **Data Deletion:** Request account deletion

### Best Practices

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Don't reuse passwords

2. **Enable Two-Factor Authentication** (Coming Soon)
   - Extra security layer
   - SMS or authenticator app

3. **Regular Reviews**
   - Review team member access
   - Remove inactive users
   - Update contact information

4. **Secure Your Account**
   - Don't share passwords
   - Log out on shared devices
   - Report suspicious activity

---

## 💡 Tips & Best Practices

### Optimize Your Workflow

1. **Use Filters Effectively**
   - Save time finding orders
   - Create custom views
   - Export filtered data

2. **Bulk Actions**
   - Process multiple orders at once
   - Export in batches
   - Efficient management

3. **Regular Reviews**
   - Leave reviews promptly
   - Help improve courier quality
   - Build better relationships

4. **Monitor Analytics**
   - Check weekly reports
   - Identify trends
   - Make data-driven decisions

### Cost Optimization

1. **Compare Couriers**
   - Use comparison tools
   - Track cost per delivery
   - Negotiate better rates

2. **Choose Right Service Level**
   - Standard for non-urgent
   - Express when needed
   - Balance cost and speed

3. **Consolidate Shipments**
   - Batch orders when possible
   - Reduce per-order costs
   - Improve efficiency

### Improve Delivery Success

1. **Accurate Information**
   - Verify addresses
   - Include phone numbers
   - Add delivery notes

2. **Choose Reliable Couriers**
   - Check Trust Scores
   - Read reviews
   - Track performance

3. **Communicate with Customers**
   - Send tracking info
   - Set expectations
   - Follow up on issues

---

## 📞 Contact & Support

### Support Channels

**Email:** support@performile.com  
**Phone:** +46 (0) 123 456 789  
**Hours:** Monday-Friday, 9 AM - 6 PM CET

### Social Media

**Twitter:** @Performile  
**LinkedIn:** Performile  
**Facebook:** Performile

### Feedback

We value your feedback!
- Feature requests
- Bug reports
- Suggestions
- Testimonials

Email: feedback@performile.com

---

## 📚 Additional Resources

- **Developer Guide:** API documentation
- **Admin Guide:** Platform administration
- **Video Tutorials:** Coming soon
- **Webinars:** Monthly training sessions
- **Blog:** Tips, updates, industry news

---

*User Guide Version 1.0*  
*Last Updated: October 11, 2025*  
*For questions or feedback: support@performile.com*
