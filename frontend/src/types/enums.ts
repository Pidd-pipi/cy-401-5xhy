export enum RequirementStatus {
  Draft = 'draft',
  Open = 'open',
  Bidding = 'bidding',
  InProgress = 'in_progress',
  PendingReview = 'pending_review',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export enum BidStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Withdrawn = 'withdrawn'
}

export enum ContractStatus {
  PendingSign = 'pending_sign',
  Active = 'active',
  PendingReview = 'pending_review',
  Completed = 'completed',
  Terminated = 'terminated'
}

export enum UserRole {
  Client = 'client',
  Freelancer = 'freelancer',
  Dual = 'dual'
}

export enum PaymentMode {
  Milestone = 'milestone',
  OneTime = 'one_time'
}
