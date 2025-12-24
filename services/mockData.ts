import { User, UserRole, Project, ProjectStatus, ConsultantProfile, ConsultantStatus, Application, ApplicationStatus, ApplicationType, Review } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'admin1', name: '系统管理员', role: UserRole.ADMIN, avatar: 'https://picsum.photos/100/100?random=1', email: 'admin@nexus.com' },
  { id: 'biz1', name: '市场部负责人', role: UserRole.BUSINESS, avatar: 'https://picsum.photos/100/100?random=2', email: 'marketing@nexus.com' },
  { id: 'biz2', name: '研发部总监', role: UserRole.BUSINESS, avatar: 'https://picsum.photos/100/100?random=3', email: 'tech@nexus.com' },
  { id: 'cons1', name: '张伟 (高级架构师)', role: UserRole.CONSULTANT, avatar: 'https://picsum.photos/100/100?random=4', email: 'zhang@expert.com' },
  { id: 'cons2', name: '李娜 (资深UI设计)', role: UserRole.CONSULTANT, avatar: 'https://picsum.photos/100/100?random=5', email: 'li@design.com' },
  { id: 'cons3', name: '王强 (数据分析师)', role: UserRole.CONSULTANT, avatar: 'https://picsum.photos/100/100?random=6', email: 'wang@data.com' },
];

export const MOCK_PROFILES: Record<string, ConsultantProfile> = {
  'cons1': {
    userId: 'cons1',
    title: '高级系统架构师',
    phone: '13800138000',
    skills: ['React', 'Node.js', 'AWS', 'Microservices'],
    preferredRoles: ['架构师', '技术顾问'],
    preferredTasks: ['系统重构', '技术选型'],
    location: '北京',
    status: ConsultantStatus.AVAILABLE,
    hourlyRate: '¥1500',
    bio: '10年全栈开发与架构经验，擅长高并发系统设计。'
  },
  'cons2': {
    userId: 'cons2',
    title: '资深UI/UX设计师',
    phone: '13900139000',
    skills: ['Figma', 'Sketch', 'User Research', 'Prototyping'],
    preferredRoles: ['设计总监', '交互设计师'],
    preferredTasks: ['APP设计', 'Web改版'],
    location: '上海',
    status: ConsultantStatus.BUSY,
    hourlyRate: '¥800',
    bio: '专注于用户体验设计，曾主导多个百万级用户产品的设计工作。'
  },
  'cons3': {
    userId: 'cons3',
    title: '数据科学家',
    phone: '13700137000',
    skills: ['Python', 'TensorFlow', 'SQL', 'Data Visualization'],
    preferredRoles: ['数据分析师', '算法工程师'],
    preferredTasks: ['数据挖掘', 'BI报表'],
    location: '深圳',
    status: ConsultantStatus.VACATION,
    hourlyRate: '¥1200',
    bio: '擅长从海量数据中挖掘商业价值。'
  }
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj1',
    title: 'Q4 营销活动H5开发',
    description: '需要开发一套用于年底大促的交互式H5，支持微信分享和数据统计。项目旨在通过高品质的视觉呈现和流畅的交互体验，提升品牌影响力，增加用户参与度。',
    status: ProjectStatus.RECRUITING,
    budget: '¥50,000',
    points: 500,
    requiredSkills: ['H5', 'React', 'Animation'],
    ownerId: 'biz1',
    startDate: '2023-11-01',
    endDate: '2023-12-31'
  },
  {
    id: 'proj2',
    title: '内部CRM系统重构',
    description: '对现有的CRM系统进行微服务化改造，提升系统性能和扩展性。涉及技术选型、架构设计以及核心模块的开发工作。',
    status: ProjectStatus.IN_PROGRESS,
    budget: '¥200,000',
    points: 2000,
    requiredSkills: ['Java', 'Spring Cloud', 'MySQL'],
    ownerId: 'biz2',
    startDate: '2023-10-01',
    endDate: '2024-03-31'
  },
  {
    id: 'proj3',
    title: '新产品用户体验调研',
    description: '针对新上线的SaaS产品进行用户访谈和可用性测试。输出完整的调研报告及后续优化建议。',
    status: ProjectStatus.COMPLETED,
    budget: '¥30,000',
    points: 300,
    requiredSkills: ['User Research', 'Interview'],
    ownerId: 'biz1',
    startDate: '2023-08-01',
    endDate: '2023-09-01'
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app1',
    projectId: 'proj1',
    consultantId: 'cons2',
    businessId: 'biz1',
    status: ApplicationStatus.PENDING,
    type: ApplicationType.INVITATION,
    date: '2023-10-25'
  },
  {
    id: 'app2',
    projectId: 'proj2',
    consultantId: 'cons1',
    businessId: 'biz2',
    status: ApplicationStatus.ACCEPTED,
    type: ApplicationType.APPLICATION,
    date: '2023-09-15'
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev1',
    projectId: 'proj3',
    consultantId: 'cons2',
    businessId: 'biz1',
    rating: 5,
    comment: '非常专业的设计师，交付物质量很高！',
    date: '2023-09-05'
  }
];