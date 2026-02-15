'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, RefreshCw, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getUnreconciledTransactions, reconcileTransaction } from '@/lib/api';

interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    type: 'income' | 'expense' | 'transfer';
}

export function ReconciliationContent() {
    const [bankTransactions, setBankTransactions] = useState<Transaction[]>([]);
    const [systemTransactions, setSystemTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedBankTx, setSelectedBankTx] = useState<string | null>(null);
    const [selectedSystemTx, setSelectedSystemTx] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getUnreconciledTransactions();
            setBankTransactions(data.bankTransactions || []);
            setSystemTransactions(data.systemTransactions || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load reconciliation data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleMatch = async () => {
        if (!selectedBankTx || !selectedSystemTx) return;

        try {
            await reconcileTransaction(selectedBankTx, selectedSystemTx);
            toast.success('Transactions Matched');
            setSelectedBankTx(null);
            setSelectedSystemTx(null);
            fetchData();
        } catch (error) {
            toast.error('Error matching transactions');
        }
    };

    return (
        <div className="space-y-6 h-full">
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
                {/* Bank Side */}
                <Card className="flex-1 flex flex-col rounded-[2rem] border-none shadow-sm bg-slate-50/50">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center justify-between">
                            <span>Bank Statement</span>
                            <Badge variant="outline" className="rounded-full bg-white">{bankTransactions.length} Unmatched</Badge>
                        </CardTitle>
                        <CardDescription>Transactions from your bank feed</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 pt-0 min-h-0">
                        <ScrollArea className="h-full pr-4">
                            {bankTransactions.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Check className="h-12 w-12 mx-auto mb-3 text-emerald-200" />
                                    <p>All cleared!</p>
                                </div>
                            ) : (
                                bankTransactions.map(tx => (
                                    <TransactionCard
                                        key={tx.id}
                                        tx={tx}
                                        isSelected={selectedBankTx === tx.id}
                                        onSelect={() => setSelectedBankTx(selectedBankTx === tx.id ? null : tx.id)}
                                        side="left"
                                    />
                                ))
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Match Action Area */}
                <div className="flex md:flex-col items-center justify-center gap-4 py-4 md:py-0">
                    <Button
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-lg transition-all",
                            selectedBankTx && selectedSystemTx ? "bg-blue-600 hover:bg-blue-700 scale-110 animate-pulse" : "bg-slate-200 cursor-not-allowed text-slate-400"
                        )}
                        disabled={!selectedBankTx || !selectedSystemTx}
                        onClick={handleMatch}
                    >
                        <ArrowRightLeft className="h-6 w-6" />
                    </Button>
                    {selectedBankTx && selectedSystemTx && (
                        <div className="text-xs font-bold text-blue-600 text-center animate-in fade-in zoom-in">
                            Ready to Match
                        </div>
                    )}
                </div>

                {/* System Side */}
                <Card className="flex-1 flex flex-col rounded-[2rem] border-none shadow-sm bg-slate-50/50">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center justify-center justify-between">
                            <span>System Ledger</span>
                            <Badge variant="outline" className="rounded-full bg-white">{systemTransactions.length} Unmatched</Badge>
                        </CardTitle>
                        <CardDescription>Invoices and payments in ERP</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 pt-0 min-h-0">
                        <ScrollArea className="h-full pr-4">
                            {systemTransactions.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Check className="h-12 w-12 mx-auto mb-3 text-emerald-200" />
                                    <p>All cleared!</p>
                                </div>
                            ) : (
                                systemTransactions.map(tx => (
                                    <TransactionCard
                                        key={tx.id}
                                        tx={tx}
                                        isSelected={selectedSystemTx === tx.id}
                                        onSelect={() => setSelectedSystemTx(selectedSystemTx === tx.id ? null : tx.id)}
                                        side="right"
                                    />
                                ))
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const TransactionCard = ({ tx, isSelected, onSelect, side }: { tx: Transaction, isSelected: boolean, onSelect: () => void, side: 'left' | 'right' }) => (
    <div
        onClick={onSelect}
        className={cn(
            "p-4 rounded-xl border-2 transition-all cursor-pointer mb-3 hover:shadow-md",
            isSelected
                ? "border-blue-500 bg-blue-50/50 shadow-blue-100"
                : "border-slate-100 bg-white hover:border-slate-200"
        )}
    >
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">{format(new Date(tx.date), 'MMM dd')}</span>
            <Badge variant={tx.amount > 0 ? "default" : "secondary"} className={cn("rounded-full h-5 text-[10px]", tx.amount > 0 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600")}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
            </Badge>
        </div>
        <p className="font-medium text-sm text-slate-900 line-clamp-2">{tx.description}</p>
    </div>
);
