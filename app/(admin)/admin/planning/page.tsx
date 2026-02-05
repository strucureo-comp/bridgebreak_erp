'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getPlanningNotes, createPlanningNote, updatePlanningNote, deletePlanningNote } from '@/lib/api';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Plus, 
    Trash2, 
    Lightbulb, 
    Target, 
    CheckSquare, 
    StickyNote, 
    RefreshCcw, 
    ChevronRight, 
    ShieldCheck, 
    Activity, 
    TrendingUp,
    LayoutGrid,
    Zap,
    Box
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { PlanningNote } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function AdminPlanningPage() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<PlanningNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<PlanningNote['category']>('idea');

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getPlanningNotes();
            setNotes(data || []);
        } catch { toast.error('Failed to load roadmap'); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => ({
        total: notes.length,
        ideas: notes.filter(n => n.category === 'idea').length,
        strategies: notes.filter(n => n.category === 'strategy').length,
        tasks: notes.filter(n => n.category === 'todo').length
    }), [notes]);

    const Categories = {
        idea: { label: 'Ideas', icon: Lightbulb, color: 'blue' },
        strategy: { label: 'Strategy', icon: Target, color: 'indigo' },
        todo: { label: 'To-Do', icon: CheckSquare, color: 'emerald' },
        other: { label: 'General', icon: StickyNote, color: 'slate' },
    };

    const handleCreateNote = async () => {
        if (!title) return toast.error('Title required');
        try {
            await createPlanningNote({ title, content, category, created_by: user!.id });
            toast.success('Note pinned to roadmap');
            setIsDialogOpen(false);
            setTitle(''); setContent('');
            fetchData();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Permanently remove this note?')) {
            try {
                await deletePlanningNote(id);
                fetchData();
                toast.success('Note removed');
            } catch { toast.error('Delete failed'); }
        }
    };

    if (!isMounted) return null;

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-bold text-slate-900">Loading Strategic Roadmap...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Strategic Roadmap</h1>
                        <p className="text-slate-500 font-medium">Coordinate internal ideas, strategies, and tasks.</p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                        <Plus className="h-5 w-5 mr-2" /> New Strategy Note
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <PlanningKPI title="Total Pinned" value={stats.total} icon={LayoutGrid} color="slate" />
                    <PlanningKPI title="New Ideas" value={stats.ideas} icon={Lightbulb} color="blue" />
                    <PlanningKPI title="Strategies" value={stats.strategies} icon={Target} color="indigo" />
                    <PlanningKPI title="Execution" value={stats.tasks} icon={CheckSquare} color="emerald" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {(Object.keys(Categories) as Array<keyof typeof Categories>).map((catKey) => {
                        const cat = Categories[catKey];
                        const catNotes = notes.filter(n => n.category === catKey);

                        return (
                            <div key={catKey} className="space-y-6">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-2 w-2 rounded-full", catKey === 'idea' ? 'bg-blue-500' : catKey === 'strategy' ? 'bg-indigo-500' : catKey === 'todo' ? 'bg-emerald-500' : 'bg-slate-400')} />
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{cat.label}</span>
                                    </div>
                                    <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-400 font-black border-none">{catNotes.length}</Badge>
                                </div>

                                <div className="space-y-4">
                                    {catNotes.map(note => (
                                        <Card key={note.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 relative">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-black text-slate-900 leading-tight">{note.title}</h4>
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-slate-50 text-slate-200 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => handleDelete(note.id, e)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                                <p className="text-sm font-medium text-slate-400 line-clamp-4 leading-relaxed italic">
                                                    &ldquo;{note.content}&rdquo;
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        className="w-full h-16 rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
                                        onClick={() => { setCategory(catKey); setIsDialogOpen(true); }}
                                    >
                                        <Plus size={16} className="mr-2" /> Add to {cat.label}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-xl rounded-[2.5rem] p-8">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-3xl font-black">Strategic Entry</DialogTitle>
                            <DialogDescription className="text-base font-medium">Pin an idea or task to the internal roadmap.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-6">
                            <div className="space-y-2">
                                <Label className="font-bold ml-1">Focus Area</Label>
                                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="idea">Idea / Innovation</SelectItem>
                                        <SelectItem value="strategy">Strategic Goal</SelectItem>
                                        <SelectItem value="todo">Execution Task</SelectItem>
                                        <SelectItem value="other">General Note</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold ml-1">Objective Title</Label>
                                <Input className="h-12 rounded-xl font-bold" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Expand to UAE Region" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold ml-1">Strategic Details</Label>
                                <Textarea className="rounded-xl min-h-[150px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Elaborate on the vision..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateNote} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95">Pin Objective</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}

function PlanningKPI({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
    const variants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
        slate: "bg-slate-50 text-slate-600 shadow-slate-100/50",
    };
    return (
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", variants[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </Card>
    );
}