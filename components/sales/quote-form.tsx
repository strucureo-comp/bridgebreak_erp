'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createQuote, getCustomers } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Save, RefreshCcw, Building2, Calendar, DollarSign, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerAccount } from '@/lib/db/types';

interface QuoteFormProps {
    onSuccess: () => void;
}

export function QuoteForm({ onSuccess }: QuoteFormProps) {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<CustomerAccount[]>([]);

    useEffect(() => {
        getCustomers().then(setCustomers).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);

        try {
            await createQuote({
                account_id: fd.get('account_id') as string,
                total_amount: Number(fd.get('total_amount')),
                valid_until: fd.get('valid_until') as string,
                status: 'draft',
                currency: 'AED' // Defaulting for now, could be dynamic
            });
            toast.success('Quote created successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to create quote');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card">
            <div className="p-6 bg-foreground text-card-foreground">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight uppercase">New Quotation</h3>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Draft Proposal</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">1. Client & Validity</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Customer Account</Label>
                            <Select name="account_id" required>
                                <SelectTrigger className="h-10 border-border text-xs font-bold uppercase">
                                    <SelectValue placeholder="Select Client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Valid Until</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="valid_until" type="date" required className="h-10 pl-9 border-border" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">2. Financials</Label>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Estimated Total (AED)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input name="total_amount" type="number" required className="h-10 pl-9 border-border font-bold" placeholder="0.00" />
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
                                <Save size={14} /> Create Draft Quote
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
