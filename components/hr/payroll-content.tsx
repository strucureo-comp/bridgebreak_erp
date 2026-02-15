'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DollarSign, Plus, ArrowUpRight, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createSalaryStructure, generatePayroll, postPayrollToFinance } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Employee, SalaryStructure, Payroll } from '@/lib/db/types';

interface PayrollContentProps {
    employees: Employee[];
    salaryStructures: SalaryStructure[];
    payrolls: Payroll[];
    onRefresh: () => void;
}

export function PayrollContent({ employees, salaryStructures, payrolls, onRefresh }: PayrollContentProps) {
    const [salaryOpen, setSalaryOpen] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [posting, setPosting] = useState<string | null>(null);

    const handleCreateSalary = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await createSalaryStructure({
                employee_id: fd.get('employee_id'),
                effective_from: fd.get('effective_from'),
                basic: fd.get('basic'),
                hra: fd.get('hra'),
                da: fd.get('da'),
                ta: fd.get('ta'),
                special_allowance: fd.get('special_allowance'),
                pf_employee: fd.get('pf_employee'),
                pf_employer: fd.get('pf_employer'),
                esi_employee: fd.get('esi_employee'),
                esi_employer: fd.get('esi_employer'),
                professional_tax: fd.get('professional_tax'),
                tds: fd.get('tds'),
            });
            toast.success('Salary structure created');
            setSalaryOpen(false);
            onRefresh();
        } catch { toast.error('Failed to create salary structure'); }
    };

    const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await generatePayroll(fd.get('month') as string);
            toast.success('Payroll generated');
            setGenerateOpen(false);
            onRefresh();
        } catch { toast.error('Failed to generate payroll'); }
    };

    const handlePost = async (payrollId: string) => {
        setPosting(payrollId);
        try {
            const result = await postPayrollToFinance(payrollId);
            toast.success(result.message);
            onRefresh();
        } catch { toast.error('Failed to post to finance'); }
        finally { setPosting(null); }
    };

    return (
        <div className="space-y-8">
            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
                <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-xs"><Plus className="h-3.5 w-3.5" /> Salary Structure</Button></DialogTrigger>
                    <DialogContent className="max-w-lg rounded-3xl">
                        <DialogHeader><DialogTitle>Create Salary Structure</DialogTitle><DialogDescription>Define salary breakup with PF/ESI</DialogDescription></DialogHeader>
                        <form onSubmit={handleCreateSalary} className="space-y-4 mt-2">
                            <select name="employee_id" required className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                                <option value="">Select Employee</option>
                                {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <Input name="effective_from" type="date" required className="rounded-xl" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input name="basic" type="number" placeholder="Basic" required className="rounded-xl" />
                                <Input name="hra" type="number" placeholder="HRA" defaultValue="0" className="rounded-xl" />
                                <Input name="da" type="number" placeholder="DA" defaultValue="0" className="rounded-xl" />
                                <Input name="ta" type="number" placeholder="TA" defaultValue="0" className="rounded-xl" />
                                <Input name="special_allowance" type="number" placeholder="Special Allow." defaultValue="0" className="rounded-xl" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Deductions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Input name="pf_employee" type="number" placeholder="PF (Emp)" defaultValue="0" className="rounded-xl" />
                                <Input name="pf_employer" type="number" placeholder="PF (Company)" defaultValue="0" className="rounded-xl" />
                                <Input name="esi_employee" type="number" placeholder="ESI (Emp)" defaultValue="0" className="rounded-xl" />
                                <Input name="esi_employer" type="number" placeholder="ESI (Company)" defaultValue="0" className="rounded-xl" />
                                <Input name="professional_tax" type="number" placeholder="Prof. Tax" defaultValue="0" className="rounded-xl" />
                                <Input name="tds" type="number" placeholder="TDS" defaultValue="0" className="rounded-xl" />
                            </div>
                            <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">Save Structure</Button>
                        </form>
                    </DialogContent>
                </Dialog>
                <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                    <DialogTrigger asChild><Button variant="outline" className="rounded-xl gap-2 text-xs"><FileText className="h-3.5 w-3.5" /> Generate Payroll</Button></DialogTrigger>
                    <DialogContent className="max-w-sm rounded-3xl">
                        <DialogHeader><DialogTitle>Generate Payroll</DialogTitle><DialogDescription>Select month to generate payroll</DialogDescription></DialogHeader>
                        <form onSubmit={handleGenerate} className="space-y-3 mt-2">
                            <Input name="month" type="month" required className="rounded-xl" />
                            <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">Generate</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Salary Structures */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Active Salary Structures</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {salaryStructures.filter(s => s.is_current).map(s => (
                        <Card key={s.id} className="rounded-2xl border-none shadow-sm bg-white hover:shadow-lg transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
                                    <div><h4 className="font-bold text-sm">{s.employee?.name || 'Employee'}</h4><p className="text-[10px] text-slate-400">Effective: {new Date(s.effective_from).toLocaleDateString('en-IN')}</p></div>
                                </div>
                                <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between text-slate-500"><span>Gross</span><span className="font-bold text-slate-800">₹{s.gross_salary?.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-slate-500"><span>PF (Emp)</span><span className="font-medium">₹{s.pf_employee?.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-slate-500"><span>ESI (Emp)</span><span className="font-medium">₹{s.esi_employee?.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-100 pt-1 mt-1"><span>Net</span><span>₹{s.net_salary?.toLocaleString()}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {salaryStructures.filter(s => s.is_current).length === 0 && <p className="text-sm text-slate-400 col-span-full py-8 text-center">No salary structures defined</p>}
                </div>
            </div>

            {/* Payroll History */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Payroll History</h3>
                <div className="grid gap-3">
                    {payrolls.map(p => (
                        <Card key={p.id} className="rounded-2xl border-none shadow-sm bg-white">
                            <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                                <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-slate-800">{p.month}</h4>
                                    <p className="text-[11px] text-slate-400">{p.lines?.length || 0} employee(s) · ₹{Number(p.total_amount).toLocaleString()}</p>
                                </div>
                                <Badge variant="outline" className={cn('text-[10px]',
                                    p.status === 'posted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                        p.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            p.status === 'paid' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                                'bg-slate-50 text-slate-500 border-slate-200'
                                )}>{p.status}</Badge>
                                {p.posted_to_finance ? (
                                    <Badge className="text-[10px] bg-emerald-500 text-white gap-1"><CheckCircle className="h-3 w-3" /> Posted</Badge>
                                ) : (p.status === 'approved' || p.status === 'paid') ? (
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        onClick={() => handlePost(p.id)} disabled={posting === p.id}>
                                        <ArrowUpRight className="h-3.5 w-3.5" /> {posting === p.id ? 'Posting…' : 'Post to Finance'}
                                    </Button>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}
                    {payrolls.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">No payrolls generated</p>}
                </div>
            </div>
        </div>
    );
}
