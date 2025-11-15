// ==========================================
// types/index.ts - Complete Type Definitions
// ==========================================

// User enums - lowercase to match SQL schema
export type UserRole = 'buyer' | 'seller' | 'dealer' | 'admin' | 'moderator';

// Car enums - match SQL schema casing exactly
export type CarStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'SOLD' | 'RESERVED' | 'INACTIVE' | 'REJECTED' | 'EXPIRED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'DCT';
export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4WD';
export type ConditionRating = 'BRAND_NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type BodyType = 'sedan' | 'suv' | 'pickup' | 'van' | 'hatchback' | 'coupe' | 'mpv' | 'crossover' | 'wagon' | 'convertible';
export type EngineType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plug-in-hybrid';
export type Visibility = 'public' | 'private' | 'unlisted';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: UserRole;
  profile_image?: string;
  bio?: string;
  city_id?: number;
  province_id?: number;
  region_id?: number;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  business_verified: boolean;
  is_banned: boolean;
  business_name?: string;
  business_address?: string;
  business_registration?: string;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  total_views: number;
  average_rating: number;
  total_ratings: number;
  positive_feedback: number;
  negative_feedback: number;
  response_rate: number;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
  country_of_origin?: string;
  is_popular_in_ph: boolean;
  model_count: number;
}

export interface Model {
  id: number;
  brand_id: number;
  name: string;
  body_type?: string;
  generation?: string;
  year_start?: number;
  year_end?: number;
  is_popular_in_ph: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface Feature {
  id: number;
  name: string;
  category: 'safety' | 'comfort' | 'entertainment' | 'technology' | 'performance' | 'exterior' | 'interior';
  description?: string;
  icon?: string;
  is_premium: boolean;
  is_popular: boolean;
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

export interface Car {
  id: number;
  seller_id: number;
  brand_id: number;
  model_id: number;
  category_id?: number;
  
  // Basic Info
  title: string;
  description?: string;
  year: number;
  
  // Pricing
  price: number;
  currency: string;
  original_price?: number;
  discount_percentage?: number;
  negotiable: boolean;
  
  // Technical
  mileage: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  engine_size?: string;
  horsepower?: number;
  torque?: number;
  drivetrain?: DrivetrainType;
  seats?: number;
  doors?: number;
  
  // Exterior
  exterior_color: string;
  color_type?: string;
  
  // Condition
  condition_rating: ConditionRating;
  accident_history: boolean;
  accident_details?: string;
  flood_history: boolean;
  number_of_owners: number;
  service_history_available: boolean;
  
  // Documentation
  registration_status: string;
  or_cr_status: string;
  lto_registered: boolean;
  deed_of_sale_available: boolean;
  casa_maintained: boolean;
  
  // Insurance & Warranty
  insurance_status: string;
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
  
  // Status
  status: CarStatus;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  is_featured: boolean;
  is_premium: boolean;
  is_active: boolean;
  featured_until?: string;
  premium_until?: string;
  boosted_until?: string;
  
  // SEO
  seo_slug: string;
  meta_title?: string;
  meta_description?: string;
  
  // Metrics
  views_count: number;
  unique_views_count: number;
  contact_count: number;
  favorite_count: number;
  average_rating: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
  sold_at?: string;
  
  // Relations
  brand?: Brand;
  model?: Model;
  category?: Category;
  seller?: User;
  images?: CarImage[];
  features?: Feature[];
  location?: Location;
}

export interface CarImage {
  id: number;
  car_id: number;
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  file_name: string;
  file_size: number;
  image_type: string;
  is_primary: boolean;
  display_order: number;
  width?: number;
  height?: number;
}

export interface Inquiry {
  id: number;
  car_id: number;
  buyer_id?: number;
  seller_id: number;
  subject: string;
  message: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  status: 'new' | 'read' | 'replied' | 'in_negotiation' | 'test_drive_scheduled' | 'closed' | 'converted' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
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
  is_seller_response: boolean;
  created_at: string;
  user?: User;
}

export interface Transaction {
  id: number;
  car_id: number;
  seller_id: number;
  buyer_id: number;
  inquiry_id?: number;
  agreed_price: number;
  original_price: number;
  currency: string;
  payment_method: 'cash' | 'bank_transfer' | 'financing' | 'installment';
  status: 'pending' | 'deposit_paid' | 'financing_approved' | 'documents_ready' | 'completed' | 'cancelled' | 'disputed';
  deposit_amount?: number;
  balance_amount?: number;
  financing_provider?: string;
  down_payment?: number;
  monthly_installment?: number;
  installment_months?: number;
  trade_in_accepted: boolean;
  trade_in_value?: number;
  trade_in_vehicle_details?: string;
  documents_verified: boolean;
  payment_verified: boolean;
  transfer_completed: boolean;
  initiated_at: string;
  deposit_paid_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  car?: Car;
  seller?: User;
  buyer?: User;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  tier: 'free' | 'basic' | 'professional' | 'premium' | 'enterprise';
  monthly_price: number;
  annual_price: number;
  currency: string;
  max_active_listings: number;
  max_featured_listings: number;
  max_premium_listings: number;
  max_images_per_listing: number;
  max_storage_mb: number;
  boost_credits_per_month: number;
  analytics_access: boolean;
  priority_support: boolean;
  can_export_data: boolean;
  api_access: boolean;
  is_active: boolean;
  features: string[];
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  billing_cycle: 'monthly' | 'annual';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  plan?: SubscriptionPlan;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
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
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  fuel_type?: FuelType;
  transmission?: TransmissionType;
  min_mileage?: number;
  max_mileage?: number;
  condition_rating?: ConditionRating;
  city_id?: number;
  province_id?: number;
  region_id?: number;
  is_featured?: boolean;
  negotiable?: boolean;
  financing_available?: boolean;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface CarFormData {
  brand_id: number;
  model_id: number;
  category_id?: number;
  title: string;
  description?: string;
  year: number;
  price: number;
  negotiable: boolean;
  mileage: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  engine_size?: string;
  horsepower?: number;
  torque?: number;
  drivetrain?: DrivetrainType;
  seats?: number;
  doors?: number;
  exterior_color: string;
  color_type?: string;
  condition_rating: ConditionRating;
  accident_history: boolean;
  accident_details?: string;
  flood_history: boolean;
  number_of_owners: number;
  service_history_available: boolean;
  registration_status: string;
  or_cr_status: string;
  lto_registered: boolean;
  deed_of_sale_available: boolean;
  casa_maintained: boolean;
  insurance_status: string;
  warranty_remaining: boolean;
  warranty_details?: string;
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
  totalUsers: number;
  activeListings: number;
  pendingApprovals: number;
  totalRevenue: number;
  revenueToday: number;
  carsSoldToday: number;
  newUsersToday: number;
}