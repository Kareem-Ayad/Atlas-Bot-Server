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

function Sidebar() {
// ... same sidebar
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
      <div className="mb-6 flex-1 overflow-y-auto w-full">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Navigation</h3>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-xs font-medium"
              render={<Link to={item.path} />}
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

function DashboardHome() {
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Overview</h2>
        <p className="text-muted-foreground text-lg">System analytics and active pipeline status.</p>
      </div>

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
                <Button variant="outline" render={<Link to="/tasks" />}>View More</Button>
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
                  <th className="p-4 font-medium">Cost Indicator</th>
                  <th className="p-4 font-medium">Default</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono text-primary">{m.id}</td>
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

function TasksAndPatches() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modelId, setModelId] = useState("");
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("");
  
  const [repoResults, setRepoResults] = useState<any[]>([]);
  const [branchResults, setBranchResults] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  
  const [open, setOpen] = useState(false);

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
    if (repository) {
      setBranch("");
      setBranchResults([]);
      setIsLoadingBranches(true);
      
      const [owner, repo] = repository.split('/');
      if (owner && repo) {
        fetch(`/api/github/repos/${owner}/${repo}/branches`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setBranchResults(data);
              // Find default or main branch
              const defaultBranch = data.find(b => b.name === 'main' || b.name === 'master');
              if (defaultBranch) setBranch(defaultBranch.name);
              else if (data.length > 0) setBranch(data[0].name);
            }
          })
          .catch(console.error)
          .finally(() => setIsLoadingBranches(false));
      } else {
        setIsLoadingBranches(false);
      }
    } else {
      setBranchResults([]);
      setBranch("");
    }
  }, [repository]);

  const handleLaunch = async () => {
    if (!title || !description || !repository || !branch) return;
    
    await fetch('/api/tasks/execute', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, modelId, repository, branch })
    });
    
    setOpen(false);
    setTitle("");
    setDescription("");
    setRepository("");
    setBranch("");
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
                <Select value={repository} onValueChange={setRepository} disabled={isLoadingRepos || repoResults.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingRepos ? "Fetching repositories..." : (repoResults.length === 0 ? "No repositories found" : "Select repository")} />
                  </SelectTrigger>
                  <SelectContent>
                    {repoResults.map((repo) => (
                      <SelectItem key={repo.id || repo.full_name} value={repo.full_name}>
                        {repo.full_name} {repo.private && "🔒"}
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
                <Select value={branch} onValueChange={setBranch} disabled={!repository || isLoadingBranches || branchResults.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!repository ? "Select a repository first" : (isLoadingBranches ? "Fetching branches..." : "Select branch")} />
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
              <Button onClick={handleLaunch} disabled={!title || !description || !repository || !branch}><Play className="w-4 h-4 mr-2" /> Launch Pipeline</Button>
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

  useEffect(() => {
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
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/models" element={<ModelsRegistry />} />
              <Route path="/tasks" element={<TasksAndPatches />} />
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

