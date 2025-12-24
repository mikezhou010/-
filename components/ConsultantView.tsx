import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { ConsultantProfile, ConsultantStatus, ProjectStatus, ApplicationType, ApplicationStatus, Project } from '../types';
import { 
    User as UserIcon, Briefcase, MapPin, DollarSign, Edit2, Save, X, Check, Clock, 
    ChevronDown, Calendar, Layers, Sparkles, Wand2, XCircle, Award, UserCheck, HelpCircle
} from 'lucide-react';
import { generateAvatarImage } from '../services/geminiService';

const STATUS_CONFIG = {
    [ConsultantStatus.AVAILABLE]: { label: '可接单', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    [ConsultantStatus.BUSY]: { label: '项目中', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    [ConsultantStatus.PAUSED]: { label: '暂停接单', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
    [ConsultantStatus.VACATION]: { label: '休假中', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const ConsultantView: React.FC = () => {
    const { currentUser, users, consultantProfiles, projects, applications, setApplications, setConsultantProfiles, updateUser } = useContext(AppContext);
    
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'OPPORTUNITIES'>('PROFILE');
    const [isEditing, setIsEditing] = useState(false);
    
    // Status Dropdown State
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Project Modal State
    const [viewingProject, setViewingProject] = useState<Project | null>(null);

    // Avatar Generator State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);

    const currentProfile = consultantProfiles[currentUser?.id || ''] || {
        userId: currentUser?.id,
        title: '',
        phone: '',
        skills: [],
        preferredRoles: [],
        preferredTasks: [],
        location: '',
        status: ConsultantStatus.AVAILABLE,
        hourlyRate: '',
        bio: ''
    } as ConsultantProfile;

    const [editForm, setEditForm] = useState<ConsultantProfile>(currentProfile);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const myInvitations = applications.filter(a => 
        a.consultantId === currentUser?.id && 
        a.type === ApplicationType.INVITATION &&
        a.status === ApplicationStatus.PENDING
    );

    const availableProjects = projects.filter(p => p.status === ProjectStatus.RECRUITING);

    const handleSaveProfile = () => {
        if (!currentUser) return;
        setConsultantProfiles(prev => ({
            ...prev,
            [currentUser.id]: editForm
        }));
        setIsEditing(false);
    };

    const handleStatusChange = (newStatus: ConsultantStatus) => {
        if (!currentUser) return;
        const updatedProfile = { ...currentProfile, status: newStatus };
        setEditForm(updatedProfile);
        setConsultantProfiles(prev => ({
            ...prev,
            [currentUser.id]: updatedProfile
        }));
        setIsStatusOpen(false);
    };

    const handleApplication = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newApp = {
            id: `app-${Date.now()}`,
            projectId,
            businessId: project.ownerId,
            consultantId: currentUser.id,
            status: ApplicationStatus.PENDING,
            type: ApplicationType.APPLICATION,
            date: new Date().toISOString().split('T')[0]
        };

        setApplications(prev => [...prev, newApp]);
    };

    const handleCancelApplication = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!currentUser) return;
        setApplications(prev => prev.map(a => 
            (a.projectId === projectId && a.consultantId === currentUser.id && a.status === ApplicationStatus.PENDING)
            ? { ...a, status: ApplicationStatus.CANCELLED }
            : a
        ));
    };

    const respondToInvite = (appId: string, accept: boolean) => {
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

    const currentStatusConfig = STATUS_CONFIG[currentProfile.status] || STATUS_CONFIG[ConsultantStatus.AVAILABLE];

    return (
        <div className="space-y-6">
            <div className="flex space-x-6 border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`pb-3 font-medium transition ${activeTab === 'PROFILE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                >
                    个人信息 & 状态
                </button>
                <button 
                    onClick={() => setActiveTab('OPPORTUNITIES')}
                    className={`pb-3 font-medium transition ${activeTab === 'OPPORTUNITIES' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                >
                    项目机会 {myInvitations.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 rounded-full ml-1">{myInvitations.length}</span>}
                </button>
            </div>

            {activeTab === 'PROFILE' && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-visible">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <img src={currentUser?.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover bg-slate-200" />
                                <button 
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition"
                                    title="生成 AI 头像"
                                >
                                    <Wand2 size={12} />
                                </button>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
                                <p className="text-slate-500">{editForm.title || '请填写职位'}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative" ref={statusDropdownRef}>
                                <button 
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition shadow-sm ${currentStatusConfig.color} bg-white`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${currentStatusConfig.dot}`}></span>
                                    {currentStatusConfig.label}
                                    <ChevronDown size={14} className={`transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isStatusOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-20 overflow-hidden">
                                        <div className="p-1">
                                            {(Object.keys(STATUS_CONFIG) as ConsultantStatus[]).map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(status)}
                                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`}></span>
                                                    <span className="text-slate-700">{STATUS_CONFIG[status].label}</span>
                                                    {currentProfile.status === status && <Check size={14} className="ml-auto text-blue-600"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm"><X size={16} className="mr-2"/> 取消</button>
                                    <button onClick={handleSaveProfile} className="flex items-center px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 text-sm"><Save size={16} className="mr-2"/> 保存</button>
                                </>
                             ) : (
                                <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm"><Edit2 size={16} className="mr-2"/> 编辑资料</button>
                             )}
                        </div>
                    </div>
                    
                    <div className="p-8">
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">职业头衔</label>
                                    <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                                    <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">工作地点</label>
                                    <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">时薪 (预估)</label>
                                    <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.hourlyRate} onChange={e => setEditForm({...editForm, hourlyRate: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">技能池 (逗号分隔)</label>
                                    <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.skills.join(', ')} onChange={e => setEditForm({...editForm, skills: e.target.value.split(',').map(s => s.trim())})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">个人简介</label>
                                    <textarea className="w-full border p-2 rounded h-32 focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="flex items-start gap-3">
                                    <Briefcase className="text-slate-400 mt-1" size={20} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">技能与专长</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {editForm.skills.length > 0 ? editForm.skills.map(s => <span key={s} className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">{s}</span>) : <span className="text-slate-400 text-sm">暂无技能标签</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-slate-400 mt-1" size={20} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">偏好与地点</h4>
                                        <p className="text-sm text-slate-600 mt-1">常驻: {editForm.location || '未填写'}</p>
                                        <p className="text-sm text-slate-600 mt-1">薪资: {editForm.hourlyRate || '面议'}</p>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">个人简介</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-100">
                                        {editForm.bio || '这个人很懒，什么都没写...'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'OPPORTUNITIES' && (
                <div className="space-y-6">
                    {myInvitations.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center"><Clock className="mr-2" size={20}/> 待处理邀请</h3>
                            <div className="grid gap-4">
                                {myInvitations.map(inv => {
                                    const proj = projects.find(p => p.id === inv.projectId);
                                    if (!proj) return null;
                                    return (
                                        <div key={inv.id} className="bg-white p-4 rounded shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{proj.title}</h4>
                                                <p className="text-sm text-slate-500">预算: {proj.budget} | 积分: {proj.points || 0}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => respondToInvite(inv.id, true)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><Check size={16} className="mr-2"/> 接受</button>
                                                <button onClick={() => respondToInvite(inv.id, false)} className="flex items-center px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"><X size={16} className="mr-2"/> 拒绝</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Marketplace Sidebar - Guidelines moved here */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-20 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <HelpCircle className="text-blue-500" size={20} />
                                    顾问申请须知
                                </h3>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                                    <ul className="space-y-4">
                                        <li className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600">1</div>
                                            <p className="text-xs text-blue-800 leading-relaxed"><span className="font-bold">更新资料：</span>申请前请务必确认您的技能和简历已是最新状态，这将显著提高通过率。</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600">2</div>
                                            <p className="text-xs text-blue-800 leading-relaxed"><span className="font-bold">项目协作：</span>一旦接受申请，请严格遵守项目周期，按时参加项目会议和任务交付。</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600">3</div>
                                            <p className="text-xs text-blue-800 leading-relaxed"><span className="font-bold">奖励机制：</span>项目验收完成后，系统将根据甲方评价和交付质量自动发放相应积分。</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Project Grid */}
                        <div className="lg:col-span-3">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900">项目广场 ({availableProjects.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableProjects.map(project => {
                                    const myApplication = applications.find(a => 
                                        a.projectId === project.id && 
                                        a.consultantId === currentUser?.id && 
                                        (a.status === ApplicationStatus.PENDING || a.status === ApplicationStatus.ACCEPTED)
                                    );
                                    
                                    const hasPendingApp = myApplication?.status === ApplicationStatus.PENDING;
                                    const hasAcceptedApp = myApplication?.status === ApplicationStatus.ACCEPTED;

                                    return (
                                        <div 
                                            key={project.id} 
                                            onClick={() => setViewingProject(project)}
                                            className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full border-b-4 border-b-transparent hover:border-b-blue-500"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition line-clamp-1">{project.title}</h4>
                                                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">招募中</span>
                                            </div>
                                            <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow">{project.description}</p>
                                            <div className="flex flex-wrap gap-1.5 mb-5">
                                                {project.requiredSkills.map(skill => (
                                                    <span key={skill} className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">{skill}</span>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center text-slate-900 font-bold text-sm"><DollarSign size={14} className="text-green-500 mr-0.5"/> {project.budget}</div>
                                                    <div className="flex items-center text-orange-600 font-bold text-sm"><Award size={14} className="mr-0.5"/> {project.points || 0}</div>
                                                </div>
                                                {hasAcceptedApp ? (
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">已加入</span>
                                                ) : hasPendingApp ? (
                                                    <button 
                                                        onClick={(e) => handleCancelApplication(e, project.id)}
                                                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                                    >
                                                       取消申请
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => handleApplication(e, project.id)} 
                                                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-all shadow-sm"
                                                    >
                                                        申请
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Universal Project Details Modal - Fixed Floating Header Bug */}
            {viewingProject && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        {/* Modal Header - Integrated with Body */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{viewingProject.title}</h2>
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        招募中
                                    </span>
                                </div>
                                <span className="text-slate-400 text-[10px] font-mono tracking-widest uppercase">PROJ ID: {viewingProject.id}</span>
                            </div>
                            <button 
                                onClick={() => setViewingProject(null)} 
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all hover:rotate-90"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                    <div className="flex items-center text-green-600">
                                        <DollarSign size={18} className="mr-1" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">项目薪资</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{viewingProject.budget}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                    <div className="flex items-center text-orange-500">
                                        <Award size={18} className="mr-1" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">奖励积分</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{viewingProject.points || 0} pts</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                    <div className="flex items-center text-blue-500">
                                        <Calendar size={18} className="mr-1" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">项目周期</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 leading-normal">
                                        {viewingProject.startDate} <br/><span className="text-slate-400">-></span> {viewingProject.endDate}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                    <div className="flex items-center text-purple-500">
                                        <Layers size={18} className="mr-1" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">技能要求</span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">{viewingProject.requiredSkills.length} 项核心能力</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                            项目详细介绍
                                        </h3>
                                        <div className="text-slate-600 leading-relaxed bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-sm whitespace-pre-wrap">
                                            {viewingProject.description}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                            关键技能需求 <div className="h-px bg-slate-100 flex-1"></div>
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingProject.requiredSkills.map(skill => (
                                                <span key={skill} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black border border-blue-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">项目对接人</h3>
                                    {(() => {
                                        const owner = users.find(u => u.id === viewingProject.ownerId);
                                        return (
                                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm text-center group">
                                                <div className="relative inline-block mb-4">
                                                    <img src={owner?.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover group-hover:scale-105 transition-transform" alt={owner?.name} />
                                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <h4 className="font-black text-slate-900 text-lg mb-1">{owner?.name || '未知负责人'}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">业务部门主管</p>
                                                <div className="flex items-center justify-center gap-2 text-slate-600 text-[10px] font-bold border-t border-slate-200 pt-6">
                                                    <UserCheck size={16} className="text-blue-500" />
                                                    <span>平台身份已验证</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-4">
                                <button 
                                    onClick={() => setViewingProject(null)}
                                    className="px-8 py-4 bg-white text-slate-600 font-black rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                                >
                                    返回列表
                                </button>
                                {(() => {
                                    const myApp = applications.find(a => 
                                        a.projectId === viewingProject.id && 
                                        a.consultantId === currentUser?.id &&
                                        (a.status === ApplicationStatus.PENDING || a.status === ApplicationStatus.ACCEPTED)
                                    );
                                    
                                    if (myApp?.status === ApplicationStatus.ACCEPTED) {
                                        return (
                                            <div className="px-12 py-4 bg-green-100 text-green-700 font-black rounded-xl flex items-center justify-center text-xs uppercase tracking-widest">
                                                <Check size={18} className="mr-2"/> 已加入该项目
                                            </div>
                                        );
                                    } else if (myApp?.status === ApplicationStatus.PENDING) {
                                        return (
                                            <button 
                                                onClick={(e) => handleCancelApplication(e, viewingProject.id)}
                                                className="px-12 py-4 bg-red-50 text-red-600 border border-red-200 font-black rounded-xl hover:bg-red-100 transition flex items-center justify-center text-xs uppercase tracking-widest"
                                            >
                                                <XCircle size={18} className="mr-2"/> 取消申请
                                            </button>
                                        );
                                    } else {
                                        return (
                                            <button 
                                                onClick={(e) => handleApplication(e, viewingProject.id)}
                                                className="px-12 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center group text-xs uppercase tracking-widest"
                                            >
                                                立即提交申请 <Sparkles size={18} className="ml-2 group-hover:animate-bounce" />
                                            </button>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Generator Modal */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                <Wand2 className="text-purple-600"/> AI 魔法头像生成
                            </h2>
                            <button onClick={() => setIsAvatarModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            {!generatedAvatar ? (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">描述您的职业形象风格</label>
                                        <textarea 
                                            className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 h-32 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none resize-none text-sm"
                                            placeholder="例如：一位穿着深蓝色西装的资深系统架构师，背景是现代化的简约办公室，柔和的侧光..."
                                            value={avatarPrompt}
                                            onChange={e => setAvatarPrompt(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleGenerateAvatar}
                                        disabled={!avatarPrompt || isGeneratingAvatar}
                                        className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all flex justify-center items-center disabled:opacity-50 shadow-lg shadow-purple-200"
                                    >
                                        {isGeneratingAvatar ? (
                                            <><Sparkles className="animate-spin mr-2"/> 魔法酝酿中...</>
                                        ) : (
                                            '开始魔法生成'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center space-y-8">
                                    <div className="flex justify-center">
                                        <img src={generatedAvatar} alt="Generated" className="w-56 h-56 rounded-full border-8 border-slate-50 shadow-2xl object-cover" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setGeneratedAvatar(null)} className="py-4 border border-slate-200 rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">不满意，重试</button>
                                        <button onClick={handleSaveAvatar} className="py-4 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">保存并应用</button>
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

export default ConsultantView;