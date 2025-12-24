import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Users, Briefcase, FileText, ArrowLeft, Search, Filter, ChevronRight, User as UserIcon } from 'lucide-react';
import { UserRole, ProjectStatus, ApplicationStatus } from '../types';

type AdminSection = 'DASHBOARD' | 'USERS' | 'PROJECTS' | 'APPLICATIONS';

const AdminView: React.FC = () => {
    const { users, projects, applications } = useContext(AppContext);
    const [currentSection, setCurrentSection] = useState<AdminSection>('DASHBOARD');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterValue, setFilterValue] = useState<string>('ALL');

    // Reset filters when switching sections
    const navigateTo = (section: AdminSection) => {
        setSearchTerm('');
        setFilterValue('ALL');
        setCurrentSection(section);
    };

    // --- Stats Calculation ---
    const stats = [
        { 
            id: 'USERS',
            label: '总用户数', 
            value: users.length, 
            icon: Users, 
            color: 'bg-blue-600', 
            desc: '管理员, 业务方, 顾问' 
        },
        { 
            id: 'PROJECTS',
            label: '在库项目', 
            value: projects.length, 
            icon: Briefcase, 
            color: 'bg-purple-600',
            desc: '监控项目进度与预算' 
        },
        { 
            id: 'APPLICATIONS',
            label: '申请 & 邀请', 
            value: applications.length, 
            icon: FileText, 
            color: 'bg-green-600',
            desc: '撮合记录与状态流转' 
        },
    ];

    // --- Render Helpers ---

    const renderDashboard = () => (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">系统管理中心</h2>
                    <p className="text-slate-500 mt-1">全局数据监控与平台治理</p>
                </div>
                <div className="text-sm text-slate-400 bg-white px-3 py-1 rounded border border-slate-200">
                    Admin Access
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <button 
                        key={stat.id}
                        onClick={() => navigateTo(stat.id as AdminSection)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-start hover:shadow-md transition text-left group"
                    >
                        <div className="flex justify-between w-full mb-4">
                            <div className={`p-3 rounded-lg ${stat.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="text-slate-300 group-hover:text-slate-400 transition">
                                <ChevronRight size={24} />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1 mb-2">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.desc}</p>
                    </button>
                ))}
            </div>

            {/* Quick Overview Table (Recent Users) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">最新注册用户</h3>
                    <button onClick={() => navigateTo('USERS')} className="text-blue-600 text-sm hover:underline">查看全部</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-4 font-medium">用户</th>
                                <th className="p-4 font-medium">角色</th>
                                <th className="p-4 font-medium">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.slice(0, 5).map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-slate-400"/>}
                                        </div>
                                        <span className="font-medium text-slate-900">{u.name}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium 
                                            ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : 
                                              u.role === UserRole.BUSINESS ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">{u.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderHeader = (title: string, count: number) => (
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => navigateTo('DASHBOARD')}
                className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    {title} <span className="text-sm font-normal bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{count}</span>
                </h2>
            </div>
        </div>
    );

    const renderFilters = (options: string[]) => (
        <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索关键词..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select 
                    value={filterValue} 
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="ALL">全部状态/类型</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        </div>
    );

    // --- Users List ---
    const renderUsersList = () => {
        const filteredUsers = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterValue === 'ALL' || u.role === filterValue;
            return matchesSearch && matchesFilter;
        });

        return (
            <div>
                {renderHeader('用户管理', filteredUsers.length)}
                {renderFilters(Object.values(UserRole))}
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4">用户详情</th>
                                <th className="p-4">角色身份</th>
                                <th className="p-4">联系方式</th>
                                <th className="p-4">系统ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                        <span className="font-bold text-slate-900">{u.name}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            u.role === UserRole.ADMIN ? 'bg-red-50 text-red-700 border-red-100' : 
                                            u.role === UserRole.BUSINESS ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                            'bg-purple-50 text-purple-700 border-purple-100'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{u.email || 'N/A'}</td>
                                    <td className="p-4 text-slate-400 font-mono text-xs">{u.id}</td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">未找到匹配用户</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // --- Projects List ---
    const renderProjectsList = () => {
        const filteredProjects = projects.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterValue === 'ALL' || p.status === filterValue;
            return matchesSearch && matchesFilter;
        });

        return (
            <div>
                {renderHeader('项目监管', filteredProjects.length)}
                {renderFilters(Object.values(ProjectStatus))}
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-1/3">项目名称</th>
                                <th className="p-4">状态</th>
                                <th className="p-4">预算</th>
                                <th className="p-4">负责人ID</th>
                                <th className="p-4">周期</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{p.title}</div>
                                        <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">{p.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200">
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-slate-700">{p.budget}</td>
                                    <td className="p-4 text-blue-600 font-mono text-xs">{p.ownerId}</td>
                                    <td className="p-4 text-slate-500 text-xs">
                                        {p.startDate} <br/> -> {p.endDate}
                                    </td>
                                </tr>
                            ))}
                            {filteredProjects.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">未找到匹配项目</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // --- Applications List ---
    const renderApplicationsList = () => {
        const filteredApps = applications.filter(a => {
            const matchesFilter = filterValue === 'ALL' || a.status === filterValue;
            return matchesFilter;
        });

        return (
            <div>
                {renderHeader('申请与邀请记录', filteredApps.length)}
                {renderFilters(Object.values(ApplicationStatus))}
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4">项目ID</th>
                                <th className="p-4">顾问ID</th>
                                <th className="p-4">业务方ID</th>
                                <th className="p-4">类型</th>
                                <th className="p-4">状态</th>
                                <th className="p-4">日期</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApps.map(a => (
                                <tr key={a.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-600 text-xs">{a.projectId}</td>
                                    <td className="p-4 font-mono text-slate-600 text-xs">{a.consultantId}</td>
                                    <td className="p-4 font-mono text-slate-600 text-xs">{a.businessId}</td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded ${a.type === 'INVITATION' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {a.type}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            a.status === ApplicationStatus.ACCEPTED ? 'bg-green-100 text-green-700' :
                                            a.status === ApplicationStatus.REJECTED || a.status === ApplicationStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs">{a.date}</td>
                                </tr>
                            ))}
                            {filteredApps.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">未找到匹配记录</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-10">
            {currentSection === 'DASHBOARD' && renderDashboard()}
            {currentSection === 'USERS' && renderUsersList()}
            {currentSection === 'PROJECTS' && renderProjectsList()}
            {currentSection === 'APPLICATIONS' && renderApplicationsList()}
        </div>
    );
};

export default AdminView;