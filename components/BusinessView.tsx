import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { ProjectStatus, ConsultantStatus, ApplicationType, ApplicationStatus, Project, ConsultantProfile } from '../types';
import { 
    LayoutGrid, List, Plus, Search, Filter, Briefcase, UserCheck, 
    MoreHorizontal, CheckCircle, XCircle, Clock, Sparkles, X, Calendar, DollarSign, Layers,
    MapPin, Mail, Phone, User, Settings, Wand2, Camera, Star, Edit2, Save, Power, Award, ArrowLeft
} from 'lucide-react';
import { recommendConsultantsForProject, optimizeProjectDescription, generateAvatarImage } from '../services/geminiService';

const STATUS_LABELS: Record<string, string> = {
    [ProjectStatus.RECRUITING]: '招募中',
    [ProjectStatus.IN_PROGRESS]: '进行中',
    [ProjectStatus.ACCEPTANCE]: '验收中',
    [ProjectStatus.COMPLETED]: '已完成',
    [ProjectStatus.TERMINATED]: '已下线/终止',
};

const CONSULTANT_STATUS_LABELS: Record<string, string> = {
    [ConsultantStatus.AVAILABLE]: '空闲中',
    [ConsultantStatus.BUSY]: '项目中',
    [ConsultantStatus.VACATION]: '休假中',
    [ConsultantStatus.PAUSED]: '暂停接单',
};

const BusinessView: React.FC = () => {
    const { 
        projects, setProjects, 
        users, currentUser, 
        consultantProfiles, 
        applications, setApplications,
        updateUser,
        reviews, setReviews
    } = useContext(AppContext);

    const [activeTab, setActiveTab] = useState<'PROJECTS' | 'POOL'>('PROJECTS');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    
    // Project Filters
    const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'ALL'>('ALL');
    
    // Consultant Filters
    const [consultantFilter, setConsultantFilter] = useState<ConsultantStatus | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // AI Recommendation State
    const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [selectedProjectForAi, setSelectedProjectForAi] = useState<string | null>(null);

    // --- Modal States ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [viewingConsultant, setViewingConsultant] = useState<typeof allConsultants[0] | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    
    // Avatar Generator State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);

    // Review State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', projectId: '', consultantId: '' });

    // New/Edit Project Form State
    const [projectForm, setProjectForm] = useState({
        title: '',
        description: '',
        budget: '',
        points: '',
        skills: '',
        startDate: '',
        endDate: ''
    });

    // --- Computed Data ---
    
    const myProjects = projects.filter(p => p.ownerId === currentUser?.id);
    
    const filteredProjects = myProjects.filter(p => 
        projectFilter === 'ALL' || p.status === projectFilter
    );

    const allConsultants = users.filter(u => u.role === 'CONSULTANT').map(u => {
        const userReviews = reviews.filter(r => r.consultantId === u.id);
        const avgRating = userReviews.length > 0 
            ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length 
            : 0;

        return {
            ...u,
            profile: consultantProfiles[u.id],
            rating: avgRating,
            reviewCount: userReviews.length
        }
    });

    const filteredConsultants = allConsultants.filter(c => {
        const matchesStatus = consultantFilter === 'ALL' || c.profile?.status === consultantFilter;
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.profile?.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // --- Actions ---

    const handleCreateProject = () => {
        if (!projectForm.title || !projectForm.description) {
            alert("请填写完整的项目信息");
            return;
        }

        const newProject: Project = {
            id: `proj-${Date.now()}`,
            title: projectForm.title,
            description: projectForm.description,
            status: ProjectStatus.RECRUITING,
            budget: projectForm.budget,
            points: parseInt(projectForm.points) || 0,
            requiredSkills: projectForm.skills.split(',').map(s => s.trim()).filter(s => s),
            ownerId: currentUser?.id || 'unknown',
            startDate: projectForm.startDate,
            endDate: projectForm.endDate
        };

        setProjects(prev => [newProject, ...prev]);
        setIsCreateModalOpen(false);
    };

    const handleSaveEditedProject = () => {
        if (!viewingProject) return;
        
        const updatedProject: Project = {
            ...viewingProject,
            title: projectForm.title,
            description: projectForm.description,
            budget: projectForm.budget,
            points: parseInt(projectForm.points) || 0,
            requiredSkills: projectForm.skills.split(',').map(s => s.trim()).filter(s => s),
            startDate: projectForm.startDate,
            endDate: projectForm.endDate,
            lastModified: new Date().toISOString().split('T')[0]
        };

        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        setViewingProject(updatedProject);
        setIsEditingProject(false);
    };

    const handleTakeProjectOffline = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!viewingProject) return;
        if (!confirm('确定要将该任务下线吗？下线后将不再招募顾问。')) return;

        const updatedProject: Project = {
            ...viewingProject,
            status: ProjectStatus.TERMINATED,
            lastModified: new Date().toISOString().split('T')[0]
        };

        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        setViewingProject(updatedProject);
    };

    const handleStartEdit = () => {
        if (!viewingProject) return;
        setProjectForm({
            title: viewingProject.title,
            description: viewingProject.description,
            budget: viewingProject.budget,
            points: viewingProject.points?.toString() || '0',
            skills: viewingProject.requiredSkills.join(', '),
            startDate: viewingProject.startDate,
            endDate: viewingProject.endDate
        });
        setIsEditingProject(true);
    };

    const handleAiOptimize = async () => {
        if (!projectForm.description) return;
        setIsOptimizing(true);
        const result = await optimizeProjectDescription(projectForm.description);
        
        const currentSkills = projectForm.skills.split(',').map(s => s.trim()).filter(s => s);
        const uniqueSkills = Array.from(new Set([...currentSkills, ...result.skills]));

        setProjectForm(prev => ({
            ...prev,
            description: result.refined,
            skills: uniqueSkills.join(', ')
        }));
        setIsOptimizing(false);
    };

    const handleInvite = (consultantId: string) => {
        const project = myProjects.find(p => p.status === ProjectStatus.RECRUITING);
        if (!project) {
            alert('请先创建一个招募中的项目');
            return;
        }
        
        const newApp = {
            id: `app-${Date.now()}`,
            projectId: project.id,
            businessId: currentUser!.id,
            consultantId,
            status: ApplicationStatus.PENDING,
            type: ApplicationType.INVITATION,
            date: new Date().toISOString().split('T')[0]
        };
        setApplications([...applications, newApp]);
        alert(`已邀请 ${allConsultants.find(c => c.id === consultantId)?.name} 加入项目 "${project.title}"`);
    };

    const handleAiRecommend = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setIsThinking(true);
        setSelectedProjectForAi(project.id);
        const profiles = Object.values(consultantProfiles) as ConsultantProfile[];
        const ids = await recommendConsultantsForProject(project, profiles);
        setRecommendedIds(ids);
        setIsThinking(false);
        setActiveTab('POOL');
    };

    const handleRespondToApplication = (appId: string, accept: boolean) => {
        setApplications(apps => apps.map(a => 
            a.id === appId ? { ...a, status: accept ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED } : a
        ));
    };

    const handleGenerateAvatar = async () => {
        if (!avatarPrompt) return;
        setIsGeneratingAvatar(true);
        const result = await generateAvatarImage(avatarPrompt);
        setGeneratedAvatar(result);
        setIsGeneratingAvatar(false);
    };

    const handleSaveAvatar = () => {
        if (currentUser && generatedAvatar) {
            updateUser({ ...currentUser, avatar: generatedAvatar });
            setIsAvatarModalOpen(false);
            setGeneratedAvatar(null);
            setAvatarPrompt('');
        }
    };

    const handleOpenReview = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        const acceptedApp = applications.find(a => a.projectId === project.id && a.status === ApplicationStatus.ACCEPTED);
        if (acceptedApp) {
            setReviewForm({ rating: 5, comment: '', projectId: project.id, consultantId: acceptedApp.consultantId });
            setIsReviewModalOpen(true);
        } else {
            alert('未找到该项目的合作顾问，无法评价。');
        }
    };

    const submitReview = () => {
        if (!currentUser) return;
        const newReview = {
            id: `rev-${Date.now()}`,
            projectId: reviewForm.projectId,
            consultantId: reviewForm.consultantId,
            businessId: currentUser.id,
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            date: new Date().toISOString().split('T')[0]
        };
        setReviews(prev => [...prev, newReview]);
        setProjects(prev => prev.map(p => p.id === reviewForm.projectId ? { ...p, status: ProjectStatus.COMPLETED } : p));
        setIsReviewModalOpen(false);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(rating) ? "currentColor" : "none"} className={i < Math.round(rating) ? "" : "text-slate-300"} />
                ))}
            </div>
        );
    };

    // --- Sub-renderers ---

    const renderProjectForm = (isEdit: boolean) => (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">项目标题</label>
                <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="例如：2024 Q1 市场营销策略制定"
                    value={projectForm.title}
                    onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                />
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-slate-800">项目描述</label>
                    <button 
                        onClick={handleAiOptimize}
                        disabled={!projectForm.description || isOptimizing}
                        className="text-xs flex items-center text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                    >
                        <Sparkles size={12} className="mr-1" />
                        {isOptimizing ? 'AI 优化中...' : 'AI 润色 & 提取核心能力'}
                    </button>
                </div>
                <textarea 
                    className="w-full border border-slate-300 rounded-md p-2.5 h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                    placeholder="描述项目的背景、目标 and 主要交付物..."
                    value={projectForm.description}
                    onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">核心能力要求 (逗号分隔)</label>
                    <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="例如：React, Python, 市场调研"
                        value={projectForm.skills}
                        onChange={e => setProjectForm({...projectForm, skills: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">奖金金额</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-md p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="例如：50,000"
                            value={projectForm.budget.replace('¥', '')}
                            onChange={e => setProjectForm({...projectForm, budget: '¥' + e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    项目起止时间
                </label>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">开始日期</span>
                        <input 
                            type="date" 
                            className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                            value={projectForm.startDate}
                            onChange={e => setProjectForm({...projectForm, startDate: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">结束日期</span>
                        <input 
                            type="date" 
                            className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                            value={projectForm.endDate}
                            onChange={e => setProjectForm({...projectForm, endDate: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">积分奖励 (系统代发)</label>
                <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="顾问完成后可获得多少积分"
                    value={projectForm.points}
                    onChange={e => setProjectForm({...projectForm, points: e.target.value})}
                />
            </div>

            <div className="pt-6 flex justify-end gap-3">
                <button 
                    onClick={() => isEdit ? setIsEditingProject(false) : setIsCreateModalOpen(false)}
                    className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition text-sm"
                >
                    取消
                </button>
                <button 
                    onClick={isEdit ? handleSaveEditedProject : handleCreateProject}
                    className="px-8 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2 text-sm"
                >
                    <Save size={18} />
                    {isEdit ? '确认并保存修改' : '确认发布需求'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header / Nav */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('PROJECTS')}
                        className={`font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'PROJECTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        项目需求 Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('POOL')}
                        className={`font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'POOL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        顾问库
                    </button>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 transition shadow-sm"
                        title="设置个人头像"
                    >
                        <Settings size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            setProjectForm({ title: '', description: '', budget: '', points: '', skills: '', startDate: '', endDate: '' });
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-bold"
                    >
                        <Plus size={18} />
                        <span>发布需求</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {activeTab === 'PROJECTS' ? (
                <div className="space-y-4">
                    {/* Project Filters */}
                    <div className="flex flex-wrap gap-2">
                        {['ALL', ...Object.values(ProjectStatus)].map(status => (
                            <button
                                key={status}
                                onClick={() => setProjectFilter(status as any)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${projectFilter === status ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                            >
                                {status === 'ALL' ? '全部' : STATUS_LABELS[status]}
                            </button>
                        ))}
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => {
                            const pendingApps = applications.filter(a => a.projectId === project.id && a.type === ApplicationType.APPLICATION && a.status === ApplicationStatus.PENDING);
                            return (
                                <div 
                                    key={project.id} 
                                    onClick={() => { setViewingProject(project); setIsEditingProject(false); }}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${project.status === ProjectStatus.TERMINATED ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                                            {STATUS_LABELS[project.status]}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition">{project.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                                    
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {project.requiredSkills.map(skill => (
                                            <span key={skill} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{skill}</span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 flex items-center"><DollarSign size={14} className="text-green-500 mr-0.5"/> {project.budget}</span>
                                            {project.points ? <span className="text-[10px] text-orange-600 font-bold mt-1 flex items-center"><Award size={10} className="mr-0.5"/> 奖励: {project.points} pts</span> : null}
                                        </div>
                                        <div className="flex space-x-2">
                                            {project.status === ProjectStatus.RECRUITING && (
                                                <button 
                                                    onClick={(e) => handleAiRecommend(e, project)}
                                                    className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition font-bold"
                                                >
                                                    <Sparkles size={14} className="mr-1" />
                                                    AI 推荐
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                     {/* Consultant Filters & Toolbar */}
                     <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {['ALL', ...Object.values(ConsultantStatus)].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setConsultantFilter(status as any)}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${consultantFilter === status ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                >
                                    {status === 'ALL' ? '全部' : CONSULTANT_STATUS_LABELS[status]}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="搜索技能或名字..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                     </div>

                     {/* Consultant List */}
                     <div className={`grid ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                        {filteredConsultants.map(consultant => (
                            <div 
                                key={consultant.id} 
                                onClick={() => setViewingConsultant(consultant)}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition relative cursor-pointer"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={consultant.avatar} alt={consultant.name} className="w-16 h-16 rounded-full object-cover bg-slate-100 border-2 border-slate-50" />
                                    <div>
                                        <h3 className="font-bold text-slate-900">{consultant.name}</h3>
                                        <p className="text-slate-500 text-sm">{consultant.profile?.title || '未填写职位'}</p>
                                        <div className="mt-1 flex items-center gap-1">
                                            {renderStars(consultant.rating)}
                                            <span className="text-[10px] text-slate-400 ml-1">({consultant.reviewCount})</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {consultant.profile?.skills.slice(0, 5).map(skill => (
                                            <span key={skill} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-medium">{skill}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{consultant.profile?.bio}</p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <span className="text-slate-900 font-bold text-sm">{consultant.profile?.hourlyRate || 'N/A'}/hr</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleInvite(consultant.id); }}
                                        className="text-xs bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition font-bold"
                                    >
                                        邀请
                                    </button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">发布新项目需求</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            {renderProjectForm(false)}
                        </div>
                    </div>
                </div>
            )}

            {/* Project Details Modal (With integrated editing) */}
            {viewingProject && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div className="flex-1">
                                {isEditingProject ? (
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsEditingProject(false)}
                                            className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-500"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <h2 className="text-xl font-bold text-slate-900">修改项目详情</h2>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-bold text-slate-900">{viewingProject.title}</h2>
                                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${viewingProject.status === ProjectStatus.TERMINATED ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                                                {STATUS_LABELS[viewingProject.status]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>PROJ ID: {viewingProject.id}</span>
                                            {viewingProject.lastModified && (
                                                <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                                                    已于 {viewingProject.lastModified} 修改
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditingProject && viewingProject.status !== ProjectStatus.TERMINATED && (
                                    <>
                                        <button 
                                            onClick={handleStartEdit}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            title="修改项目信息"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button 
                                            onClick={handleTakeProjectOffline}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                            title="任务下线"
                                        >
                                            <Power size={20} />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>
                        </div>
                        
                        <div className="p-8">
                            {isEditingProject ? (
                                renderProjectForm(true)
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Key Stats Grid - Improved date visibility */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center"><DollarSign size={12} className="mr-0.5"/> 奖金</span>
                                            <p className="font-bold text-slate-900 text-sm">{viewingProject.budget}</p>
                                        </div>
                                        <div className="flex flex-col p-4 bg-orange-50 rounded-xl border border-orange-100 shadow-sm">
                                            <span className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1 flex items-center"><Award size={12} className="mr-0.5"/> 积分奖励</span>
                                            <p className="font-bold text-orange-700 text-sm">{viewingProject.points || 0} pts</p>
                                        </div>
                                        <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm min-h-[90px] justify-center">
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center"><Calendar size={12} className="mr-0.5"/> 周期</span>
                                            <p className="font-bold text-slate-900 text-[10px] leading-relaxed break-words whitespace-normal">
                                                {viewingProject.startDate} 
                                                <span className="block text-slate-400 font-normal my-0.5 text-[9px]">至</span>
                                                {viewingProject.endDate}
                                            </p>
                                        </div>
                                        <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center"><Layers size={12} className="mr-0.5"/> 核心要求</span>
                                            <p className="font-bold text-slate-900 text-sm">{viewingProject.requiredSkills.length} 项</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                            项目详情
                                        </h3>
                                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm shadow-inner min-h-[100px]">
                                            {viewingProject.description}
                                        </div>
                                    </div>

                                    {/* Core Competencies */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">核心能力要求</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingProject.requiredSkills.map(skill => (
                                                <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Applications */}
                                    <div className="border-t border-slate-100 pt-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-900">候选人申请 ({applications.filter(a => a.projectId === viewingProject.id).length})</h3>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {applications.filter(a => a.projectId === viewingProject.id).length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-slate-400 text-sm italic">暂无相关申请或邀请记录</p>
                                                </div>
                                            ) : (
                                                applications.filter(a => a.projectId === viewingProject.id).map(app => {
                                                    const person = allConsultants.find(c => c.id === app.consultantId);
                                                    return (
                                                        <div key={app.id} className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-300 transition-all shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <img src={person?.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-100" alt="" />
                                                                <div>
                                                                    <p className="font-bold text-slate-900 text-sm">{person?.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                                        {app.type === ApplicationType.APPLICATION ? '顾问申请' : '邀约投递'} · {app.date}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {app.status === ApplicationStatus.PENDING && (
                                                                    <div className="flex gap-2 mr-2">
                                                                        <button onClick={() => handleRespondToApplication(app.id, true)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition shadow-sm" title="通过申请">
                                                                            <CheckCircle size={18} />
                                                                        </button>
                                                                        <button onClick={() => handleRespondToApplication(app.id, false)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition shadow-sm" title="驳回申请">
                                                                            <XCircle size={18} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                                    app.status === ApplicationStatus.ACCEPTED ? 'bg-green-100 text-green-700' :
                                                                    app.status === ApplicationStatus.REJECTED || app.status === ApplicationStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                    {app.status === ApplicationStatus.PENDING ? '待确认' :
                                                                     app.status === ApplicationStatus.ACCEPTED ? '合作中' :
                                                                     app.status === ApplicationStatus.CANCELLED ? '已关闭' : '未通过'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Consultant Details Modal */}
            {viewingConsultant && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <img src={viewingConsultant.avatar} className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover" alt={viewingConsultant.name} />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{viewingConsultant.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <p className="text-slate-500 text-sm">{viewingConsultant.profile?.title || '顾问'}</p>
                                        <div className="flex items-center">{renderStars(viewingConsultant.rating)}</div>
                                    </div>
                                </div>
                             </div>
                             <button onClick={() => setViewingConsultant(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="px-3 py-1 bg-slate-100 rounded text-sm font-medium flex items-center gap-2 text-slate-700">
                                    <span className={`w-2 h-2 rounded-full ${viewingConsultant.profile?.status === ConsultantStatus.AVAILABLE ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                    {CONSULTANT_STATUS_LABELS[viewingConsultant.profile?.status || ConsultantStatus.AVAILABLE]}
                                </div>
                                <div className="px-3 py-1 bg-slate-100 rounded text-sm font-medium flex items-center gap-2 font-bold text-slate-700">
                                    <DollarSign size={14} />
                                    {viewingConsultant.profile?.hourlyRate || '面议'}/hr
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><User size={16}/> 个人简介</h3>
                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                                    {viewingConsultant.profile?.bio || '该顾问暂未填写简介。'}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                            <button onClick={() => setViewingConsultant(null)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition">关闭</button>
                            <button 
                                onClick={() => { handleInvite(viewingConsultant.id); setViewingConsultant(null); }} 
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                            >
                                邀请合作
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isReviewModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">评价顾问</h2>
                            <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">评分</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star size={32} className={star <= reviewForm.rating ? "text-yellow-400 fill-current" : "text-slate-300"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 text-sm font-bold">评价内容</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                    placeholder="请描述您对顾问工作的评价..."
                                    value={reviewForm.comment}
                                    onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                />
                            </div>
                            <button 
                                onClick={submitReview}
                                disabled={!reviewForm.comment}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg"
                            >
                                提交评价 & 完成项目
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAvatarModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Wand2 className="text-purple-600"/> AI 魔法头像生成
                            </h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {!generatedAvatar ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">描述您想要的头像风格</label>
                                        <textarea 
                                            className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 h-32 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none resize-none text-sm"
                                            placeholder="例如：一位干练的商务经理，浅色衬衫，背景简洁，专业光影..."
                                            value={avatarPrompt}
                                            onChange={e => setAvatarPrompt(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleGenerateAvatar}
                                        disabled={!avatarPrompt || isGeneratingAvatar}
                                        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all flex justify-center items-center disabled:opacity-50 shadow-lg"
                                    >
                                        {isGeneratingAvatar ? (
                                            <><Sparkles className="animate-spin mr-2"/> 生成中...</>
                                        ) : (
                                            '开始魔法生成'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="flex justify-center">
                                        <img src={generatedAvatar} alt="Generated" className="w-56 h-56 rounded-full border-4 border-slate-50 shadow-2xl object-cover" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setGeneratedAvatar(null)} className="py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">重试</button>
                                        <button onClick={handleSaveAvatar} className="py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg">确认应用</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessView;