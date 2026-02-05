'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getMeeting, updateMeeting, getUsers, getProjects } from '@/lib/api';
import { sendMeetingStatusEmail } from '@/lib/services/email';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { MeetingRequest, User, Project } from '@/lib/db/types';

export default function EditMeetingPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [formData, setFormData] = useState({
        client_id: '',
        project_id: '',
        purpose: '',
        requested_date: '',
        duration_minutes: '',
        status: 'pending' as 'pending' | 'accepted' | 'declined' | 'completed',
        meeting_link: '',
    });

    useEffect(() => {
        if (adminUser?.role === 'admin') {
            fetchData();
        }
    }, [adminUser, params.id]);

    const fetchData = async () => {
        try {
            const [meetingData, usersData, projectsData] = await Promise.all([
                getMeeting(params.id),
                getUsers(),
                getProjects(),
            ]);

            if (meetingData) {
                setFormData({
                    client_id: meetingData.client_id,
                    project_id: meetingData.project_id || '',
                    purpose: meetingData.purpose,
                    requested_date: meetingData.requested_date.substring(0, 16), // datetime-local format
                    duration_minutes: meetingData.duration_minutes.toString(),
                    status: meetingData.status,
                    meeting_link: meetingData.meeting_link || '',
                });
            } else {
                toast.error('Meeting not found');
                router.push('/admin/meetings');
            }

            setUsers(usersData.filter(u => u.role === 'client'));
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const success = await updateMeeting(params.id, {
                client_id: formData.client_id,
                project_id: formData.project_id || undefined,
                purpose: formData.purpose,
                requested_date: new Date(formData.requested_date).toISOString(),
                duration_minutes: parseInt(formData.duration_minutes),
                status: formData.status,
                meeting_link: formData.meeting_link || undefined,
            });

            if (success) {
                // Send email notification if status changed to accepted
                if (formData.status === 'accepted') {
                    const client = users.find(u => u.id === formData.client_id);
                    if (client?.email) {
                        try {
                            // Send to client
                            await sendMeetingStatusEmail(
                                client.email,
                                formData.purpose,
                                formData.requested_date,
                                parseInt(formData.duration_minutes),
                                'accepted',
                                formData.meeting_link
                            );

                            // Send to admin
                            if (adminUser?.email) {
                                await sendMeetingStatusEmail(
                                    adminUser.email,
                                    `CONFIRMED: ${formData.purpose} (Client: ${client.full_name})`,
                                    formData.requested_date,
                                    parseInt(formData.duration_minutes),
                                    'accepted',
                                    formData.meeting_link
                                );
                            }
                            toast.success('Confirmation emails sent');
                        } catch (emailError) {
                            console.error('Failed to send confirmation emails:', emailError);
                            toast.error('Meeting updated but emails could not be sent');
                        }
                    }
                }

                toast.success('Meeting updated successfully');
                router.push('/admin/meetings');
            } else {
                toast.error('Failed to update meeting');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardShell requireAdmin>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/meetings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Meeting</h1>
                        <p className="text-muted-foreground">Update meeting request details</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Meeting Details</CardTitle>
                        <CardDescription>Update information for this meeting request</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="client">Client *</Label>
                                    <Select
                                        value={formData.client_id}
                                        onValueChange={(value) => setFormData({ ...formData, client_id: value, project_id: '' })}
                                        disabled={saving}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.full_name} ({u.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project">Project (Optional)</Label>
                                    <Select
                                        value={formData.project_id}
                                        onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                                        disabled={saving || !formData.client_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={formData.client_id ? "Select a project" : "Select a client first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Project</SelectItem>
                                            {projects.filter(p => p.client_id === formData.client_id).map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purpose">Purpose *</Label>
                                <Input
                                    id="purpose"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="requested_date">Scheduled Date & Time *</Label>
                                    <Input
                                        id="requested_date"
                                        type="datetime-local"
                                        value={formData.requested_date}
                                        onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                                        required
                                        disabled={saving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes) *</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        required
                                        disabled={saving}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                                    disabled={saving}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="accepted">Accepted</SelectItem>
                                        <SelectItem value="declined">Declined</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meeting_link">Google Meet Link</Label>
                                <Input
                                    id="meeting_link"
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    value={formData.meeting_link}
                                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                    disabled={saving}
                                />
                                <p className="text-xs text-muted-foreground">If provided, this link will be sent to the client in the confirmation email.</p>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/admin/meetings')}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell >
    );
}
