import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/custom/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { companyService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/ui/use-toast';

const createCompanySchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
});

type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

interface CreateCompanyModalProps {
    isOpen: boolean;
}

export function CreateCompanyModal({ isOpen }: CreateCompanyModalProps) {
    const [isVisible, setIsVisible] = useState(isOpen);
    const { login, user, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateCompanyFormValues>({
        resolver: zodResolver(createCompanySchema),
        defaultValues: {
            name: '',
        },
    });

    const onSubmit = async (data: CreateCompanyFormValues) => {
        setIsLoading(true);
        try {
            const response = await companyService.createCompany(data);
            toast({ title: 'Workspace created successfully!' });

            if (user) {
                // Manually update local user state for immediate UI response
                const updatedUser = {
                    ...user,
                    companyId: (response as any).id,
                    companyName: (response as any).name,
                    onboardingCompleted: true
                };
                login(updatedUser as any);
                await refreshUser();
            } else if (response && (response as any).id) {
                // Fallback for edge cases
                login({ companyId: (response as any).id, companyName: (response as any).name, onboardingCompleted: true } as any);
            }
            setIsVisible(false);
        } catch (error: any) {
            toast({
                title: 'Error creating workspace',
                description: error.message || 'Something went wrong',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <Dialog open={isVisible} onOpenChange={setIsVisible}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome to SmartSignDeck</DialogTitle>
                    <DialogDescription>
                        To get started, please create a workspace for your team.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Workspace Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="sm:justify-end">
                            <Button type="submit" loading={isLoading}>
                                Create Workspace
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
