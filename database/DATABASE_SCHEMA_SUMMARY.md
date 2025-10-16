# PERFORMILE DATABASE SCHEMA SUMMARY

**Generated:** 2025-10-16  
**Database:** Supabase PostgreSQL (public schema)

---

## TABLE INVENTORY (49 Tables)

### Core Business Tables (8)
1. **users** - User accounts and authentication
2. **couriers** - Courier/delivery service providers
3. **stores** - Merchant stores
4. **orders** - Delivery orders
5. **reviews** - Order/courier reviews
6. **subscription_plans** - Available subscription tiers
7. **user_subscriptions** - Active user subscriptions
8. **merchantshops** - Physical merchant shop locations

### Courier & Service Management (7)
9. **servicetypes** - Delivery service types (home, locker, etc.)
10. **orderservicetype** - Links orders to service types
11. **courier_api_credentials** - API keys for courier integrations
12. **courierdocuments** - Courier documentation/certificates
13. **courier_analytics** - Cached courier performance metrics
14. **trustscorecache** - Cached trust scores for couriers
15. **merchantcouriercheckout** - Merchant-courier checkout configurations

### Order & Delivery Management (8)
16. **delivery_requests** - Delivery request queue
17. **delivery_proof** - Delivery confirmation (photos, signatures)
18. **tracking_data** - Real-time tracking information
19. **tracking_events** - Tracking event history
20. **tracking_subscriptions** - Webhook subscriptions for tracking
21. **tracking_api_logs** - API call logs for tracking
22. **ratinglinks** - Review request links sent to customers
23. **merchant_couriers** - Merchant's preferred couriers

### Review & Communication (10)
24. **reviewrequests** - Review request campaigns
25. **reviewrequestresponses** - Responses to review requests
26. **reviewrequestsettings** - User review request preferences
27. **review_reminders** - Scheduled review reminders
28. **conversations** - Messaging conversations
29. **messages** - Individual messages
30. **conversationparticipants** - Conversation members
31. **messagereadreceipts** - Message read status
32. **messagereactions** - Message reactions (emoji)
33. **notificationpreferences** - User notification settings

### Integration & E-commerce (4)
34. **ecommerce_integrations** - E-commerce platform connections
35. **shopintegrations** - Shop-specific integrations
36. **email_templates** - Customizable email templates
37. **leadsmarketplace** - Lead marketplace listings
38. **leaddownloads** - Downloaded leads by couriers

### Analytics & Reporting (4)
39. **shopanalyticssnapshots** - Shop performance snapshots
40. **marketsharesnapshots** - Market share analytics
41. **platform_analytics** - Platform-wide metrics
42. **usage_logs** - Feature usage tracking

### Subscription Management (4)
43. **subscription_plan_changes** - Plan change history
44. **subscription_cancellations** - Cancellation requests
45. **paymenthistory** - Payment transactions
46. **team_invitations** - Team member invitations

### System & Utility (4)
46. **user_sessions** - Active user sessions
47. **postal_codes** - Postal code database with coordinates
48. **spatial_ref_sys** - PostGIS spatial reference system (enables geospatial queries)
49. **merchant_couriers** - Merchant's preferred courier relationships

---

## KEY SCHEMA DETAILS

### Custom ENUM Types
- `user_role`: admin, merchant, courier, consumer
- `order_status`: pending, confirmed, picked_up, in_transit, delivered, cancelled, failed
- `rating_link_status`: sent, opened, completed, expired, unanswered

### Primary Relationships

**Users → Entities:**
- users → couriers (1:1 via user_id)
- users → stores (1:many via owner_user_id)
- users → user_subscriptions (1:many)

**Orders Flow:**
- stores → orders (1:many)
- couriers → orders (1:many)
- orders → reviews (1:1)
- orders → ratinglinks (1:1)
- orders → tracking_data (1:1)

**Merchant Configuration:**
- stores → merchantshops (1:many)
- merchantshops → shopintegrations (1:many)
- stores + couriers → merchantcouriercheckout (many:many)

**Service Types:**
- servicetypes (service definitions)
- orders → orderservicetype → servicetypes (many:many)

**Analytics:**
- courier_analytics (per courier metrics)
- shopanalyticssnapshots (per shop metrics)
- marketsharesnapshots (market share data)
- platform_analytics (platform-wide metrics)

---

## NOTABLE FEATURES

### Tracking System
- Real-time tracking via `tracking_data`
- Event history in `tracking_events`
- Webhook subscriptions in `tracking_subscriptions`
- API call logging in `tracking_api_logs`

### Review System
- Automated review requests via `reviewrequests`
- Customizable settings per user in `reviewrequestsettings`
- Reminder scheduling in `review_reminders`
- Unique review links in `ratinglinks`

### Messaging System
- Multi-party conversations
- Read receipts
- Message reactions
- Attachment support (JSONB)

### Subscription System
- Multiple plan tiers
- Usage tracking (orders, emails, SMS, push notifications)
- Plan changes with proration
- Cancellation policies
- Trial period support

### Integration System
- E-commerce platform connections
- Shop-level integrations
- Webhook support
- API credential management

### Geospatial Features
- PostGIS enabled (`spatial_ref_sys`)
- Postal code coordinates
- Location-based analytics

---

## MISSING COLUMNS NOTED

Based on previous errors, these columns don't exist in actual schema:
- `orders.is_reviewed` - Use join to reviews table instead
- `reviews.review_date` - Use `created_at` instead
- `reviews.on_time_delivery_score` - Individual rating columns don't exist
- `reviews.package_condition_score` - Use `package_condition_rating` instead
- `reviews.communication_score` - Use `communication_rating` instead
- `subscription_plans.user_role` - Use `user_type` instead
- `subscription_plans.price_monthly` - Use `monthly_price` instead
- `subscription_plans.price_yearly` - Use `annual_price` instead
- `user_subscriptions.start_date` - Use `current_period_start` instead
- `user_subscriptions.end_date` - Use `current_period_end` instead

---

## CONSTRAINTS SUMMARY

### Foreign Key Relationships (90+ constraints)

**User-centric relationships:**
- users → couriers (1:1, CASCADE)
- users → stores (1:many, CASCADE)
- users → user_subscriptions (1:many, CASCADE)
- users → conversations (creator)
- users → messages (sender)
- users → notification_preferences (1:1)

**Order flow:**
- stores → orders (CASCADE)
- couriers → orders (no CASCADE)
- orders → reviews (CASCADE)
- orders → ratinglinks (CASCADE)
- orders → tracking_data (CASCADE)
- orders → orderservicetype (CASCADE)

**Subscription system:**
- subscription_plans → user_subscriptions
- user_subscriptions → subscription_plan_changes (CASCADE)
- user_subscriptions → subscription_cancellations (CASCADE)
- user_subscriptions → usage_logs (SET NULL)

**Messaging system:**
- conversations → messages (CASCADE)
- conversations → conversationparticipants (CASCADE)
- messages → messagereadreceipts (CASCADE)
- messages → messagereactions (CASCADE)

**Tracking system:**
- tracking_data → tracking_events (CASCADE)
- tracking_data → delivery_proof (CASCADE)
- orders → tracking_data (CASCADE)

### Unique Constraints (30+)

**Business logic:**
- `unique_active_subscription` - One active subscription per user
- `unique_merchant_courier_service` - Unique merchant-courier-service combo per location
- `unique_order_service` - One service type per order
- `unique_shop_platform` - One integration per shop per platform
- `unique_shop_snapshot` - One snapshot per shop per date/period
- `unique_snapshot` - Unique market share snapshots
- `unique_user_template` - One template per type per user

**Data integrity:**
- `users.email` - Unique emails
- `users.api_key` - Unique API keys
- `users.stripe_customer_id` - Unique Stripe customers
- `couriers.courier_code` - Unique courier codes
- `couriers.user_id` - One courier per user
- `orders.reference_number` - Unique reference numbers
- `orders(store_id, order_number)` - Unique order numbers per store
- `ratinglinks.unique_token` - Unique review tokens
- `subscription_plans.plan_slug` - Unique plan slugs
- `subscription_plans.stripe_price_id` - Unique Stripe prices

### Check Constraints (25+)

**Rating validations:**
- `reviews.rating` - Between 1 and 5
- `reviews.communication_rating` - Between 1 and 5
- `reviews.delivery_speed_rating` - Between 1 and 5
- `reviews.package_condition_rating` - Between 1 and 5

**Status validations:**
- `valid_status` (multiple) - Enforces valid status values
- `valid_change_type` - upgrade, downgrade, initial, reactivation
- `valid_policy` - 30_days, immediate, end_of_period
- `valid_tier` - 1, 2, or 3
- `valid_user_type` - merchant or courier
- `valid_team_role` - admin, manager, member, viewer
- `valid_entity_type` - courier or store
- `valid_platform` - shopify, woocommerce, opencart, prestashop, magento, wix, squarespace
- `valid_template_type` - review_request, review_reminder, welcome, notification, password_reset
- `valid_usage_type` - order, email, sms, push, api_call

**Business rules:**
- `positive_price` - Monthly price must be >= 0
- `email_format` - Valid email format regex
- `courierdocuments.document_type` - logo, license, insurance, certification
- `spatial_ref_sys.srid` - Between 1 and 998999

### Cascade Behaviors

**DELETE CASCADE (most relationships):**
- Deleting a user cascades to their couriers, stores, subscriptions, messages, etc.
- Deleting an order cascades to reviews, tracking, service types
- Deleting a conversation cascades to messages and participants
- Deleting a shop cascades to integrations and analytics

**SET NULL:**
- conversations.related_order_id (order deleted)
- conversations.related_lead_id (lead deleted)
- reviewrequests.review_id (review deleted)
- usage_logs.subscription_id (subscription deleted)
- team_invitations.accepted_by_user_id (user deleted)

---

## RECOMMENDATIONS

### Data Integrity ✅
- ✅ Foreign keys properly set with appropriate CASCADE/SET NULL
- ✅ CHECK constraints enforce valid ranges and values
- ✅ UNIQUE constraints prevent duplicates
- ⚠️ Consider adding triggers for `updated_at` automation

### Performance
- Consider partitioning `tracking_events` by date
- Archive old `tracking_api_logs` periodically
- Implement caching for frequently accessed analytics
- Index `orders(customer_email)` for customer lookup
- Index `messages(conversation_id, created_at)` for message history

### Business Logic Validation
- ✅ Rating ranges enforced (1-5)
- ✅ Status values validated via CHECK constraints
- ✅ Email format validated
- ✅ One active subscription per user enforced
- ✅ Unique order numbers per store enforced

---

## NEXT STEPS

1. ✅ Schema documented
2. ⏳ Create data validation queries
3. ⏳ Generate sample data queries
4. ⏳ Create backup/restore procedures
5. ⏳ Document API endpoints that use each table
