'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Mail, Shield, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground font-medium">Manage your personal information and account settings.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Avatar Card */}
          <div className="md:col-span-4">
            <Card className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden h-full">
              <CardHeader className="text-center pb-2 bg-gradient-to-b from-accent-purple/10 to-transparent pt-8">
                <div className="mx-auto relative">
                  <div className="absolute inset-0 bg-accent-purple/20 blur-2xl rounded-full transform scale-110" />
                  <Avatar className="h-32 w-32 relative border-4 border-white shadow-xl">
                    <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-accent-purple to-accent-blue text-white">
                      {user ? getInitials(user.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{user?.full_name}</CardTitle>
                <CardDescription className="font-medium bg-accent-purple/10 text-accent-purple px-3 py-1 rounded-full text-xs w-fit mx-auto mt-2">
                  {user?.role === 'admin' ? 'Administrator' : 'Team Member'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Account Status</p>
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 py-1.5 px-3 rounded-full w-fit mx-auto">
                    <Shield size={14} />
                    <span className="text-xs">Active & Verified</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Member since {new Date(user?.created_at || '').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Card */}
          <div className="md:col-span-8">
            <Card className="rounded-4xl border-border/60 shadow-sm bg-card overflow-hidden h-full">
              <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <User size={20} />
                  </div>
                  Personal Details
                </CardTitle>
                <CardDescription className="ml-14">Update your contact information.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="full_name" className="text-sm font-bold text-foreground uppercase tracking-widest pl-1">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        className="h-12 pl-10 rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20 font-medium"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="email" className="text-sm font-bold text-foreground uppercase tracking-widest pl-1">Email Address</Label>
                    <div className="relative opacity-70">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="h-12 pl-10 rounded-xl border-border bg-muted/20 font-medium"
                        value={formData.email}
                        disabled
                      />
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground pl-1 flex items-center gap-1">
                      <Shield size={10} />
                      Email cannot be changed for security reasons
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}