'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error, success } = await resetPassword(email);

            if (success) {
                setSubmitted(true);
                toast.success('Password reset email sent');
            } else {
                toast.error(error?.message || 'Failed to send reset email');
            }
        } catch (err: any) {
            toast.error(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                {submitted ? (
                    <CardContent className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-md text-green-800 text-sm">
                            If an account exists for <b>{email}</b>, you will receive password reset instructions shortly.
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">Return to login</Link>
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>
                            <Link
                                href="/login"
                                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
