import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layers, Activity, History, Settings, Bot, Search, GitPullRequest, Code2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { formatDistanceToNow } from 'date-fns';

function Sidebar({ activeRepo, activeBranch }: { activeRepo: string, activeBranch: string }) {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', icon: Activity, path: '/' },
    { name: 'Tasks & Patches', icon: GitPullRequest, path: '/tasks' },
    { name: 'Models Registry', icon: Bot, path: '/models' }
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col p-4 shrink-0">
      <div className="mb-6 flex items-center space-x-2">
        <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
          <Code2 size={20} />
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">Atlas <span className="text-muted-foreground font-normal">/ Core</span></h1>
        </div>
      </div>

      {activeRepo && (
         <div className="mb-6 p-3 bg-secondary/20 rounded-lg border border-border/40">
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center tracking-wider">
              <Layers size={10} className="mr-1.5" /> Active Context
            </h4>
            <div className="space-y-2">
               <div className="text-xs font-semibold truncate flex items-center" title={activeRepo}>
                  <GitPullRequest size={12} className="mr-2 text-primary shrink-0" />
                  <span className="truncate">{activeRepo.split('/')[1] || activeRepo}</span>
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">({activeRepo.split('/')[0]})</span>
               </div>
               <div className="flex items-center pl-5">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono bg-background/50">
                    {activeBranch || "main"}
                  </Badge>
               </div>
            </div>
         </div>
       )}

      <div className="mb-6 flex-1 overflow-y-auto w-full">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Navigation</h3>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-xs font-medium"
              render={<Link to={item.path} />}
              nativeButton={false}
            >
              <item.icon className="mr-2 h-3.5 w-3.5" />
              {item.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-auto border-t border-border pt-4">
        <div className="flex items-center space-x-2 text-xs text-green-500">
          <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
}

function DashboardHome({ activeRepo, activeBranch }: any) {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTasks(d.slice(0, 5));
      })
      .catch(console.error);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Overview</h2>
          <p className="text-muted-foreground text-lg">System analytics and active pipeline status.</p>
        </div>
        {!activeRepo && (
          <Button render={<Link to="/tasks" />} nativeButton={false}>
            <GitPullRequest className="mr-2 h-4 w-4" />
            Select Repository
          </Button>
        )}
      </div>

      {activeRepo && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Layers className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Active Context</p>
                <h3 className="text-lg font-bold flex items-center">
                  {activeRepo} 
                  <Badge variant="outline" className="ml-3 font-mono text-[10px] bg-background">
                    {activeBranch || 'main'}
                  </Badge>
                </h3>
              </div>
            </div>
            <Button variant="outline" size="sm" render={<Link to="/tasks" />} nativeButton={false}>Change</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Tasks</CardDescription>
            <CardTitle className="text-4xl">{tasks.filter(t => t.status !== 'completed' && t.status !== 'failed').length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">In pipeline execution running</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4">Recent Pipelines</h3>
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-card/50 hover:bg-card transition-colors">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <GitPullRequest size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-base">{task.title}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    {task.repository && <Badge variant="secondary" className="font-mono text-[10px]">{task.repository}</Badge>}
                    <Badge variant="outline">{task.status}</Badge>
                    Generated {formatDistanceToNow(new Date(task.created_at))} ago by <span className="text-primary font-mono text-xs ml-1">{task.model_used || 'Auto'}</span>
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" render={<Link to="/tasks" />} nativeButton={false}>View More</Button>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && <div className="text-muted-foreground items-center flex">No tasks run yet.</div>}
      </div>
    </motion.div>
  );
}

function ModelsRegistry() {
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setModels(d);
      })
      .catch(console.error);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Models Registry</h2>
        <p className="text-muted-foreground">Configure AI providers and default routing for pipeline tasks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Providers (OpenRouter Free Tier)</CardTitle>
          <CardDescription>Available endpoints for generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Model ID</th>
                  <th className="p-4 font-medium">Provider</th>
                  <th className="p-4 font-medium">Category Usage</th>
                  <th className="p-4 font-medium">Status / Cost</th>
                  <th className="p-4 font-medium">Default</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono text-primary flex items-center gap-2">
                       {m.id}
                       {m.is_available === false && <Badge variant="destructive" className="text-[10px]">UNAVAILABLE</Badge>}
                       {m.is_available === true && <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/20">READY</Badge>}
                    </td>
                    <td className="p-4">{m.provider}</td>
                    <td className="p-4"><Badge variant="outline">{m.category}</Badge></td>
                    <td className="p-4">{m.cost_indicator}</td>
                    <td className="p-4">{m.is_default && <Badge variant="secondary">Running</Badge>}</td>
                  </tr>
                ))}
                {models.length === 0 && (
                   <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading models...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TasksAndPatches({ activeRepo, setActiveRepo, activeBranch, setActiveBranch }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modelId, setModelId] = useState("");
  
  const [repoResults, setRepoResults] = useState<any[]>([]);
  const [branchResults, setBranchResults] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  
  const [open, setOpen] = useState(false);

  // Sync session to backend when changed in UI
  const handleRepoChange = (val: string) => {
    setActiveRepo(val);
    fetch('/api/github/session', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ userId: 'web-user', selected_repo: val, selected_branch: "" })
    });
  };

  const handleBranchChange = (val: string) => {
    setActiveBranch(val);
    fetch('/api/github/session', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ userId: 'web-user', selected_branch: val })
    });
  };

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTasks(d);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTasks();
    const iv = setInterval(fetchTasks, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setModels(d);
      })
      .catch(console.error);
  }, []);

  // Fetch repositories on dialog open if empty
  useEffect(() => {
    if (open && repoResults.length === 0) {
      setIsLoadingRepos(true);
      fetch('/api/github/repos')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRepoResults(data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingRepos(false));
    }
  }, [open, repoResults.length]);

  // Fetch branches when repository changes
  useEffect(() => {
    if (activeRepo) {
      setBranchResults([]);
      setIsLoadingBranches(true);
      
      const [owner, repo] = activeRepo.split('/');
      if (owner && repo) {
        fetch(`/api/github/repos/${owner}/${repo}/branches`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setBranchResults(data);
              // Find default or main branch if none selected
              if (!activeBranch) {
                const defaultBranch = data.find(b => b.name === 'main' || b.name === 'master');
                if (defaultBranch) handleBranchChange(defaultBranch.name);
                else if (data.length > 0) handleBranchChange(data[0].name);
              }
            }
          })
          .catch(console.error)
          .finally(() => setIsLoadingBranches(false));
      } else {
        setIsLoadingBranches(false);
      }
    } else {
      setBranchResults([]);
    }
  }, [activeRepo]);

  const handleLaunch = async () => {
    if (!title || !description || !activeRepo || !activeBranch) return;
    
    await fetch('/api/tasks/execute', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, modelId, repository: activeRepo, branch: activeBranch })
    });
    
    setOpen(false);
    setTitle("");
    setDescription("");
    fetchTasks();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Tasks & Patches</h2>
          <p className="text-muted-foreground">Manage ongoing tasks, review AI-generated patches, and approve merges.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Bot className="mr-2 h-4 w-4" />
            New Agent Task
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Agent Pipeline</DialogTitle>
              <DialogDescription>
                Trigger a multi-agent architectural execution pipeline based on your instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <label className="text-sm font-medium">Task Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Refactor authentication module" />
              </div>
              <div className="grid items-center gap-2">
                <label className="text-sm font-medium">Engineering Instructions</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide detailed instructions for the Planner." className="h-24" />
              </div>
              <div className="grid items-center gap-2">
                <label className="text-sm font-medium flex justify-between">
                  Target Repository
                  {isLoadingRepos && <span className="text-[10px] text-muted-foreground flex items-center"><div className="mr-1 w-2 h-2 rounded-full border border-primary border-t-transparent animate-spin"></div> Loading...</span>}
                </label>
                <Select value={activeRepo} onValueChange={handleRepoChange} disabled={isLoadingRepos || repoResults.length === 0}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder={isLoadingRepos ? "Fetching repositories..." : (repoResults.length === 0 ? "No repositories found" : "Select repository")} />
                  </SelectTrigger>
                  <SelectContent>
                    {repoResults.map((repo) => (
                      <SelectItem key={repo.id || repo.full_name} value={repo.full_name}>
                        <div className="flex flex-col items-start py-1">
                          <span className="font-semibold text-sm">{repo.full_name} {repo.private && "🔒"}</span>
                          <span className="text-[10px] text-muted-foreground">Default: {repo.default_branch} • {repo.visibility}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                 <label className="text-sm font-medium flex justify-between">
                  Target Branch
                  {isLoadingBranches && <span className="text-[10px] text-muted-foreground flex items-center"><div className="mr-1 w-2 h-2 rounded-full border border-primary border-t-transparent animate-spin"></div> Loading...</span>}
                </label>
                <Select value={activeBranch} onValueChange={handleBranchChange} disabled={!activeRepo || isLoadingBranches || branchResults.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!activeRepo ? "Select a repository first" : (isLoadingBranches ? "Fetching branches..." : "Select branch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {branchResults.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <label className="text-sm font-medium">Model Routing (Base)</label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Automatic Selection (Any Free)" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleLaunch} disabled={!title || !description || !activeRepo || !activeBranch}><Play className="w-4 h-4 mr-2" /> Launch Pipeline</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 mt-6">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:border-primary/50 transition-colors">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                  <GitPullRequest size={18} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-lg">{task.title}</h4>
                    <Badge variant={
                      task.status === 'failed' ? 'destructive' :
                      task.status === 'completed' || task.status === 'pending_approval' ? 'secondary' : 'default'} className="font-mono text-xs">
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-3 mt-1">
                    {task.repository && <Badge variant="outline" className="font-mono text-[10px]">{task.repository}</Badge>}
                    {task.branch && <Badge variant="outline" className="font-mono text-[10px]"><GitPullRequest size={10} className="inline mr-1" />{task.branch}</Badge>}
                    <span className="flex items-center gap-1"><Bot size={14}/> {task.model_used || "Assigned by OpenRouter"}</span>
                    <span>•</span>
                    <span>Created {formatDistanceToNow(new Date(task.created_at))} ago</span>
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => window.open(`/api/tasks/${task.id}/logs`, '_blank')}>View Pipeline Logs</Button>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="text-center p-12 border rounded-lg border-dashed text-muted-foreground">
            No active tasks.
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [defaultModel, setDefaultModel] = useState<any>(null);
  const [latency, setLatency] = useState<number>(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState("");
  const [activeRepo, setActiveRepo] = useState("");
  const [activeBranch, setActiveBranch] = useState("");

  useEffect(() => {
    // Fetch session
    fetch('/api/github/session?userId=web-user')
      .then(res => res.json())
      .then(data => {
        if (data.selected_repo) setActiveRepo(data.selected_repo);
        if (data.selected_branch) setActiveBranch(data.selected_branch);
      })
      .catch(console.error);

    // Fetch models and pick the default
    fetch('/api/models')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          const def = d.find((m: any) => m.is_default);
          setDefaultModel(def || d[0]);
        }
      })
      .catch(console.error);

    // Fetch tasks
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTasks(d);
      })
      .catch(console.error);

    // Ping API for "latency"
    const start = Date.now();
    fetch('/api/health').then(() => setLatency(Date.now() - start)).catch(console.error);

    // Update session duration counter
    const iv = setInterval(() => {
      const diff = Date.now() - sessionStartTime;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setSessionDuration(`${hours}h ${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(iv);
  }, [sessionStartTime]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden bg-background font-sans">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-popover shrink-0">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-muted-foreground tracking-tight flex items-center space-x-2">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               <span>{defaultModel ? `${defaultModel.name} (${defaultModel.cost_indicator})` : "Loading provider..."}</span>
               <div className="px-2 py-0.5 bg-secondary rounded text-[10px] text-green-500 border border-green-500/20 font-mono w-fit ml-2">SYS: ONLINE</div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 border border-white/10 shrink-0"></div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeRepo={activeRepo} activeBranch={activeBranch} />
          <main className="flex-1 overflow-y-auto bg-background">
            <Routes>
              <Route path="/" element={<DashboardHome activeRepo={activeRepo} activeBranch={activeBranch} />} />
              <Route path="/models" element={<ModelsRegistry />} />
              <Route path="/tasks" element={<TasksAndPatches activeRepo={activeRepo} setActiveRepo={setActiveRepo} activeBranch={activeBranch} setActiveBranch={setActiveBranch} />} />
              <Route path="*" element={<div className="p-8 text-muted-foreground">WIP / Coming soon. Check Dashboard.</div>} />
            </Routes>
          </main>
        </div>

        {/* Footer Status */}
        <footer className="h-8 border-t border-border bg-popover px-4 flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-tight shrink-0">
          <div className="flex items-center space-x-4">
            <span>SESSION: {sessionDuration || "0h 0m 0s"}</span>
            <span>API LATENCY: {latency > 0 ? `${latency}ms` : "--- ms"}</span>
            <span className="text-secondary-foreground">TASKS EXECUTED: {tasks.filter(t => t.status === 'completed' || t.status === 'pending_approval').length} / {tasks.length}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>BASE MODEL: {defaultModel?.id || 'default'}</span>
            <span className="text-green-500/80">API: OK</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

