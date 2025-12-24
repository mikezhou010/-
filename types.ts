export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  CONSULTANT = 'CONSULTANT'
}

export enum ProjectStatus {
  RECRUITING = 'RECRUITING', // 招募中
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  ACCEPTANCE = 'ACCEPTANCE', // 验收中
  COMPLETED = 'COMPLETED', // 已完成
  TERMINATED = 'TERMINATED', // 已终止/暂停
}

export enum ConsultantStatus {
  AVAILABLE = 'AVAILABLE', // 可接单
  PAUSED = 'PAUSED', // 暂停接单
  VACATION = 'VACATION', // 休假中
  BUSY = 'BUSY' // 项目中 (Calculated)
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budget: string;
  points?: number; // 积分
  requiredSkills: string[];
  ownerId: string; // Business User ID
  startDate: string;
  endDate: string;
  lastModified?: string; // 最后修改日期
}

export interface ConsultantProfile {
  userId: string;
  title: string;
  phone: string;
  skills: string[];
  preferredRoles: string[];
  preferredTasks: string[];
  location: string;
  status: ConsultantStatus;
  hourlyRate: string;
  bio: string;
}

// Combine User + Profile for the Consultant View
export interface Consultant extends User {
  profile?: ConsultantProfile;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ApplicationType {
  APPLICATION = 'APPLICATION', // Consultant applied
  INVITATION = 'INVITATION' // Business invited
}

export interface Application {
  id: string;
  projectId: string;
  consultantId: string;
  businessId: string;
  status: ApplicationStatus;
  type: ApplicationType;
  date: string;
}

export interface Review {
  id: string;
  projectId: string;
  consultantId: string;
  businessId: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  consultantProfiles: Record<string, ConsultantProfile>; // Keyed by userId
  projects: Project[];
  applications: Application[];
  reviews: Review[];
}