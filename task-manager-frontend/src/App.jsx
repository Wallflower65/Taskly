import React, { useState, useEffect } from 'react';
import API from './api';
import { CheckSquare, LogOut, Plus, Trash2, CheckCircle, Circle, Sun, Moon, Calendar, AlertTriangle, Sparkles, Tag, Users, FolderPlus, Send } from 'lucide-react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');

  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (darkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
      fetchWorkspaces();
      if (!localStorage.getItem('userName')) {
        setShowNameModal(true);
      }
    }
  }, [isLoggedIn, activeWorkspace]);

  const fetchTasks = async () => {
    try {
      const endpoint = activeWorkspace ? `/tasks?workspaceId=${activeWorkspace.id}` : '/tasks';
      const res = await API.get(endpoint);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await API.get('/workspaces');
      setWorkspaces(res.data);
    } catch (err) {
      console.error("Error fetching workspaces", err);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const categoryCounts = tasks.reduce((acc, task) => {
    const cat = task.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const getCategoryPercentage = (categoryName) => {
    if (totalTasks === 0) return 0;
    return Math.round(((categoryCounts[categoryName] || 0) / totalTasks) * 100);
  };

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Varsity': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Work': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Personal': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getCountdownText = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const dueDate = new Date(dueDateStr); dueDate.setHours(0,0,0,0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    if (diffDays === 0) return { text: 'Due TODAY!', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse' };
    if (diffDays === 1) return { text: 'Due Tomorrow!', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
    return { text: `${diffDays} days left`, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
  };

  const getUrgentTaskWarning = () => {
    const urgentTask = tasks.find(t => {
      if (t.status === 'done' || !t.due_date) return false;
      const today = new Date(); today.setHours(0,0,0,0);
      const dueDate = new Date(t.due_date); dueDate.setHours(0,0,0,0);
      const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return diff === 1 || diff === 0 || diff < 0;
    });

    if (urgentTask) {
      const today = new Date(); today.setHours(0,0,0,0);
      const dueDate = new Date(urgentTask.due_date); dueDate.setHours(0,0,0,0);
      const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      if (diff < 0) {
        return `Attention: You have an overdue task "${urgentTask.title}" on this board!`;
      }
      return `Heads up! "${urgentTask.title}" is due ${diff === 0 ? 'TODAY' : 'tomorrow'}.`;
    }
    return null;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address (e.g., name@example.com).");
      return;
    }

    if (password.length < 6) {
      setError("Password security failure: Your password must be at least 6 characters long.");
      return;
    }

    const endpoint = isSigningUp ? '/auth/signup' : '/auth/login';
    
    try {
      const res = await API.post(endpoint, { email, password });
      if (!isSigningUp) {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
      } else {
        setIsSigningUp(false);
        setEmail('');
        setPassword('');
        setError("SUCCESS: Your account has been created successfully! You may now log in below using your credentials.");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Authentication failed. Please check your credentials and try again.");
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;

    try {
      const res = await API.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        due_date: taskDueDate || null,
        category: taskCategory,
        workspace_id: activeWorkspace ? activeWorkspace.id : null
      });
      setTasks([res.data, ...tasks]);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskCategory('General');
    } catch (err) {
      console.error("Error creating task", err);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const res = await API.post('/workspaces', { name: newWorkspaceName });
      setWorkspaces([...workspaces, res.data]);
      setActiveWorkspace(res.data);
      setNewWorkspaceName('');
    } catch (err) {
      console.error("Error building space", err);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace) return;

    try {
      await API.post(`/workspaces/${activeWorkspace.id}/invite`, { email: inviteEmail });
      alert(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send team invitation link.");
    }
  };

  const handleToggleStatus = async (id, currentTask) => {
    const nextStatus = currentTask.status === 'done' ? 'todo' : 'done';
    try {
      const res = await API.put(`/tasks/${id}`, { ...currentTask, status: nextStatus });
      setTasks(tasks.map(t => t.id === id ? res.data : t));
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error removing task", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserName('');
    setTasks([]);
    setWorkspaces([]);
    setActiveWorkspace(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-gray-100 dark:bg-[#0b0f19] flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-2xl relative">
          <button onClick={() => setDarkMode(!darkMode)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-[#1f293d] rounded-xl text-gray-600 dark:text-gray-300 cursor-pointer">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <div className="text-center mb-8">
            <div className="flex items-center gap-3 justify-center mb-1">
              <CheckSquare className="w-10 h-10 text-emerald-500" />
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Taskly</h1>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              By Phaphamani Zoneleni
            </p>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
            {isSigningUp ? "Create your account" : "Welcome back"}
          </h2>
          
          {error && (
            <div className={`text-sm p-3 rounded-xl text-center mb-4 border ${
              error.startsWith("SUCCESS:") 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}>
              {error.replace("SUCCESS: ", "")}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="you@example.com" 
                required 
              />
              {isSigningUp && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 pl-1">
                  Must be a properly formatted email address string.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all" 
                placeholder="••••••••" 
                required 
              />
              {isSigningUp && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 pl-1">
                  Password requirement: Must be at least 6 characters long.
                </p>
              )}
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white dark:text-[#0b0f19] font-bold py-3 rounded-xl transition-all cursor-pointer mt-2 shadow-lg">
              {isSigningUp ? "Sign Up" : "Log In"}
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-6">
            {isSigningUp ? "Already have an account?" : "New to Taskly?"}{" "}
            <button onClick={() => setIsSigningUp(!isSigningUp)} className="text-emerald-500 dark:text-emerald-400 hover:underline font-medium cursor-pointer">{isSigningUp ? "Log in here" : "Create an account"}</button>
          </p>
        </div>
      </div>
    );
  }

  const urgentWarningMessage = getUrgentTaskWarning();

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-[#0b0f19] text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300 flex">
      
      <aside className="w-64 bg-white dark:bg-[#131a26] border-r border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-emerald-500" />
          <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">Taskly Boards</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">My Spaces</label>
            <button 
              onClick={() => setActiveWorkspace(null)} 
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${!activeWorkspace ? 'bg-emerald-500 text-white dark:text-[#0b0f19]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f293d]'}`}
            >
              <Sparkles className="w-4 h-4" /> Personal Canvas
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Team Workspaces</label>
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button 
                  key={ws.id} 
                  onClick={() => setActiveWorkspace(ws)} 
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer truncate ${activeWorkspace?.id === ws.id ? 'bg-emerald-500 text-white dark:text-[#0b0f19]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f293d]'}`}
                >
                  <Users className="w-4 h-4" /> {ws.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateWorkspace} className="mt-4 flex items-center gap-2">
              <input 
                type="text" 
                value={newWorkspaceName} 
                onChange={(e) => setNewWorkspaceName(e.target.value)} 
                placeholder="New Team space..." 
                className="flex-1 bg-gray-50 dark:bg-[#0b0f19] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <button type="submit" className="p-1.5 bg-emerald-500 text-white dark:text-[#0b0f19] rounded-lg hover:bg-emerald-600 transition cursor-pointer">
                <FolderPlus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="bg-white dark:bg-[#131a26] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              {activeWorkspace ? `👥 ${activeWorkspace.name}` : `Hi, ${userName || 'Friend'}! 👋`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {activeWorkspace && (
              <form onSubmit={handleInviteUser} className="hidden lg:flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 bg-gray-50 dark:bg-[#0b0f19]">
                <input 
                  type="email" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  placeholder="Invite colleague email..." 
                  className="bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none w-44"
                  required
                />
                <button type="submit" className="text-emerald-500 hover:text-emerald-600 transition cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 bg-gray-100 dark:bg-[#1f293d] rounded-xl text-gray-600 dark:text-gray-300 cursor-pointer">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-gray-100 dark:bg-[#1f293d] hover:bg-gray-200 dark:hover:bg-[#2a3752] text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {urgentWarningMessage && (
          <div className="max-w-7xl mx-auto mt-6 px-4 md:px-8 w-full animate-fade-in">
            <div className="bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between text-rose-700 dark:text-rose-400 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-sm font-bold tracking-wide">{urgentWarningMessage}</p>
              </div>
            </div>
          </div>
        )}

        <section className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50 dark:bg-[#0b0f19] border-b border-gray-200 dark:border-gray-800/60">
          <div className="bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Total Actions</p>
            <p className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{totalTasks}</p>
          </div>
          <div className="bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Remaining</p>
            <p className="text-2xl font-black mt-1 text-emerald-500">{pendingTasks}</p>
          </div>
          <div className="bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Completed</p>
            <p className="text-2xl font-black mt-1 text-gray-500">{completedTasks}</p>
          </div>
          <div className="bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Velocity Rate</p>
              <span className="text-xs font-bold text-emerald-500">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#0b0f19] h-2 rounded-full overflow-hidden mt-2 border border-gray-200 dark:border-gray-800/50">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>
        </section>

        <main className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6 h-fit">
            <section className="bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-4 flex items-center gap-2">
                📊 Context Distribution
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">🎓 Varsity</span>
                    <span>{getCategoryPercentage('Varsity')}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#0b0f19] h-2 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800/50">
                    <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${getCategoryPercentage('Varsity')}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-600 dark:text-blue-400">💼 Work / Projects</span>
                    <span>{getCategoryPercentage('Work')}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#0b0f19] h-2 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800/50">
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${getCategoryPercentage('Work')}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-pink-600 dark:text-pink-400">🏠 Personal</span>
                    <span>{getCategoryPercentage('Personal')}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#0b0f19] h-2 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800/50">
                    <div className="bg-pink-500 h-full transition-all duration-500" style={{ width: `${getCategoryPercentage('Personal')}%` }}></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#131a26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" /> New {activeWorkspace ? 'Team Task' : 'Personal Task'}
              </h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Task Title</label>
                  <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="What needs doing?" className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Add details..." rows="3" className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Context Tag</label>
                  <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500 text-sm cursor-pointer">
                    <option value="General">⚙️ General</option>
                    <option value="Varsity">🎓 Varsity</option>
                    <option value="Work">💼 Work / Projects</option>
                    <option value="Personal">🏠 Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                  <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500 text-sm block cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Priority Metric</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full bg-white dark:bg-[#0b0f19] border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500 text-sm cursor-pointer">
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white dark:text-[#0b0f19] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg mt-2 cursor-pointer">
                  <Plus className="w-4 h-4 stroke-[3]" /> Add to Board
                </button>
              </form>
            </section>
          </div>

          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Workspace Tasks ({tasks.length})</h2>
            {tasks.length === 0 ? (
              <div className="border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-500 font-medium bg-white dark:bg-[#131a26]/30">
                No tasks logged on this board yet. Add one above to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tasks.map((task) => {
                  const countdown = getCountdownText(task.due_date);
                  return (
                    <div key={task.id} className={`bg-white dark:bg-[#131a26] border transition-all rounded-2xl p-5 flex items-start gap-4 shadow-sm ${task.status === 'done' ? 'border-gray-200 dark:border-gray-800 opacity-40' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                      <button onClick={() => handleToggleStatus(task.id, task)} className="text-gray-400 dark:text-gray-500 hover:text-emerald-500 transition mt-1 cursor-pointer">
                        {task.status === 'done' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-bold text-base text-gray-900 dark:text-white truncate ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{task.title}</h3>
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1 ${getCategoryStyles(task.category)}`}>
                            <Tag className="w-2.5 h-2.5" />
                            {task.category || 'General'}
                          </span>
                        </div>
                        <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{task.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10' : task.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/10'}`}>{task.priority}</span>
                          {task.due_date && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-[#1f293d] px-2.5 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700/50">
                              <Calendar className="w-3 h-3 text-emerald-500" />
                              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {task.status !== 'done' && countdown && (
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${countdown.color}`}>{countdown.text}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 dark:text-gray-500 hover:text-rose-500 transition p-1.5 hover:bg-gray-100 dark:hover:bg-[#1f293d] rounded-xl cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <footer className="w-full py-4 text-center text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-[#131a26] border-t border-gray-200 dark:border-gray-800/60 mt-auto">
          &copy; {new Date().getFullYear()} Phaphamani Zoneleni | Taskly Workspace. All rights reserved.
        </footer>

      </div>
    </div>
  );
}

export default App;