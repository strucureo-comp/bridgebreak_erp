'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLead } from '@/lib/api';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, Globe, RefreshCcw, Save } from 'lucide-react';

interface LeadFormProps {
    onSuccess: () => void;
}

export function LeadForm({ onSuccess }: LeadFormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);

        try {
            await createLead({
                first_name: fd.get('first_name') as string,
                last_name: fd.get('last_name') as string,
                email: fd.get('email') as string,
                phone: fd.get('phone') as string,
                company: fd.get('company') as string,
                source: 'Direct Entry',
                status: 'new',
            });
            toast.success('Lead created successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to create lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card">
            <div className="p-6 bg-foreground text-card-foreground">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight uppercase">New Lead Entry</h3>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Prospect Registration</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">1. Prospect Identity</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">First Name</Label>
                            <Input name="first_name" required className="h-10 border-border font-bold" placeholder="John" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</Label>
                            <Input name="last_name" required className="h-10 border-border font-bold" placeholder="Doe" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">2. Contact & Organization</Label>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Company Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input name="company" className="h-10 pl-9 border-border" placeholder="Acme Corp" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="email" type="email" required className="h-10 pl-9 border-border" placeholder="john@acme.com" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="phone" className="h-10 pl-9 border-border" placeholder="+1 234 567 890" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 sticky bottom-0 bg-card">
                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save size={14} /> Commit Lead Record
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
