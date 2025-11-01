# Rule Engine - Comprehensive Specification

**Date:** October 26, 2025, 9:51 AM  
**Status:** 🎯 EXPANDED SPECIFICATION

---

## 🎯 RULE CATEGORIES (Expanded from 3 to 8)

### **1. ORDER RULES** ✅ (Already Planned)
Automation for order lifecycle

### **2. CLAIM RULES** ✅ (Already Planned)
Automation for claims and disputes

### **3. NOTIFICATION RULES** ✅ (Already Planned)
Communication automation

### **4. RETURN RULES** 🆕 (NEW)
Automation for returns/RMA

### **5. TMS RULES** 🆕 (NEW - Transport Management)
Automation for transport/logistics

### **6. WMS RULES** 🆕 (NEW - Warehouse Management)
Automation for warehouse operations

### **7. RATING RULES** 🆕 (NEW)
Automation for reviews/ratings

### **8. CUSTOM RULES** 🆕 (NEW)
User-defined business logic

---

## 📋 COMPREHENSIVE RULE CONDITIONS

### **Order Status Conditions:**
```javascript
// Time-based
- order.days_since_created > X
- order.days_since_last_update > X
- order.days_until_estimated_delivery < X
- order.is_delayed = true

// Status-based
- order.status = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
- order.status_not_updated_for_days > X
- order.has_tracking_updates = false

// Value-based
- order.total_amount > X
- order.weight > X
- order.is_international = true
- order.requires_signature = true

// Location-based
- order.postal_code STARTS WITH 'XX'
- order.country = 'SE'
- order.delivery_distance > X km
```

### **Claim Conditions:**
```javascript
- claim.amount > X
- claim.type = 'damage' | 'lost' | 'delay' | 'other'
- claim.days_since_created > X
- claim.has_evidence = true
- claim.customer_tier = 'vip' | 'regular'
```

### **Return Conditions:**
```javascript
- return.reason = 'defective' | 'wrong_item' | 'changed_mind' | 'damaged'
- return.days_since_delivery < X
- return.item_value > X
- return.has_original_packaging = true
- return.refund_method = 'original' | 'store_credit'
```

### **TMS Conditions:**
```javascript
- route.total_distance > X km
- route.number_of_stops > X
- vehicle.capacity_used > X%
- driver.hours_worked_today > X
- delivery_window.is_missed = true
```

### **WMS Conditions:**
```javascript
- inventory.stock_level < X
- inventory.days_until_expiry < X
- warehouse.capacity_used > X%
- picking_order.priority = 'high' | 'normal' | 'low'
- item.location = 'zone_A' | 'zone_B'
```

### **Rating Conditions:**
```javascript
- rating.score < X
- rating.days_since_delivery = X
- customer.has_reviewed = false
- order.is_completed = true
- customer.total_orders > X
```

---

## 🎬 COMPREHENSIVE RULE ACTIONS

### **Order Actions:**
```javascript
✅ update_status(new_status)
✅ assign_courier(courier_id)
✅ create_shipping_label()
✅ cancel_order(reason)
✅ apply_discount(percentage)
✅ upgrade_shipping(service_level)
✅ split_order(criteria)
✅ merge_orders(order_ids)
🆕 create_new_order(template) // Your suggestion!
🆕 request_courier_update() // Your suggestion!
🆕 escalate_to_manager()
🆕 mark_as_priority()
```

### **Notification Actions:**
```javascript
✅ send_notification(recipient, template)
✅ send_email(recipient, template)
✅ send_sms(recipient, message)
🆕 send_push_notification(recipient, message)
🆕 send_to_slack(channel, message)
🆕 send_to_teams(channel, message)
🆕 create_in_app_alert(user, message)
```

### **Claim Actions:**
```javascript
✅ approve_claim(amount)
✅ reject_claim(reason)
✅ escalate_claim(to_user)
🆕 create_claim_to_courier() // Your suggestion!
🆕 request_evidence(type)
🆕 schedule_inspection(date)
🆕 offer_compensation(type, amount)
🆕 create_return_label()
🆕 initiate_refund(method, amount)
```

### **Return Actions:**
```javascript
🆕 approve_return(method)
🆕 reject_return(reason)
🆕 create_return_label(carrier)
🆕 schedule_pickup(date, time)
🆕 process_refund(method, amount)
🆕 issue_store_credit(amount)
🆕 create_replacement_order()
🆕 waive_return_fee()
🆕 request_return_photos()
```

### **TMS Actions:**
```javascript
🆕 optimize_route()
🆕 assign_driver(driver_id)
🆕 create_delivery_batch()
🆕 update_eta(new_time)
🆕 request_backup_vehicle()
🆕 notify_customer_eta_change()
🆕 reroute_delivery(new_route)
🆕 consolidate_shipments()
```

### **WMS Actions:**
```javascript
🆕 create_picking_order(items)
🆕 reorder_stock(item, quantity)
🆕 move_inventory(from_zone, to_zone)
🆕 mark_for_quality_check()
🆕 update_stock_location(location)
🆕 create_cycle_count(zone)
🆕 flag_slow_moving_items()
🆕 create_replenishment_order()
```

### **Rating Actions:**
```javascript
🆕 send_review_request(template)
🆕 send_review_reminder(days_after)
🆕 offer_incentive_for_review(type)
🆕 flag_negative_review()
🆕 auto_respond_to_review(template)
🆕 escalate_poor_rating()
🆕 send_thank_you_for_review()
```

### **Custom Actions:**
```javascript
🆕 webhook_call(url, method, payload)
🆕 api_call(endpoint, method, data)
🆕 run_script(script_id)
🆕 create_task(assignee, description)
🆕 update_custom_field(field, value)
🆕 trigger_integration(integration_id)
```

---

## 💡 EXAMPLE RULES - YOUR SUGGESTIONS

### **1. Order Not Updated in X Days**

**Condition:**
```javascript
IF order.days_since_last_update > 3
AND order.status IN ['processing', 'shipped', 'in_transit']
```

**Actions (User Chooses):**
```javascript
THEN:
  Option 1: create_new_order(original_order_template)
  Option 2: send_notification('customer', 'order_delayed')
  Option 3: send_notification('merchant', 'order_stuck_alert')
  Option 4: request_courier_update(courier_id)
  Option 5: create_claim_to_courier('delay', order_id)
  Option 6: escalate_to_manager('order_stuck')
  Option 7: offer_compensation('discount', 10%)
  Option 8: cancel_and_refund(order_id)
```

### **2. Return Request Automation**

**Condition:**
```javascript
IF return.reason = 'defective'
AND return.item_value < 500
AND return.days_since_delivery < 30
```

**Actions:**
```javascript
THEN:
  - approve_return('full_refund')
  - create_return_label('postnord')
  - send_notification('customer', 'return_approved')
  - create_replacement_order()
  - waive_return_fee()
```

### **3. Claim to Courier Automation**

**Condition:**
```javascript
IF order.is_delayed = true
AND order.days_since_estimated_delivery > 5
AND claim.does_not_exist = true
```

**Actions:**
```javascript
THEN:
  - create_claim_to_courier('delay', order_id)
  - send_notification('courier', 'claim_created')
  - send_notification('merchant', 'claim_filed')
  - request_courier_update()
  - set_claim_deadline(7_days)
```

### **4. TMS Route Optimization**

**Condition:**
```javascript
IF route.number_of_stops > 10
AND route.total_distance > 100
AND vehicle.capacity_used < 80%
```

**Actions:**
```javascript
THEN:
  - optimize_route()
  - consolidate_shipments()
  - update_eta_for_all_stops()
  - notify_customers_eta_change()
```

### **5. WMS Stock Reorder**

**Condition:**
```javascript
IF inventory.stock_level < reorder_point
AND inventory.days_until_expiry > 30
AND supplier.is_available = true
```

**Actions:**
```javascript
THEN:
  - create_replenishment_order(supplier_id, quantity)
  - send_notification('warehouse_manager', 'reorder_created')
  - update_stock_status('on_order')
```

### **6. Rating Request Automation**

**Condition:**
```javascript
IF order.status = 'delivered'
AND order.days_since_delivery = 2
AND customer.has_reviewed = false
```

**Actions:**
```javascript
THEN:
  - send_review_request('email_template')
  - offer_incentive_for_review('5%_discount')
  - send_review_reminder(days_after: 7)
```

---

## 📊 UPDATED SUBSCRIPTION LIMITS

### **Expanded Rule Types:**

| Tier | Order | Claim | Notification | Return | TMS | WMS | Rating | Custom | Total |
|------|-------|-------|--------------|--------|-----|-----|--------|--------|-------|
| **1** | 3 | 2 | 5 | 2 | 1 | 1 | 3 | 1 | **18** |
| **2** | 10 | 10 | 20 | 10 | 5 | 5 | 10 | 5 | **75** |
| **3** | 50 | 50 | 100 | 50 | 25 | 25 | 50 | 25 | **375** |
| **4** | 100 | 100 | 200 | 100 | 50 | 50 | 100 | 50 | **750** |

---

## 🗄️ DATABASE SCHEMA UPDATES

### **Update rule_engine_rules table:**

```sql
-- Expand rule_type constraint
ALTER TABLE rule_engine_rules
DROP CONSTRAINT rule_type_check;

ALTER TABLE rule_engine_rules
ADD CONSTRAINT rule_type_check 
CHECK (rule_type IN (
  'order', 
  'claim', 
  'notification', 
  'return',      -- NEW
  'tms',         -- NEW
  'wms',         -- NEW
  'rating',      -- NEW
  'custom'       -- NEW
));
```

### **Update subscription_plans table:**

```sql
-- Add new rule limit columns
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_return_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_tms_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_wms_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_rating_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_custom_rules INTEGER DEFAULT 0;

-- Update Tier 1
UPDATE subscription_plans SET 
  max_return_rules = 2,
  max_tms_rules = 1,
  max_wms_rules = 1,
  max_rating_rules = 3,
  max_custom_rules = 1
WHERE tier = 1;

-- Update Tier 2
UPDATE subscription_plans SET 
  max_return_rules = 10,
  max_tms_rules = 5,
  max_wms_rules = 5,
  max_rating_rules = 10,
  max_custom_rules = 5
WHERE tier = 2;

-- Update Tier 3
UPDATE subscription_plans SET 
  max_return_rules = 50,
  max_tms_rules = 25,
  max_wms_rules = 25,
  max_rating_rules = 50,
  max_custom_rules = 25
WHERE tier = 3;

-- Update Tier 4
UPDATE subscription_plans SET 
  max_return_rules = 100,
  max_tms_rules = 50,
  max_wms_rules = 50,
  max_rating_rules = 100,
  max_custom_rules = 50
WHERE tier = 4;
```

---

## 🎨 FRONTEND - 8 TABS INSTEAD OF 3

### **RuleEngineList.tsx - Updated:**

```typescript
// Eight separate tabs:
1. ORDER RULES TAB
   - "3/10 order rules used"
   - Create Order Rule button

2. CLAIM RULES TAB
   - "2/10 claim rules used"
   - Create Claim Rule button

3. NOTIFICATION RULES TAB
   - "5/20 notification rules used"
   - Create Notification Rule button

4. RETURN RULES TAB 🆕
   - "2/10 return rules used"
   - Create Return Rule button

5. TMS RULES TAB 🆕
   - "1/5 TMS rules used"
   - Create TMS Rule button

6. WMS RULES TAB 🆕
   - "1/5 WMS rules used"
   - Create WMS Rule button

7. RATING RULES TAB 🆕
   - "3/10 rating rules used"
   - Create Rating Rule button

8. CUSTOM RULES TAB 🆕
   - "1/5 custom rules used"
   - Create Custom Rule button
```

---

## 🚀 ADDITIONAL SUGGESTIONS

### **Advanced Features:**

1. **Rule Templates**
   - Pre-built rules for common scenarios
   - "Order not updated in 3 days" template
   - "Auto-approve returns under $100" template
   - "Send review request 2 days after delivery" template

2. **Rule Scheduling**
   - Run rules at specific times
   - "Check for stuck orders every morning at 9 AM"
   - "Send review requests every evening at 6 PM"

3. **Rule Chaining**
   - One rule triggers another
   - "If claim approved → create return label → send notification"

4. **Rule Analytics**
   - Track rule execution success rate
   - Monitor rule performance
   - A/B test different rule configurations

5. **Rule Versioning**
   - Keep history of rule changes
   - Rollback to previous versions
   - Compare rule performance over time

6. **Conditional Actions**
   - IF condition met THEN action1 ELSE action2
   - Nested IF/THEN/ELSE logic
   - Multiple action branches

7. **Rule Priorities**
   - High priority rules execute first
   - Conflict resolution (if multiple rules match)
   - Rule execution order

8. **Rule Testing**
   - Dry-run mode (simulate without executing)
   - Test with sample data
   - Preview actions before enabling

---

## 💰 BUSINESS VALUE

### **Time Savings:**
- **Order Management:** 2-3 hours/day automated
- **Claims Processing:** 1-2 hours/day automated
- **Returns Handling:** 1-2 hours/day automated
- **Review Requests:** 30 min/day automated
- **Total:** 5-8 hours/day saved!

### **Cost Savings:**
- Reduced manual labor: $50-100/day
- Faster claim resolution: $200-500/month
- Improved customer satisfaction: Priceless!

### **Revenue Increase:**
- More reviews → Better SEO → More sales
- Faster returns → Higher customer retention
- Automated upsells → Increased AOV

---

## 📝 IMPLEMENTATION PRIORITY

### **Phase 1 (Week 1):** Core 3 Types
- Order Rules
- Claim Rules
- Notification Rules

### **Phase 2 (Week 2):** Returns & Ratings
- Return Rules
- Rating Rules

### **Phase 3 (Week 3):** Advanced
- TMS Rules
- WMS Rules
- Custom Rules

---

**This is a COMPLETE business automation platform!** 🚀💰
