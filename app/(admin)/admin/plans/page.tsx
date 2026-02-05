'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPlanningNotes, createPlanningNote, updatePlanningNote, deletePlanningNote } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';
import { 
    Plus, 
    Trash2, 
    Save, 
    Book, 
    Loader2, 
    StickyNote, 
    RefreshCcw, 
    ChevronRight, 
    ShieldCheck, 
    Activity, 
    Zap,
    PenTool,
    ChevronLeft
} from 'lucide-react';
import type { PlanningNote } from '@/lib/db/types';
import { cn } from '@/lib/utils';

export default function AdminPlansPage() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<PlanningNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Editor State
    const [editorTitle, setEditorTitle] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [editorCategory, setEditorCategory] = useState<'idea' | 'strategy' | 'todo' | 'other'>('idea');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getPlanningNotes();
            setNotes(data || []);
        } catch { toast.error('Notebook error'); }
        finally { setLoading(false); }
    };

    const handleSelectNote = (note: PlanningNote) => {
        setSelectedNoteId(note.id);
        setEditorTitle(note.title);
        setEditorContent(note.content);
        setEditorCategory(note.category);
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setSelectedNoteId(null);
        setEditorTitle('');
        setEditorContent('');
        setEditorCategory('idea');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editorTitle.trim()) return toast.error('Title required');
        setSaving(true);
        try {
            if (selectedNoteId) {
                await updatePlanningNote(selectedNoteId, { title: editorTitle, content: editorContent, category: editorCategory });
                toast.success('Thought updated');
            } else {
                const newId = await createPlanningNote({ title: editorTitle, content: editorContent, category: editorCategory, created_by: user!.id });
                if (newId) setSelectedNoteId(newId);
                toast.success('Thought pinned');
            }
            fetchData();
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Erase this entry?')) {
            try {
                await deletePlanningNote(id);
                if (selectedNoteId === id) setIsEditing(false);
                fetchData();
                toast.success('Entry erased');
            } catch { toast.error('Delete failed'); }
        }
    };

    if (!isMounted) return null;

    if (loading && notes.length === 0) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-bold text-slate-900">Opening Notebook...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-8 pb-12 h-[calc(100vh-8rem)] flex flex-col">
                {/* Visual Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Idea Notebook</h1>
                        <p className="text-slate-500 font-medium">Draft strategies, mission goals, and team ideas.</p>
                    </div>
                    {!isEditing && (
                        <Button onClick={handleCreateNew} className="rounded-2xl bg-primary h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                            <Plus className="h-5 w-5 mr-2" /> New Entry
                        </Button>
                    )}
                </div>

                <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
                    {/* Visual Sidebar */}
                    <div className={cn(
                        "md:w-1/3 lg:w-1/4 flex flex-col gap-6",
                        isEditing && "hidden md:flex"
                    )}>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">All Entries</h2>
                            <Badge className="bg-slate-100 text-slate-400 border-none font-black">{notes.length}</Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {notes.map(note => (
                                <Card 
                                    key={note.id} 
                                    onClick={() => handleSelectNote(note)}
                                    className={cn(
                                        "rounded-[2rem] border-none shadow-sm cursor-pointer transition-all duration-500 group",
                                        selectedNoteId === note.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white hover:bg-slate-50"
                                    )}
                                >
                                    <CardContent className="p-6 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <Badge className={cn(
                                                "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-none",
                                                selectedNoteId === note.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {note.category}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 text-slate-400 hover:text-rose-500" onClick={(e) => handleDelete(note.id, e)}>
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                        <h4 className="font-black text-base truncate leading-tight">{note.title || 'Untitled'}</h4>
                                        <p className={cn(
                                            "text-xs line-clamp-2 leading-relaxed font-medium",
                                            selectedNoteId === note.id ? "text-slate-400" : "text-slate-400"
                                        )}>
                                            {note.content}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Premium Editor */}
                    <div className={cn(
                        "flex-1 flex flex-col min-h-0",
                        !isEditing && "hidden md:flex"
                    )}>
                        {isEditing ? (
                            <Card className="flex-1 rounded-[3rem] border-none shadow-sm bg-white overflow-hidden flex flex-col border-4 border-slate-50">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Button variant="ghost" size="icon" className="md:hidden rounded-xl bg-slate-50" onClick={() => setIsEditing(false)}>
                                            <ChevronLeft size={20} />
                                        </Button>
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <PenTool size={24} />
                                        </div>
                                        <Input
                                            value={editorTitle}
                                            onChange={(e) => setEditorTitle(e.target.value)}
                                            placeholder="Entry Title..."
                                            className="text-2xl font-black border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-slate-200"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Select value={editorCategory} onValueChange={(v: any) => setEditorCategory(v)}>
                                            <SelectTrigger className="w-[120px] h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-xl">
                                                <SelectItem value="idea">Idea</SelectItem>
                                                <SelectItem value="strategy">Strategy</SelectItem>
                                                <SelectItem value="todo">Task</SelectItem>
                                                <SelectItem value="other">General</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-slate-900 h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200">
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Entry"}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <Textarea
                                        value={editorContent}
                                        onChange={(e) => setEditorContent(e.target.value)}
                                        placeholder="Begin drafting your thoughts..."
                                        className="w-full h-full resize-none border-none focus-visible:ring-0 p-10 text-lg leading-relaxed font-medium text-slate-600 placeholder:text-slate-100"
                                    />
                                </div>
                            </Card>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 p-12 text-center space-y-6">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-white flex items-center justify-center text-slate-100 shadow-sm">
                                    <Book size={48} strokeWidth={1.5} />
                                </div>
                                <div className="max-w-xs space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">Empty Page</h3>
                                    <p className="text-slate-400 font-medium leading-relaxed">Select an entry from the sidebar to continue drafting or start a new one.</p>
                                </div>
                                <Button onClick={handleCreateNew} variant="outline" className="rounded-2xl border-slate-200 h-12 px-10 font-bold hover:bg-white hover:shadow-md transition-all">
                                    <Plus className="mr-2 h-4 w-4" /> Start Writing
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}