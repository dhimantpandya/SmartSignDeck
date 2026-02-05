import { FC, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/custom/button'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Roles,
  UserAddOrUpdateRequest,
  userSchema,
} from '@/validations/user.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/components/ui/use-toast'
import { userService, adminRequestService } from '@/api'
import { User } from '@/models/user.model'
import { roleOptions } from '@/data/options'

interface UserFormProps {
  isOpen: boolean
  handleClose: (hasChanges?: boolean) => void
  initialData?: User
}

export const UserForm: FC<UserFormProps> = ({
  isOpen,
  handleClose,
  initialData,
}) => {
  const defaultValues: Partial<UserAddOrUpdateRequest> = {
    email: '',
    first_name: '',
    last_name: '',
    role: Roles.USER,
  }

  const form = useForm<UserAddOrUpdateRequest>({
    resolver: zodResolver(userSchema),
    defaultValues: defaultValues as any,
  })

  const mutation = useMutation({
    mutationFn: (data: UserAddOrUpdateRequest) => {
      if (initialData) {
        const userId = initialData.id || (initialData as any)._id;
        console.log('[DEBUG] Updating user with ID:', userId, 'Data:', data);
        if (!userId) {
          console.error('[ERROR] User ID is undefined!', initialData);
        }
        return userService.updateUser(userId, data);
      }
      return userService.addUser(data);
    },
    onSuccess: (response) => {
      toast({
        title: response.message,
      })
      resetForm()
      handleClose(true)
    },
    onError: (error: any) => {
      console.error('User update error:', error);
      toast({
        title: 'Something went wrong!',
        description: error?.response?.data?.message || error?.message || 'Failed to update user',
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        email: initialData.email,
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        role: initialData.role,
      } as any)
    }
  }, [form, initialData])

  const { user: currentUser } = useAuth()

  const { mutate: requestAction } = useMutation({
    mutationFn: (data: { targetUserId: string, type: 'DELETE' | 'ROLE_UPDATE', details?: any }) =>
      adminRequestService.createRequest(data),
    onSuccess: (response) => {
      toast({
        title: response.message || 'Request submitted successfully',
        description: 'Super Admin will review your role update request.',
      })
      handleClose(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit request',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      })
    }
  })

  const onSubmit = (data: UserAddOrUpdateRequest) => {
    // When editing, if admin, send request
    if (initialData && currentUser?.role === 'admin') {
      if (initialData.role !== data.role) {
        const targetUserId = initialData.id || (initialData as any)._id
        if (!targetUserId) {
          toast({ title: 'Error', description: 'User ID not found', variant: 'destructive' })
          return
        }
        requestAction({
          targetUserId,
          type: 'ROLE_UPDATE',
          details: { proposedRole: data.role }
        })
      } else {
        toast({ title: 'No changes detected' })
        handleClose(false)
      }
      return
    }

    // When editing (Super Admin), only send the role field
    const payload = initialData
      ? { role: data.role }
      : data;

    mutation.mutate(payload as UserAddOrUpdateRequest);
  }

  const resetForm = () => form.reset(defaultValues)

  const handleOnOpenChange = () => {
    resetForm()
    handleClose()
  }

  return (
    <Dialog modal open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent
        aria-describedby='user-form-description'
        onInteractOutside={(event) => event.preventDefault()}
        className='w-80 rounded-xl px-4 sm:w-full sm:max-w-xl md:max-w-xl md:px-12'
      >
        <DialogHeader className='mt-2 space-y-4'>
          <DialogTitle className='text-gunmetal text-center text-2xl'>
            {initialData ? 'Edit User' : 'Add User'}
          </DialogTitle>
        </DialogHeader>
        <div className='mt-4'>
          <p id='user-form-description' className='sr-only'>
            {initialData
              ? 'Form to edit user details.'
              : 'Form to add a new user.'}
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='grid gap-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='first_name'
                    render={({ field }) => (
                      <FormItem className='space-y-1'>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='John'
                            {...field}
                            disabled={!!initialData}
                            readOnly={!!initialData}
                            className={initialData ? 'bg-muted cursor-not-allowed' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='last_name'
                    render={({ field }) => (
                      <FormItem className='space-y-1'>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Doe'
                            {...field}
                            disabled={!!initialData}
                            readOnly={!!initialData}
                            className={initialData ? 'bg-muted cursor-not-allowed' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='email@example.com'
                          {...field}
                          disabled={!!initialData}
                          readOnly={!!initialData}
                          className={initialData ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {initialData?.companyName && (
                  <div className="space-y-1">
                    <FormLabel>Company</FormLabel>
                    <Input value={initialData.companyName} disabled readOnly className="bg-muted cursor-not-allowed" />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a role' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex items-center justify-end gap-6 py-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => handleClose()}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' loading={mutation.isPending}>
                    {initialData ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
