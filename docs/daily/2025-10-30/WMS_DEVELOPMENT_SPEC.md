# WMS (Warehouse Management System) Development Specification

**Date:** October 30, 2025  
**Version:** 1.0  
**Priority:** FUTURE DEVELOPMENT (V4.0)  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.25  
**Status:** 📋 SPECIFICATION PHASE

---

## 📋 EXECUTIVE SUMMARY

### **What is WMS?**
A comprehensive Warehouse Management System for Performile that manages:
- Multi-location inventory across countries
- Storage optimization (pallets, shelves, bins)
- Picking and packing operations
- Product data (pricing, customs, HS codes)
- International shipping and compliance
- AI-powered warehouse operations

### **Strategic Positioning:**
- **Current (V2.2):** Basic order management
- **V3.0 (May 2026):** TMS + Mobile + GPS + AI
- **V4.0 (2027):** Full WMS + Advanced AI 🎯

### **Why WMS?**
- Scale to multi-warehouse operations
- International expansion support
- Customs and compliance automation
- 40-60% operational efficiency gains
- Competitive advantage in logistics

---

## 🎯 WMS CORE FEATURES

### **1. MULTI-LOCATION MANAGEMENT**

#### **Warehouse Locations:**
- Country-level management
- Multiple warehouses per country
- Address and contact information
- Operating hours and capacity
- Warehouse type (fulfillment, distribution, 3PL)

#### **Storage Structure:**
```
Warehouse
├── Zones (Receiving, Storage, Picking, Packing, Shipping)
│   ├── Aisles
│   │   ├── Bays
│   │   │   ├── Shelves/Levels
│   │   │   │   ├── Bins/Slots
│   │   │   │   │   └── Products
│   ├── Pallet Spaces
│   ├── Floor Storage
│   └── Buffer Zones
```

#### **Location Attributes:**
- Location code (e.g., WH-NO-01-A-05-B-03)
- Location type (shelf, pallet, floor, buffer)
- Dimensions (height, width, depth)
- Weight capacity
- Temperature zone (ambient, cold, frozen)
- Accessibility (forklift, manual, robot)
- Status (available, occupied, reserved, damaged)

---

### **2. PRODUCT DATA MANAGEMENT**

#### **Core Product Information:**
- SKU / Barcode / QR Code
- Product name and description
- Category and subcategory
- Brand and manufacturer
- Dimensions (L x W x H)
- Weight (gross, net)
- Volume
- Packaging type
- Storage requirements

#### **Pricing Data:**
- Purchase price
- Sales price
- Currency
- Price history
- Margin calculations
- Bulk pricing tiers

#### **Customs & Compliance:**
- HS Code (Harmonized System)
- Country of origin
- Customs value
- Tariff classification
- Export/import restrictions
- Dangerous goods classification
- Certifications required

#### **Product Images:**
- Multiple product photos
- 360° views
- Packaging images
- Barcode images
- Damage reference photos

#### **Stock Information:**
- Current stock quantity
- Available stock (not reserved)
- Reserved stock
- In-transit stock
- Minimum stock level
- Maximum stock level
- Reorder point
- Lead time
- Last stock movement date
- Stock movement history

---

### **3. STORAGE MANAGEMENT**

#### **Putaway Strategies:**
- **Fixed Location:** Same product always in same location
- **Random Location:** Any available location
- **Zone-Based:** By product category
- **ABC Analysis:** High-velocity items in prime locations
- **FIFO/FEFO:** First-in-first-out / First-expired-first-out
- **LIFO:** Last-in-first-out
- **Batch/Lot Management:** Group by batch number

#### **Slotting Optimization:**
- AI-powered location recommendations
- Based on:
  - Product velocity (fast/slow movers)
  - Product dimensions and weight
  - Pick frequency
  - Order patterns
  - Seasonal trends
  - Co-location of frequently ordered together items

#### **Space Utilization:**
- Real-time capacity tracking
- 3D warehouse visualization
- Heat maps of activity zones
- Utilization reports by zone/aisle
- Capacity planning tools

---

### **4. PICKING & PACKING OPERATIONS**

#### **Picking Methods:**

**1. Single Order Picking (Discrete)**
- One order at a time
- Best for: Low volume, high value

**2. Batch Picking**
- Multiple orders simultaneously
- Group similar items
- Best for: Medium volume

**3. Zone Picking**
- Pickers assigned to zones
- Orders move through zones
- Best for: Large warehouses

**4. Wave Picking**
- Schedule picking in waves
- Optimize by time, carrier, route
- Best for: High volume

**5. Cluster Picking**
- Pick multiple orders to one cart
- Sort at packing station
- Best for: E-commerce

**6. Pick-to-Light / Put-to-Light**
- LED lights guide pickers
- Hands-free operation
- Best for: High accuracy needs

#### **Picking Optimization:**
- AI-powered pick path optimization
- Shortest route algorithms
- Congestion avoidance
- Real-time task assignment
- Priority-based picking
- Pick list generation

#### **Packing Operations:**
- Packing station management
- Box size recommendations
- Packing material tracking
- Weight verification
- Label printing
- Quality control checks
- Photo documentation

---

### **5. INVENTORY MANAGEMENT**

#### **Receiving:**
- ASN (Advanced Shipping Notice) integration
- Dock scheduling
- Inbound quality inspection
- Barcode scanning
- Quantity verification
- Damage reporting
- Putaway task generation

#### **Stock Movements:**
- Transfers between locations
- Cycle counting
- Physical inventory
- Stock adjustments
- Quarantine management
- Returns processing

#### **Inventory Tracking:**
- Real-time stock levels
- Lot/batch tracking
- Serial number tracking
- Expiry date management
- Stock aging reports
- Dead stock identification

---

### **6. INTERNATIONAL SHIPPING & COMPLIANCE**

#### **Market-Specific Data:**
- Destination country requirements
- Customs documentation
- Prohibited/restricted items
- Import duties and taxes
- Required certifications
- Language requirements

#### **Shipping Documentation:**
- Commercial invoice
- Packing list
- Certificate of origin
- Export declaration
- Customs forms
- Shipping labels
- Dangerous goods declarations

#### **Compliance Management:**
- HS code validation
- Export control screening
- Sanctions list checking
- Documentation completeness
- Regulatory updates
- Audit trail

---

## 🤖 AI/ML FEATURES FOR WMS

### **AI Feature #31: Intelligent Slotting Optimization**
**What:** AI determines optimal product placement
**Model:** Reinforcement Learning + Genetic Algorithm
**Input:**
- Product velocity (pick frequency)
- Product dimensions and weight
- Order patterns and co-occurrence
- Seasonal trends
- Worker efficiency by zone
- Equipment accessibility

**Output:** Optimal location assignments
**Impact:** 30-40% reduction in pick time
**Cost:** $15,000 (3 weeks)

---

### **AI Feature #32: Demand-Based Stock Positioning**
**What:** Predict demand and pre-position inventory
**Model:** LSTM + Time Series Forecasting
**Input:**
- Historical sales by region
- Seasonal patterns
- Marketing campaigns
- Weather forecasts
- Economic indicators
- Competitor activity

**Output:** Stock allocation recommendations per warehouse
**Impact:** 25% faster fulfillment, 20% lower shipping costs
**Cost:** $12,000 (2.5 weeks)

---

### **AI Feature #33: Pick Path Optimization**
**What:** Real-time optimal picking routes
**Model:** Ant Colony Optimization + Deep Learning
**Input:**
- Current picker locations
- Order priorities
- Warehouse congestion
- Product locations
- Equipment availability
- Time constraints

**Output:** Optimal pick sequence and path
**Impact:** 35% faster picking, 50% less congestion
**Cost:** $14,000 (3 weeks)

---

### **AI Feature #34: Packing Box Size Prediction**
**What:** Predict optimal box size before packing
**Model:** Computer Vision + Neural Network
**Input:**
- Product dimensions
- Order items
- Packing material inventory
- Shipping carrier requirements
- Fragility requirements

**Output:** Recommended box size and packing materials
**Impact:** 20% reduction in shipping costs, 30% less waste
**Cost:** $10,000 (2 weeks)

---

### **AI Feature #35: Warehouse Capacity Forecasting**
**What:** Predict warehouse space needs
**Model:** Prophet + Regression
**Input:**
- Current utilization
- Incoming shipments
- Sales forecasts
- Seasonal patterns
- Product mix changes

**Output:** Capacity alerts and expansion recommendations
**Impact:** Prevent stockouts, optimize space costs
**Cost:** $8,000 (2 weeks)

---

### **AI Feature #36: Automated Quality Control**
**What:** Computer vision for damage detection
**Model:** YOLO + ResNet (CNN)
**Input:**
- Product photos at receiving
- Product photos at packing
- Historical damage patterns
- Product specifications

**Output:** Damage detection, quality scores, alerts
**Impact:** 90% faster QC, 95% accuracy
**Cost:** $18,000 (4 weeks)

---

### **AI Feature #37: Labor Demand Forecasting**
**What:** Predict staffing needs by hour/day
**Model:** XGBoost + Time Series
**Input:**
- Historical order volumes
- Seasonal patterns
- Marketing campaigns
- Day of week / time of day
- Worker productivity rates

**Output:** Staffing recommendations by shift
**Impact:** 20% labor cost reduction, no understaffing
**Cost:** $9,000 (2 weeks)

---

### **AI Feature #38: Expiry Management & FEFO**
**What:** Intelligent expiry tracking and alerts
**Model:** Rule-Based AI + Predictive Analytics
**Input:**
- Product expiry dates
- Sales velocity
- Stock levels
- Lead times
- Seasonal demand

**Output:** Expiry alerts, FEFO pick recommendations, discount suggestions
**Impact:** 80% reduction in expired inventory
**Cost:** $7,000 (1.5 weeks)

---

### **AI Feature #39: Cross-Dock Optimization**
**What:** Identify cross-dock opportunities
**Model:** Pattern Recognition + Optimization
**Input:**
- Inbound shipments
- Outbound orders
- Warehouse capacity
- Carrier schedules
- Product characteristics

**Output:** Cross-dock recommendations, bypass storage
**Impact:** 40% faster fulfillment for eligible orders
**Cost:** $11,000 (2.5 weeks)

---

### **AI Feature #40: Warehouse Robotics Coordination**
**What:** AI orchestration of AMRs and AGVs
**Model:** Multi-Agent Reinforcement Learning
**Input:**
- Robot locations and status
- Task queue
- Warehouse congestion
- Human worker locations
- Charging station availability

**Output:** Task assignments, collision avoidance, optimal paths
**Impact:** 50% more robot efficiency, zero collisions
**Cost:** $20,000 (4 weeks)

---

## 🗄️ DATABASE SCHEMA

### **New Tables: 25**

#### **1. warehouses**
```sql
CREATE TABLE warehouses (
    warehouse_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_name VARCHAR(255) NOT NULL,
    warehouse_type VARCHAR(50), -- fulfillment, distribution, 3pl, cold_storage
    country VARCHAR(2) NOT NULL, -- ISO country code
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    operating_hours JSONB, -- {mon: "08:00-18:00", ...}
    total_capacity_sqm DECIMAL(10, 2),
    total_capacity_pallets INTEGER,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    customs_bonded BOOLEAN DEFAULT FALSE,
    certifications JSONB, -- ISO, FDA, etc.
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **2. warehouse_zones**
```sql
CREATE TABLE warehouse_zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    zone_code VARCHAR(50) NOT NULL,
    zone_name VARCHAR(255),
    zone_type VARCHAR(50), -- receiving, storage, picking, packing, shipping, returns
    temperature_zone VARCHAR(20), -- ambient, cold, frozen
    capacity_sqm DECIMAL(10, 2),
    capacity_pallets INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **3. warehouse_aisles**
```sql
CREATE TABLE warehouse_aisles (
    aisle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES warehouse_zones(zone_id),
    aisle_code VARCHAR(50) NOT NULL,
    aisle_number INTEGER,
    width_cm DECIMAL(10, 2),
    length_cm DECIMAL(10, 2),
    equipment_type VARCHAR(50), -- forklift, reach_truck, manual, robot
    status VARCHAR(20) DEFAULT 'active'
);
```

#### **4. storage_locations**
```sql
CREATE TABLE storage_locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    zone_id UUID REFERENCES warehouse_zones(zone_id),
    aisle_id UUID REFERENCES warehouse_aisles(aisle_id),
    location_code VARCHAR(100) UNIQUE NOT NULL, -- WH-NO-01-A-05-B-03
    location_type VARCHAR(50), -- shelf, pallet, floor, bin, buffer
    bay_number INTEGER,
    level_number INTEGER,
    position_number INTEGER,
    height_cm DECIMAL(10, 2),
    width_cm DECIMAL(10, 2),
    depth_cm DECIMAL(10, 2),
    max_weight_kg DECIMAL(10, 2),
    temperature_zone VARCHAR(20),
    accessibility VARCHAR(50), -- forklift, manual, robot, reach_truck
    pick_face BOOLEAN DEFAULT FALSE, -- Is this a primary pick location?
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved, damaged, maintenance
    current_product_id UUID,
    current_quantity INTEGER DEFAULT 0,
    last_movement_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **5. products**
```sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    manufacturer VARCHAR(255),
    
    -- Dimensions
    length_cm DECIMAL(10, 2),
    width_cm DECIMAL(10, 2),
    height_cm DECIMAL(10, 2),
    weight_kg DECIMAL(10, 3),
    volume_cm3 DECIMAL(15, 2),
    
    -- Packaging
    packaging_type VARCHAR(50), -- box, pallet, bag, envelope
    units_per_case INTEGER,
    cases_per_pallet INTEGER,
    
    -- Storage
    storage_requirements JSONB, -- {temp: "ambient", humidity: "low", ...}
    stackable BOOLEAN DEFAULT TRUE,
    max_stack_height INTEGER,
    fragile BOOLEAN DEFAULT FALSE,
    
    -- Pricing
    purchase_price DECIMAL(10, 2),
    sales_price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Customs & Compliance
    hs_code VARCHAR(20), -- Harmonized System code
    country_of_origin VARCHAR(2), -- ISO country code
    customs_value DECIMAL(10, 2),
    tariff_classification VARCHAR(100),
    export_restrictions JSONB,
    dangerous_goods BOOLEAN DEFAULT FALSE,
    dangerous_goods_class VARCHAR(20),
    certifications_required JSONB,
    
    -- Stock
    total_stock INTEGER DEFAULT 0,
    available_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    in_transit_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    lead_time_days INTEGER,
    last_stock_movement_at TIMESTAMP,
    
    -- Tracking
    lot_tracking BOOLEAN DEFAULT FALSE,
    serial_tracking BOOLEAN DEFAULT FALSE,
    expiry_tracking BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **6. product_images**
```sql
CREATE TABLE product_images (
    image_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id),
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- product, packaging, barcode, 360, damage_reference
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### **7. product_locations**
```sql
CREATE TABLE product_locations (
    product_location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id),
    location_id UUID REFERENCES storage_locations(location_id),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    quantity INTEGER NOT NULL,
    lot_number VARCHAR(100),
    batch_number VARCHAR(100),
    serial_numbers JSONB, -- Array of serial numbers
    expiry_date DATE,
    received_date DATE,
    status VARCHAR(20) DEFAULT 'available', -- available, reserved, quarantine, damaged
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **8. stock_movements**
```sql
CREATE TABLE stock_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    from_location_id UUID REFERENCES storage_locations(location_id),
    to_location_id UUID REFERENCES storage_locations(location_id),
    movement_type VARCHAR(50), -- receiving, putaway, picking, packing, transfer, adjustment, return
    quantity INTEGER NOT NULL,
    lot_number VARCHAR(100),
    batch_number VARCHAR(100),
    reference_type VARCHAR(50), -- order, transfer, adjustment, cycle_count
    reference_id UUID,
    reason TEXT,
    performed_by UUID REFERENCES users(user_id),
    movement_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **9. inbound_shipments**
```sql
CREATE TABLE inbound_shipments (
    shipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asn_number VARCHAR(100), -- Advanced Shipping Notice
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    supplier_id UUID,
    carrier VARCHAR(255),
    tracking_number VARCHAR(255),
    expected_arrival_date DATE,
    actual_arrival_date DATE,
    dock_door VARCHAR(50),
    appointment_time TIMESTAMP,
    status VARCHAR(50), -- scheduled, in_transit, arrived, receiving, completed, cancelled
    total_pallets INTEGER,
    total_cases INTEGER,
    total_units INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **10. inbound_shipment_items**
```sql
CREATE TABLE inbound_shipment_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES inbound_shipments(shipment_id),
    product_id UUID REFERENCES products(product_id),
    expected_quantity INTEGER,
    received_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    lot_number VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(50), -- pending, receiving, completed, discrepancy
    notes TEXT
);
```

#### **11. picking_tasks**
```sql
CREATE TABLE picking_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    order_id UUID REFERENCES orders(order_id),
    wave_id UUID, -- For wave picking
    picker_id UUID REFERENCES users(user_id),
    picking_method VARCHAR(50), -- single, batch, zone, wave, cluster
    priority INTEGER DEFAULT 5,
    status VARCHAR(50), -- pending, assigned, in_progress, completed, cancelled
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    pick_path JSONB, -- AI-optimized pick sequence
    total_items INTEGER,
    picked_items INTEGER DEFAULT 0,
    estimated_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **12. picking_task_items**
```sql
CREATE TABLE picking_task_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES picking_tasks(task_id),
    product_id UUID REFERENCES products(product_id),
    location_id UUID REFERENCES storage_locations(location_id),
    quantity_requested INTEGER,
    quantity_picked INTEGER DEFAULT 0,
    lot_number VARCHAR(100),
    sequence_number INTEGER, -- Pick order
    status VARCHAR(50), -- pending, picked, short_pick, substituted
    picked_at TIMESTAMP,
    notes TEXT
);
```

#### **13. packing_stations**
```sql
CREATE TABLE packing_stations (
    station_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    station_code VARCHAR(50) UNIQUE NOT NULL,
    station_name VARCHAR(255),
    zone_id UUID REFERENCES warehouse_zones(zone_id),
    equipment JSONB, -- {scale: true, printer: true, scanner: true, ...}
    status VARCHAR(20) DEFAULT 'active',
    current_packer_id UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **14. packing_tasks**
```sql
CREATE TABLE packing_tasks (
    packing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id),
    station_id UUID REFERENCES packing_stations(station_id),
    packer_id UUID REFERENCES users(user_id),
    status VARCHAR(50), -- pending, in_progress, completed, quality_check
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    box_size VARCHAR(50),
    box_weight_kg DECIMAL(10, 3),
    packing_materials JSONB, -- {bubble_wrap: 2m, tape: 1roll, ...}
    quality_check_passed BOOLEAN,
    photos JSONB, -- Array of photo URLs
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **15. cycle_counts**
```sql
CREATE TABLE cycle_counts (
    count_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    count_type VARCHAR(50), -- full, partial, abc, random
    scheduled_date DATE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    counter_id UUID REFERENCES users(user_id),
    status VARCHAR(50), -- scheduled, in_progress, completed, cancelled
    total_locations INTEGER,
    counted_locations INTEGER DEFAULT 0,
    discrepancies_found INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **16. cycle_count_items**
```sql
CREATE TABLE cycle_count_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_id UUID REFERENCES cycle_counts(count_id),
    location_id UUID REFERENCES storage_locations(location_id),
    product_id UUID REFERENCES products(product_id),
    system_quantity INTEGER,
    counted_quantity INTEGER,
    variance INTEGER,
    lot_number VARCHAR(100),
    counted_at TIMESTAMP,
    status VARCHAR(50), -- pending, counted, discrepancy, adjusted
    notes TEXT
);
```

#### **17. shipping_markets**
```sql
CREATE TABLE shipping_markets (
    market_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) NOT NULL, -- ISO country code
    country_name VARCHAR(255) NOT NULL,
    region VARCHAR(100), -- EU, Nordic, Asia, etc.
    customs_required BOOLEAN DEFAULT TRUE,
    documentation_requirements JSONB,
    prohibited_items JSONB,
    restricted_items JSONB,
    import_duties_info TEXT,
    certifications_required JSONB,
    language VARCHAR(10),
    currency VARCHAR(3),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **18. product_market_data**
```sql
CREATE TABLE product_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id),
    market_id UUID REFERENCES shipping_markets(market_id),
    allowed BOOLEAN DEFAULT TRUE,
    restrictions TEXT,
    special_requirements JSONB,
    local_hs_code VARCHAR(20),
    import_duty_rate DECIMAL(5, 2),
    vat_rate DECIMAL(5, 2),
    estimated_delivery_days INTEGER,
    popular_in_market BOOLEAN DEFAULT FALSE,
    sales_rank INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **19. warehouse_equipment**
```sql
CREATE TABLE warehouse_equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    equipment_type VARCHAR(50), -- forklift, reach_truck, pallet_jack, scanner, printer, robot
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    purchase_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, broken, retired
    assigned_to UUID REFERENCES users(user_id),
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **20. warehouse_performance_metrics**
```sql
CREATE TABLE warehouse_performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    metric_date DATE NOT NULL,
    
    -- Receiving
    shipments_received INTEGER DEFAULT 0,
    items_received INTEGER DEFAULT 0,
    receiving_time_avg_minutes DECIMAL(10, 2),
    receiving_accuracy_rate DECIMAL(5, 2),
    
    -- Putaway
    putaway_tasks INTEGER DEFAULT 0,
    putaway_time_avg_minutes DECIMAL(10, 2),
    
    -- Picking
    orders_picked INTEGER DEFAULT 0,
    items_picked INTEGER DEFAULT 0,
    pick_time_avg_minutes DECIMAL(10, 2),
    pick_accuracy_rate DECIMAL(5, 2),
    
    -- Packing
    orders_packed INTEGER DEFAULT 0,
    pack_time_avg_minutes DECIMAL(10, 2),
    
    -- Shipping
    orders_shipped INTEGER DEFAULT 0,
    
    -- Inventory
    inventory_accuracy_rate DECIMAL(5, 2),
    space_utilization_rate DECIMAL(5, 2),
    
    -- Labor
    labor_hours DECIMAL(10, 2),
    orders_per_labor_hour DECIMAL(10, 2),
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **21-25. Additional AI/Robotics Tables**
```sql
-- 21. ai_slotting_recommendations
-- 22. ai_pick_path_optimizations
-- 23. warehouse_robots
-- 24. robot_tasks
-- 25. warehouse_heatmaps
```

---

## 💰 COST BREAKDOWN

### **Development Costs:**

**Phase 1: Core WMS (Weeks 1-12) - $45,000**
- Multi-location management: $8,000
- Product data management: $10,000
- Storage management: $8,000
- Receiving & putaway: $7,000
- Picking & packing: $12,000

**Phase 2: Advanced Features (Weeks 13-20) - $28,000**
- Inventory optimization: $8,000
- Cycle counting: $5,000
- International shipping: $10,000
- Compliance management: $5,000

**Phase 3: AI Features (Weeks 21-32) - $124,000**
- 10 AI features for WMS: $124,000

**Total WMS Development: $197,000**
**Timeline: 32 weeks (8 months)**

---

## 📊 ROI ANALYSIS

### **Cost Savings:**
- Labor efficiency: +40% = $200,000/year
- Space optimization: +30% = $150,000/year
- Picking accuracy: 99.9% = $80,000/year saved
- Reduced shipping errors: $60,000/year
- Inventory accuracy: $100,000/year
- **Total Savings: $590,000/year**

### **Revenue Growth:**
- Faster fulfillment: +20% = $200,000/year
- International expansion: +30% = $300,000/year
- Multi-warehouse capability: +25% = $250,000/year
- **Total Revenue Growth: $750,000/year**

### **Total Benefit: $1,340,000/year**

**Investment: $197,000**  
**ROI: 580% Year 1**  
**Payback: 1.8 months**

---

## ⏰ IMPLEMENTATION TIMELINE

### **V4.0 Launch: Q1 2028**

**Month 1-3: Core WMS**
- Warehouse setup
- Product data migration
- Storage locations

**Month 4-5: Operations**
- Receiving & putaway
- Picking & packing
- Inventory management

**Month 6-8: AI Integration**
- Slotting optimization
- Pick path optimization
- Demand forecasting

---

## 🎯 SUCCESS METRICS

- **Picking accuracy:** 99.9%
- **Space utilization:** 85%+
- **Orders per labor hour:** 25+
- **Inventory accuracy:** 99.5%+
- **Fulfillment speed:** 2x faster
- **International orders:** 30% of total

---

**Status:** ✅ SPECIFICATION COMPLETE  
**Next:** Get approval for V4.0 development  
**Priority:** FUTURE (after V3.0 launch)

---

**LET'S BUILD THE SMARTEST WMS IN THE INDUSTRY! 🚀**
