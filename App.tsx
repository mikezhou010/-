import React, { useState, createContext, useMemo, useEffect } from 'react';
import { User, Project, ConsultantProfile, Application, AppState, UserRole, Review } from './types';
import { MOCK_USERS, MOCK_PROJECTS, MOCK_PROFILES, MOCK_APPLICATIONS, MOCK_REVIEWS } from './services/mockData';
import Login from './components/Login';
import BusinessView from './components/BusinessView';
import ConsultantView from './components/ConsultantView';
import AdminView from './components/AdminView';
import { LogOut } from 'lucide-react';

// Context Definition
interface AppContextProps extends AppState {
    setCurrentUser: (user: User | null) => void;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setConsultantProfiles: React.Dispatch<React.SetStateAction<Record<string, ConsultantProfile>>>;
    setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
    setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
    updateUser: (user: User) => void;
}

export const AppContext = createContext<AppContextProps>({} as AppContextProps);

const App: React.FC = () => {
    // Helper to load from localStorage with fallback
    const loadState = <T,>(key: string, fallback: T): T => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) {
            console.error(`Error loading ${key} from localStorage`, e);
            return fallback;
        }
    };

    // Global State with LocalStorage Initialization
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [users, setUsers] = useState<User[]>(() => loadState('nexus_users', MOCK_USERS));
    const [projects, setProjects] = useState<Project[]>(() => loadState('nexus_projects', MOCK_PROJECTS));
    const [consultantProfiles, setConsultantProfiles] = useState<Record<string, ConsultantProfile>>(() => loadState('nexus_profiles', MOCK_PROFILES));
    const [applications, setApplications] = useState<Application[]>(() => loadState('nexus_applications', MOCK_APPLICATIONS));
    const [reviews, setReviews] = useState<Review[]>(() => loadState('nexus_reviews', MOCK_REVIEWS));

    // Persistence Effects
    useEffect(() => {
        try { localStorage.setItem('nexus_users', JSON.stringify(users)); } catch (e) { console.error('Storage limit exceeded for users'); }
    }, [users]);

    useEffect(() => {
        try { localStorage.setItem('nexus_projects', JSON.stringify(projects)); } catch (e) { console.error('Storage limit exceeded for projects'); }
    }, [projects]);

    useEffect(() => {
        try { localStorage.setItem('nexus_profiles', JSON.stringify(consultantProfiles)); } catch (e) { console.error('Storage limit exceeded for profiles'); }
    }, [consultantProfiles]);

    useEffect(() => {
        try { localStorage.setItem('nexus_applications', JSON.stringify(applications)); } catch (e) { console.error('Storage limit exceeded for applications'); }
    }, [applications]);

    useEffect(() => {
        try { localStorage.setItem('nexus_reviews', JSON.stringify(reviews)); } catch (e) { console.error('Storage limit exceeded for reviews'); }
    }, [reviews]);


    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    };

    const contextValue = useMemo(() => ({
        currentUser,
        users,
        consultantProfiles,
        projects,
        applications,
        reviews,
        setCurrentUser,
        setProjects,
        setConsultantProfiles,
        setApplications,
        setReviews,
        updateUser
    }), [currentUser, users, consultantProfiles, projects, applications, reviews]);

    // View Routing
    const renderContent = () => {
        if (!currentUser) return <Login />;

        switch (currentUser.role) {
            case UserRole.BUSINESS:
                return <BusinessView />;
            case UserRole.CONSULTANT:
                return <ConsultantView />;
            case UserRole.ADMIN:
                return <AdminView />;
            default:
                return <div>Unknown Role</div>;
        }
    };

    return (
        <AppContext.Provider value={contextValue}>
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
                {currentUser && (
                    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white font-bold">C</div>
                                <span className="text-xl font-bold tracking-tight text-slate-800">ConsultantNexus</span>
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wide ml-2">{currentUser.role} View</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                                    <span className="text-sm font-medium text-slate-700 hidden md:block">{currentUser.name}</span>
                                </div>
                                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                <button 
                                    onClick={() => setCurrentUser(null)}
                                    className="text-slate-500 hover:text-red-600 transition"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </header>
                )}
                
                <main className={currentUser ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
                    {renderContent()}
                </main>
            </div>
        </AppContext.Provider>
    );
};

export default App;