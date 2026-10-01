export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum TechnicianStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  TRAVELLING = 'travelling',
  OFFLINE = 'offline',
  ON_BREAK = 'on_break',
}

export enum ActivityType {
  FIBER_INSTALLATION = 'fiber_installation',
  ROUTER_INSTALLATION = 'router_installation',
  FIREWALL_INSTALLATION = 'firewall_installation',
  WIFI_SURVEY = 'wifi_survey',
  TROUBLESHOOTING = 'troubleshooting',
  MAINTENANCE = 'maintenance',
  HARDWARE_REPLACEMENT = 'hardware_replacement',
  OTHER = 'other',
}

export enum ActivityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ActivityStatus {
  DRAFT = 'draft',
  UNASSIGNED = 'unassigned',
  SCHEDULED = 'scheduled',
  TRAVELLING = 'travelling',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELAYED = 'delayed',
}

export enum PreferredTimeSlot {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  SPECIFIC_TIME = 'specific_time',
  FLEXIBLE = 'flexible',
}

export enum AssignmentSource {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  OPTIMIZED = 'optimized',
}

export enum AssignmentStatus {
  SUGGESTED = 'suggested',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum AttachmentType {
  PHOTO = 'photo',
  PDF = 'pdf',
  DOCUMENT = 'document',
  INSTALLATION_REPORT = 'installation_report',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum SiteType {
  MUNICIPALITY = 'municipality',
  SCHOOL = 'school',
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  RETAIL_STORE = 'retail_store',
  OTHER = 'other',
}
