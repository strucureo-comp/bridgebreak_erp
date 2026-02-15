"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPerformanceData, createPerformanceItem } from "@/lib/api";
import { format } from "date-fns";
import { Target, Award, Plus, Calendar, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PerformanceContent() {
    return (
        <Tabs defaultValue="goals" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl border border-slate-100">
                <TabsTrigger value="goals" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    <Target className="mr-2 h-4 w-4" /> Goals & Objectives
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                    <Award className="mr-2 h-4 w-4" /> Performance Reviews
                </TabsTrigger>
            </TabsList>

            <TabsContent value="goals">
                <GoalsList />
            </TabsContent>

            <TabsContent value="reviews">
                <ReviewsList />
            </TabsContent>
        </Tabs>
    );
}

function GoalsList() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => { loadGoals(); }, []);

    async function loadGoals() {
        const data = await getPerformanceData('goals');
        setGoals(data || []);
    }

    async function handleCreate() {
        if (!title) return toast.error("Title is required");
        try {
            await createPerformanceItem({ type: 'goal', title, description, due_date: date });
            toast.success("Goal created");
            setIsCreateOpen(false);
            loadGoals();
        } catch (e) { toast.error("Failed to create goal"); }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">My Objectives</h3>
                    <p className="text-slate-500 text-sm">Track your quarterly and annual goals.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Goal</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Set New Goal</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Increase sales by 10%" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreate}>Save Goal</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals.map(goal => (
                    <Card key={goal.id} className="relative group hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <Badge variant={goal.status === 'completed' ? 'default' : 'outline'}>
                                    {goal.status.replace('_', ' ')}
                                </Badge>
                                {goal.due_date && (
                                    <span className="text-xs text-slate-400 flex items-center">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {format(new Date(goal.due_date), 'MMM d')}
                                    </span>
                                )}
                            </div>
                            <CardTitle className="text-base mt-2">{goal.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {goals.length === 0 && (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Target className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No goals set yet.</p>
                </div>
            )}
        </div>
    )
}

function ReviewsList() {
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => { loadReviews(); }, []);

    async function loadReviews() {
        const data = await getPerformanceData('reviews');
        setReviews(data || []);
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle>Performance Reviews</CardTitle>
                <CardDescription>Past and upcoming evaluation cycles.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cycle</TableHead>
                            <TableHead>Reviewee</TableHead>
                            <TableHead>Reviewer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reviews.map(review => (
                            <TableRow key={review.id}>
                                <TableCell className="font-bold">{review.cycle}</TableCell>
                                <TableCell>{review.user?.full_name}</TableCell>
                                <TableCell>{review.reviewer?.full_name}</TableCell>
                                <TableCell><Badge variant="outline">{review.status}</Badge></TableCell>
                                <TableCell>{review.review_date ? format(new Date(review.review_date), 'MMM d, yyyy') : '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {reviews.length === 0 && (
                    <div className="text-center p-8 text-slate-400">No reviews found.</div>
                )}
            </CardContent>
        </Card>
    )
}
