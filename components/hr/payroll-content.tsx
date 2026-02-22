'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Plus, 
    Receipt, 
    Download,
    Users,
    ChevronRight,
    Search,
    Briefcase,
    FileText,
    Printer,
    Mail,
    ShieldCheck
} from 'lucide-react';
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
                employee_id: fd.get('employee_id') as string,
                effective_from: fd.get('effective_from') as string,
                basic: fd.get('basic') as string,
                hra: fd.get('hra') as string,
                da: fd.get('da') as string,
                ta: fd.get('ta') as string,
                special_allowance: fd.get('special_allowance') as string,
                pf_employee: fd.get('pf_employee') as string,
                pf_employer: fd.get('pf_employer') as string,
                esi_employee: fd.get('esi_employee') as string,
                esi_employer: fd.get('esi_employer') as string,
                professional_tax: fd.get('professional_tax') as string,
                tds: fd.get('tds') as string,
            });
            toast.success('Salary structure defined successfully');
            setSalaryOpen(false);
            onRefresh();
        } catch { toast.error('Failed to create salary structure'); }
    };

    const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await generatePayroll(fd.get('month') as string);
            toast.success('Monthly payroll generated');
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">Payroll Hub</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Salary Disbursement & Compliance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <Plus className="h-3.5 w-3.5" /> Define Structure
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Configure Salary Policy</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateSalary} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Staff Member</Label>
                                    <select name="employee_id" required className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
                                        <option value="">Select Employee...</option>
                                        {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Basic Salary (AED)</Label>
                                        <Input name="basic" type="number" required placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Effective Date</Label>
                                        <Input name="effective_from" type="date" required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save Policy</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    
                    <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px]">
                                <Receipt className="h-3.5 w-3.5" /> Run Cycle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Run Payroll Cycle</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Month</Label>
                                    <Input name="month" type="month" required />
                                </div>
                                <Button type="submit" className="w-full bg-primary h-10 font-bold uppercase tracking-widest text-[10px]">Generate Batch</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Salary Architectures */}
                <Card className="lg:col-span-2 border shadow-sm rounded-md overflow-hidden bg-card">
                    <CardHeader className="border-b bg-muted/50 py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Active Structures</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input placeholder="Filter staff..." className="h-8 pl-8 w-40 text-xs rounded-md" />
                        </div>
                    </CardHeader>
                    <div className="divide-y">
                        {salaryStructures.filter(s => s.is_current).map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{s.employee?.name}</p>
                                        <p className="text-[10px] font-medium text-muted-foreground">Last Revised: {new Date(s.effective_from).toLocaleDateString('en-AE')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-foreground">AED {Number(s.net_salary).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Current Net</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Payroll History & Payslips */}
                <Card className="border shadow-sm rounded-md overflow-hidden bg-card">
                    <CardHeader className="border-b bg-muted/50 py-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Disbursement Log</CardTitle>
                    </CardHeader>
                    <div className="divide-y">
                        {payrolls.map(p => (
                            <div key={p.id} className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-foreground uppercase">{p.month} Cycle</h4>
                                    <Badge variant="outline" className={cn(
                                        "text-[8px] font-black uppercase tracking-widest",
                                        p.status === 'posted' ? "border-emerald-100 text-emerald-700 bg-emerald-50" : "text-muted-foreground bg-muted"
                                    )}>{p.status}</Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 bg-muted rounded border border-border">
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Batch Value</p>
                                        <p className="text-[11px] font-black text-foreground">AED {Number(p.total_amount).toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded border border-border">
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Headcount</p>
                                        <p className="text-[11px] font-black text-foreground">{p.lines?.length || 0} Staff</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {p.posted_to_finance ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex-1 h-8 text-[9px] font-bold uppercase tracking-widest gap-1.5 rounded-md">
                                                    <FileText className="h-3 w-3 text-primary" /> View Payslips
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl p-0">
                                                <PayslipBrowser payroll={p} />
                                            </DialogContent>
                                        </Dialog>
                                    ) : (p.status === 'approved' || p.status === 'paid') ? (
                                        <Button 
                                            size="sm" 
                                            className="w-full h-8 text-[9px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90"
                                            onClick={() => handlePost(p.id)}
                                            disabled={posting === p.id}
                                        >
                                            {posting === p.id ? 'Processing...' : 'Post to Ledger'}
                                        </Button>
                                    ) : null}
                                    {p.posted_to_finance && (
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export function PayslipBrowser({ payroll }: { payroll: Payroll }) {
    const [selectedLine, setSelectedLine] = useState(payroll.lines?.[0] || null);

    return (
        <div className="flex flex-col h-[80vh] bg-card">
            <div className="p-6 border-b bg-muted flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Payslip Archive: {payroll.month}</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Electronic Disbursement Records</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Printer className="h-3 w-3" /> Print Batch
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Mail className="h-3 w-3" /> Email All
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Staff List */}
                <div className="w-64 border-r overflow-y-auto divide-y">
                    {payroll.lines?.map((line: any) => (
                        <div 
                            key={line.id} 
                            onClick={() => setSelectedLine(line)}
                            className={cn(
                                "p-4 cursor-pointer transition-colors",
                                selectedLine?.id === line.id ? "bg-primary/5 border-r-2 border-primary" : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <p className="text-xs font-bold text-foreground">{line.employee?.name || 'Staff Member'}</p>
                            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tighter mt-0.5">AED {Number(line.net_pay || 0).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Payslip Render */}
                <div className="flex-1 bg-muted p-10 flex items-center justify-center overflow-y-auto">
                    {selectedLine ? (
                        <div className="bg-card shadow-2xl border border-border w-full max-w-[500px] aspect-[1/1.414] p-10 flex flex-col animate-in fade-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-8">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-foreground leading-none">SYSTEM STEEL</h4>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Engineering ERP Infrastructure</p>
                                    <p className="text-[7px] text-muted-foreground uppercase mt-2">Warehouse 4, Al Quoz, Dubai</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-black text-foreground tracking-tighter">PAYSLIP</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{payroll.month}</p>
                                </div>
                            </div>

                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-8 mb-8 text-[10px]">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-muted-foreground font-bold uppercase text-[7px] tracking-widest mb-0.5">Staff Name</p>
                                        <p className="font-black text-foreground uppercase">{selectedLine.employee?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-bold uppercase text-[7px] tracking-widest mb-0.5">Employee ID</p>
                                        <p className="font-bold text-foreground">{selectedLine.employee?.employee_id || 'SSE-001'}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-right">
                                    <div>
                                        <p className="text-muted-foreground font-bold uppercase text-[7px] tracking-widest mb-0.5">Designation</p>
                                        <p className="font-bold text-foreground uppercase">{selectedLine.employee?.role || 'Architect'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-bold uppercase text-[7px] tracking-widest mb-0.5">Bank Reference</p>
                                        <p className="font-bold text-foreground uppercase">WPS - AE042299</p>
                                    </div>
                                </div>
                            </div>

                            {/* Earnings & Deductions Matrix */}
                            <div className="flex-1 space-y-8">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-border pb-1.5">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Earnings</span>
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Amount</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground font-medium">Basic Salary</span>
                                                <span className="text-foreground font-bold">{Number(selectedLine.basic_pay || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground font-medium">Overtime</span>
                                                <span className="text-foreground font-bold">{Number(selectedLine.overtime_pay || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-border pb-1.5">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Deductions</span>
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Amount</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground font-medium">Tax / Adjust.</span>
                                                <span className="text-foreground font-bold">{Number(selectedLine.deductions || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay Box */}
                            <div className="mt-auto pt-8 border-t border-border">
                                <div className="flex justify-between items-center bg-foreground text-card-foreground p-6 rounded-md">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Net Payable Amount</p>
                                        <p className="text-2xl font-black tracking-tighter">AED {Number(selectedLine.net_pay || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <ShieldCheck className="h-8 w-8 text-primary opacity-50 ml-auto mb-1" />
                                        <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Verified Digital Record</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground uppercase text-xs font-bold tracking-widest italic">Select staff member to view payslip</div>
                    )}
                </div>
            </div>
        </div>
    );
}
