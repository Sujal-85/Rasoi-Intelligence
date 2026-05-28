# Project Schema and Implementation Plan - e09a27

This document outlines the Supabase database schema and the step-by-step implementation plan for the "Rasoi Intelligence" platform, including multi-tenant access, AI analysis, and customer insights.

## 1. Database Schema (Supabase)

Below is the proposed schema to support restaurants, customers, transactions, and AI-generated insights.

### `restaurants`
- `id`: uuid (PK)
- `name`: text
- `email`: text (unique)
- `type`: text (e.g., 'Fine Dining', 'QSR')
- `location`: text
- `city`: text
- `capacity`: int
- `icon`: text
- `owner_id`: uuid (FK to auth.users)
- `ai_usage`: jsonb (track tokens, compute time, feature usage)
- `created_at`: timestamp

### `customers` (Global or per Restaurant)
- `id`: uuid (PK)
- `restaurant_id`: uuid (FK)
- `name`: text (pseudonymized)
- `phone`: text (pseudonymized)
- `email`: text (pseudonymized)
- `first_visit`: date
- `last_visit`: date
- `total_visits`: int
- `total_spend`: decimal
- `segment`: text (e.g., 'One-time', 'Regular', 'Churn-risk')

### `items`
- `id`: uuid (PK)
- `restaurant_id`: uuid (FK)
- `name`: text
- `category`: text
- `price`: decimal
- `is_veg`: boolean
- `popularity_score`: decimal

### `orders`
- `id`: uuid (PK)
- `restaurant_id`: uuid (FK)
- `customer_id`: uuid (FK)
- `order_date`: timestamp
- `total_amount`: decimal
- `payment_method`: text (UPI, Card, Cash)
- `source_file_id`: uuid (FK to file_uploads)

### `order_items`
- `id`: uuid (PK)
- `order_id`: uuid (FK)
- `item_id`: uuid (FK)
- `quantity`: int
- `unit_price`: decimal

### `file_uploads`
- `id`: uuid (PK)
- `restaurant_id`: uuid (FK)
- `file_name`: text
- `file_url`: text
- `status`: text (Pending, Processing, Completed, Failed)
- `file_type`: text (PDF, CSV, IMAGE)
- `processed_at`: timestamp

### `ai_insights` (Advanced)
- `id`: uuid (PK)
- `restaurant_id`: uuid (FK)
- `period`: text (e.g., 'March 2025')
- `type`: text (Customer, Menu, Revenue, Operations)
- `title`: text
- `summary`: text (plain English)
- `raw_analysis`: jsonb (stores the actual algorithm output, clusters, etc.)
- `confidence_score`: decimal (AI's confidence in this insight)
- `action_plan`: jsonb (list of specific steps with projected ROI)
- `data_points`: jsonb (specific metrics that led to this insight)
- `visual_config`: jsonb (suggested chart type and configuration for rendering)
- `tone`: text (green, amber, red, gold)
- `status`: text (New, Read, Dismissed, Implemented)
- `created_at`: timestamp

---

## 2. Implementation Plan

### Step 1: Foundation & Auth
- [ ] Create `.env` with Supabase credentials.
- [ ] Initialize Supabase client in `src/lib/supabase.ts`.
- [ ] Set up a separate `backend/` folder for Supabase migrations/functions.
- [ ] Implement Admin login logic (`admin@gmail.com` / `admin@123`).

### Step 2: Multi-tenant Data Flow
- [ ] Modify existing routes to fetch data from Supabase instead of mock files.
- [ ] Implement `useRestaurant` hook to manage the current restaurant's state.
- [ ] Create "Restaurant Onboarding" flow for new users.

### Step 3: File Upload & AI Integration
- [ ] Build the file upload UI with Supabase Storage integration.
- [ ] Implement an Edge Function (or backend service) to trigger AI analysis on upload.
- [ ] Integrate Claude/OpenAI for parsing and insight generation.

### Step 4: Advanced Insights & Algorithms
- [ ] Implement the clustering logic (Pre-clustering, PCVAR/Apriori) for customer segments.
- [ ] Create the "AI Bot" chat interface for data querying.
- [ ] Build visual "column-based" insight displays in the dashboard.

### Step 5: Final Refinement
- [ ] Polish the UI with gold gradients and premium styling.
- [ ] Ensure full data isolation between restaurants.
