import React, { useContext } from 'react';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { Shield, Briefcase, User } from 'lucide-react';

const Login: React.FC = () => {
    const { setCurrentUser, users } = useContext(AppContext);

    const handleLogin = (role: UserRole) => {
        // Find the first user with this role from the current application state
        // This ensures we get the latest data (e.g. updated avatars) instead of stale mock data
        const user = users.find(u => u.role === role);
        if (user) {
            setCurrentUser(user);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-4xl w-full border border-slate-200">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ConsultantNexus</h1>
                    <p className="text-slate-500 mt-2">企业级顾问管理与业务协同平台</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Admin */}
                    <button 
                        onClick={() => handleLogin(UserRole.ADMIN)}
                        className="group flex flex-col items-center p-6 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200"
                    >
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">管理员入口</h3>
                        <p className="text-sm text-slate-400 mt-2 text-center">系统配置与全局数据监控</p>
                    </button>

                    {/* Business */}
                    <button 
                        onClick={() => handleLogin(UserRole.BUSINESS)}
                        className="group flex flex-col items-center p-6 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200"
                    >
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                            <Briefcase size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">业务方入口</h3>
                        <p className="text-sm text-slate-400 mt-2 text-center">发布需求，筛选顾问，管理项目</p>
                    </button>

                    {/* Consultant */}
                    <button 
                        onClick={() => handleLogin(UserRole.CONSULTANT)}
                        className="group flex flex-col items-center p-6 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200"
                    >
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                            <User size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">顾问入口</h3>
                        <p className="text-sm text-slate-400 mt-2 text-center">更新简历，寻找项目，管理排期</p>
                    </button>
                </div>
                
                <div className="mt-10 text-center border-t border-slate-100 pt-6">
                    <p className="text-xs text-slate-400">© 2023 ConsultantNexus Inc. Internal System.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;