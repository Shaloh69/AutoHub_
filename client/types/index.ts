// ==========================================
// types/index.ts - Complete Type Definitions (NORMALIZED & UPPERCASE)
// Updated to match normalized database schema v4.0
// ==========================================

// User enums - UPPERCASE to match normalized SQL schema
export type UserRole = 'BUYER' | 'SELLER' | 'DEALER' | 'ADMIN' | 'MODERATOR';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type VerificationLevel = 'NONE' | 'EMAIL' | 'PHONE' | 'IDENTITY' | 'BUSINESS';
export type IDType = 'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'VOTERS_ID';

// Car enums - UPPERCASE to match normalized SQL schema
export type CarStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'SOLD' | 'RESERVED' | 'INACTIVE' | 'REJECTED' | 'EXPIRED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUG_IN_HYBRID';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'DCT';
export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4WD';
export type ConditionRating = 'BRAND_NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type BodyType = 'SEDAN' | 'SUV' | 'PICKUP' | 'VAN' | 'HATCHBACK' | 'COUPE' | 'MPV' | 'CROSSOVER' | 'WAGON' | 'CONVERTIBLE';
export type MileageUnit = 'KM' | 'MILES';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
export type RegistrationStatus = 'REGISTERED' | 'UNREGISTERED' | 'EXPIRED' | 'FOR_RENEWAL';
export type ORCRStatus = 'COMPLETE' | 'INCOMPLETE' | 'PROCESSING' | 'LOST';
export type InsuranceStatus = 'ACTIVE' | 'EXPIRED' | 'NONE';

// Inquiry enums - UPPERCASE to match normalized SQL schema
export type InquiryType = 'GENERAL' | 'TEST_DRIVE' | 'PRICE_NEGOTIATION' | 'INSPECTION' | 'PURCHASE_INTENT' | 'FINANCING' | 'TRADE_IN';
export type InquiryStatus = 'NEW' | 'READ' | 'REPLIED' | 'IN_NEGOTIATION' | 'TEST_DRIVE_SCHEDULED' | 'CLOSED' | 'CONVERTED' | 'SPAM';
export type InquiryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Subscription enums - UPPERCASE to match normalized SQL schema
export type SubscriptionStatus = 'FREE' | 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';

// Other enums - UPPERCASE to match normalized SQL schema
export type CityType = 'CITY' | 'MUNICIPALITY' | 'DISTRICT';
export type ColorCategory = 'PRIMARY' | 'NEUTRAL' | 'METALLIC' | 'SPECIAL';
export type FeatureCategory = 'SAFETY' | 'COMFORT' | 'TECHNOLOGY' | 'PERFORMANCE' | 'EXTERIOR' | 'INTERIOR';
export type ImageType = 'EXTERIOR' | 'INTERIOR' | 'ENGINE' | 'DAMAGE' | 'DOCUMENT' | 'OTHER';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_number?: string; // Backend returns phone_number for public profiles
  role: UserRole;
  gender?: Gender;
  profile_image?: string;
  bio?: string;
  city_id?: number;
  province_id?: number;
  region_id?: number;
  city?: string; // City name for public profiles
  province?: string; // Province name for public profiles
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  business_verified: boolean;
  verification_level: VerificationLevel;
  is_verified?: boolean; // Alias for identity_verified in public profiles
  is_banned: boolean;
  business_name?: string;
  business_address?: string;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  total_views: number;
  average_rating: number;
  total_ratings: number;
  total_reviews?: number; // Total reviews received (used in seller profiles)
  positive_feedback: number;
  negative_feedback: number;
  response_rate: number;
  subscription_status: SubscriptionStatus;
  created_at: string;
  member_since?: string; // Alias for created_at in public profiles
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  country_of_origin?: string;
  is_popular: boolean;
  total_models: number;
  total_listings: number;
}

export interface Model {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  model_type: BodyType;
  description?: string;
  year_introduced?: number;
  is_active: boolean;
  total_listings: number;
}

export interface Category {
  id: number;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  total_listings: number;
}

export interface Feature {
  id: number;
  name: string;
  slug: string;
  category: FeatureCategory;
  description?: string;
  icon?: string;
  is_premium: boolean;
  display_order: number;
}

export interface Color {
  id: number;
  name: string;
  hex_code?: string;
  category: ColorCategory;
  is_popular: boolean;
}

export interface PhRegion {
  id: number;
  region_code: string;
  name: string;
  long_name?: string;
  is_active: boolean;
}

export interface PhProvince {
  id: number;
  region_id: number;
  province_code: string;
  name: string;
  capital?: string;
  is_active: boolean;
}

export interface PhCity {
  id: number;
  province_id: number;
  city_code?: string;
  name: string;
  city_type: CityType;
  is_highly_urbanized: boolean;
  latitude: number;
  longitude: number;
  zip_code?: string;
  population: number;
  is_capital: boolean;
  is_active: boolean;
}

export interface Location {
  city_id?: number;
  province_id?: number;
  region_id?: number;
  city_name?: string;
  province_name?: string;
  region_name?: string;
  latitude?: number;
  longitude?: number;
}

// NORMALIZED Car Interface - Using FKs only, no duplicate string fields
export interface Car {
  id: number;
  seller_id: number;
  brand_id: number;
  model_id: number;
  category_id?: number;
  color_id?: number;
  interior_color_id?: number;

  // Basic Info
  title: string;
  description?: string;
  year: number;
  trim?: string;

  // Pricing (NORMALIZED - using currency_id FK only)
  price: number;
  currency_id: number;
  original_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  price_negotiable: boolean;

  // Vehicle Details
  vin_number?: string;
  plate_number?: string;
  engine_number?: string;
  chassis_number?: string;
  body_type?: BodyType;

  // Technical (NORMALIZED - no engine_type, only fuel_type)
  mileage: number;
  mileage_unit: MileageUnit;
  fuel_type: FuelType;
  transmission: TransmissionType;
  engine_size?: string;
  cylinders?: number;
  horsepower?: number;
  torque?: number;
  fuel_economy_city?: number;
  fuel_economy_highway?: number;
  drivetrain?: DrivetrainType;
  seats?: number;
  doors?: number;

  // Condition (NORMALIZED - using car_condition only)
  car_condition: ConditionRating;
  accident_history: boolean;
  accident_details?: string;
  flood_history: boolean;
  number_of_owners: number;
  service_history_available: boolean;

  // Documentation (NORMALIZED ENUMs)
  registration_status: RegistrationStatus;
  registration_expiry?: string;
  or_cr_status: ORCRStatus;
  lto_registered: boolean;
  deed_of_sale_available: boolean;
  has_emission_test: boolean;
  casa_maintained: boolean;

  // Insurance & Warranty (NORMALIZED ENUMs)
  insurance_status: InsuranceStatus;
  insurance_expiry?: string;
  warranty_remaining: boolean;
  warranty_details?: string;
  warranty_expiry?: string;

  // Finance Options
  financing_available: boolean;
  trade_in_accepted: boolean;
  installment_available: boolean;

  // Location
  city_id: number;
  province_id: number;
  region_id: number;
  detailed_address?: string;
  barangay?: string;
  latitude?: number;
  longitude?: number;

  // Media
  main_image?: string;
  total_images: number;
  video_url?: string;
  virtual_tour_url?: string;

  // Status
  status: CarStatus;
  approval_status: ApprovalStatus;
  visibility: Visibility;
  rejection_reason?: string;
  is_featured: boolean;
  is_premium: boolean;
  is_active: boolean;
  verified: boolean;
  featured_until?: string;
  premium_until?: string;
  boosted_until?: string;

  // SEO
  seo_slug: string;
  meta_title?: string;
  meta_description?: string;
  search_keywords?: string;

  // Metrics (NORMALIZED - using views_count only)
  views_count: number;
  unique_views_count: number;
  inquiry_count: number;
  contact_count: number;
  click_count: number;
  favorite_count: number;
  average_rating: number;
  quality_score: number;
  completeness_score: number;
  ranking_score: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
  sold_at?: string;

  // Relations (populated by joins)
  brand?: Brand;
  model?: Model;
  brand_rel?: Brand;  // Backend uses brand_rel to avoid column name conflict
  model_rel?: Model;  // Backend uses model_rel to avoid column name conflict
  category?: Category;
  color?: Color;
  interior_color?: Color;
  color_rel?: Color;  // Backend uses color_rel to avoid column name conflict
  interior_color_rel?: Color;  // Backend uses interior_color_rel to avoid column name conflict
  currency_rel?: { id: number; code: string; name: string; symbol: string };  // Backend currency relationship
  city?: PhCity;  // Backend populates city via relationship
  province?: PhProvince;  // Backend populates province via relationship
  region?: PhRegion;  // Backend populates region via relationship
  seller?: User;
  images?: CarImage[];
  features?: Feature[];
  location?: Location;
}

export interface CarImage {
  id: number;
  car_id: number;
  image_url: string;
  image_type: ImageType;
  is_main: boolean;
  display_order: number;
  caption?: string;
  uploaded_at?: string;
}

export interface Inquiry {
  id: number;
  car_id: number;
  buyer_id?: number;
  seller_id: number;
  subject?: string;
  message: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  inquiry_type: InquiryType;
  offered_price?: number;
  test_drive_requested: boolean;
  inspection_requested: boolean;
  financing_needed: boolean;
  trade_in_vehicle: boolean;
  status: InquiryStatus;
  is_read: boolean;
  priority: InquiryPriority;
  response_count: number;
  last_response_at?: string;
  buyer_rating?: number;
  seller_rating?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  car?: Car;
  buyer?: User;
  seller?: User;
  responses?: InquiryResponse[];
}

export interface InquiryResponse {
  id: number;
  inquiry_id: number;
  user_id: number;
  message: string;
  is_from_seller: boolean;
  created_at: string;
  user?: User;
}

export interface Transaction {
  id: number;
  car_id: number;
  seller_id: number;
  buyer_id: number;
  inquiry_id?: number;
  transaction_type: 'SALE' | 'RESERVATION' | 'DEPOSIT';
  agreed_price: number;
  currency_id: number;
  deposit_amount?: number;
  final_amount?: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'FINANCING' | 'TRADE_IN' | 'MIXED';
  payment_status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  has_trade_in: boolean;
  trade_in_car_id?: number;
  trade_in_value?: number;
  seller_notes?: string;
  buyer_notes?: string;
  admin_notes?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  car?: Car;
  seller?: User;
  buyer?: User;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency_id: number;
  billing_cycle: BillingCycle;
  max_listings: number;
  max_photos_per_listing: number;
  max_featured_listings: number;
  can_add_video: boolean;
  can_add_virtual_tour: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
  featured_badge: boolean;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';
  billing_cycle: BillingCycle;
  auto_renew: boolean;
  subscribed_at: string;
  current_period_start?: string;
  current_period_end?: string;
  next_billing_date?: string;
  started_at: string;
  expires_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  related_id?: number;
  related_type?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchFilters {
  q?: string;
  brand_id?: number;
  model_id?: number;
  category_id?: number;
  color_id?: number;
  seller_id?: number; // Filter by seller
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  fuel_type?: FuelType;
  transmission?: TransmissionType;
  min_mileage?: number;
  max_mileage?: number;
  car_condition?: ConditionRating;
  approval_status?: ApprovalStatus;
  city_id?: number;
  province_id?: number;
  region_id?: number;
  is_featured?: boolean;
  price_negotiable?: boolean;
  financing_available?: boolean;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}

// NORMALIZED CarFormData - Using FKs only
export interface CarFormData {
  brand_id: number;
  model_id: number;
  category_id?: number;
  color_id?: number;
  interior_color_id?: number;
  title: string;
  description?: string;
  year: number;
  trim?: string;
  price: number;
  currency_id: number;
  price_negotiable: boolean;
  vin_number?: string;
  plate_number?: string;
  mileage: number;
  mileage_unit: MileageUnit;
  fuel_type: FuelType;
  transmission: TransmissionType;
  engine_size?: string;
  cylinders?: number;
  horsepower?: number;
  torque?: number;
  drivetrain?: DrivetrainType;
  seats?: number;
  doors?: number;
  body_type?: BodyType;
  car_condition: ConditionRating;
  accident_history: boolean;
  accident_details?: string;
  flood_history: boolean;
  number_of_owners: number;
  service_history_available: boolean;
  registration_status: RegistrationStatus;
  registration_expiry?: string;
  or_cr_status: ORCRStatus;
  lto_registered: boolean;
  deed_of_sale_available: boolean;
  has_emission_test: boolean;
  casa_maintained: boolean;
  insurance_status: InsuranceStatus;
  insurance_expiry?: string;
  warranty_remaining: boolean;
  warranty_details?: string;
  warranty_expiry?: string;
  financing_available: boolean;
  trade_in_accepted: boolean;
  installment_available: boolean;
  city_id: number;
  detailed_address?: string;
  barangay?: string;
  latitude?: number;
  longitude?: number;
  feature_ids?: number[];
}

export interface Analytics {
  total_listings: number;
  active_listings: number;
  total_views: number;
  total_inquiries: number;
  total_favorites?: number;
  avg_response_time?: number;
}

export interface DashboardStats {
  // User Statistics
  total_users: number;
  active_users: number;
  verified_users: number;
  banned_users: number;
  buyers_count: number;
  sellers_count: number;
  dealers_count: number;
  new_users_today: number;

  // Car Statistics
  total_cars: number;
  active_cars: number;
  pending_approval_cars: number;
  new_cars_today: number;

  // Reports
  pending_reports: number;
  resolved_reports: number;

  // Payments
  pending_payments: number;
  verified_payments_today: number;

  // Security
  fraud_indicators: number;
  high_severity_fraud: number;

  // Legacy fields for backward compatibility (computed)
  totalUsers?: number;
  activeListings?: number;
  pendingApprovals?: number;
  totalRevenue?: number;
  revenueToday?: number;
  carsSoldToday?: number;
  newUsersToday?: number;
}
