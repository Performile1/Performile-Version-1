// =====================================================
// Claims Management Types
// =====================================================

export enum ClaimType {
  DAMAGED = 'damaged',
  LOST = 'lost',
  DELAYED = 'delayed',
  MISSING_ITEMS = 'missing_items',
  WRONG_DELIVERY = 'wrong_delivery',
  OTHER = 'other'
}

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CLOSED = 'closed'
}

export enum DocumentType {
  PHOTO_DAMAGE = 'photo_damage',
  PHOTO_PACKAGING = 'photo_packaging',
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  PROOF_OF_VALUE = 'proof_of_value',
  CORRESPONDENCE = 'correspondence',
  OTHER = 'other'
}

export interface Claim {
  claim_id: string;
  order_id?: string;
  tracking_number?: string;
  courier: string;
  claim_type: ClaimType;
  claim_status: ClaimStatus;
  claim_number?: string;
  
  // Claimant
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone?: string;
  
  // Incident
  incident_date: Date;
  incident_description: string;
  incident_location?: string;
  
  // Financial
  declared_value?: number;
  claimed_amount: number;
  approved_amount?: number;
  currency: string;
  
  // Evidence
  photos?: string[];
  documents?: string[];
  proof_of_value?: string;
  
  // Submission
  submitted_to_courier: boolean;
  submission_date?: Date;
  courier_claim_id?: string;
  courier_response?: any;
  
  // Resolution
  resolution_date?: Date;
  resolution_notes?: string;
  refund_method?: string;
  refund_reference?: string;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface ClaimTimelineEvent {
  timeline_id: string;
  claim_id: string;
  event_type: string;
  event_description: string;
  event_data?: any;
  actor_id?: string;
  actor_name?: string;
  actor_type: string;
  created_at: Date;
}

export interface ClaimTemplate {
  template_id: string;
  courier_name: string;
  required_fields: string[];
  optional_fields?: string[];
  field_mappings: Record<string, string>;
  submission_method: 'api' | 'email' | 'web_form' | 'manual';
  api_endpoint?: string;
  submission_email?: string;
  web_form_url?: string;
  max_claim_amount?: number;
  claim_deadline_days: number;
  photo_required: boolean;
  receipt_required: boolean;
  instructions?: string;
  notes?: string;
}

export interface ClaimDocument {
  document_id: string;
  claim_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  uploaded_at: Date;
}

export interface ClaimNote {
  note_id: string;
  claim_id: string;
  note_text: string;
  is_internal: boolean;
  author_id: string;
  author_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateClaimRequest {
  order_id?: string;
  tracking_number?: string;
  courier: string;
  claim_type: ClaimType;
  incident_date: Date;
  incident_description: string;
  incident_location?: string;
  claimed_amount: number;
  declared_value?: number;
  photos?: File[];
  documents?: File[];
}

export interface ClaimSummary {
  total_claims: number;
  pending_claims: number;
  approved_claims: number;
  total_claimed: number;
  total_approved: number;
}
