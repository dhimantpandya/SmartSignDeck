import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { useForm } from 'react-hook-form'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/custom/button'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ProfileUpdateRequest,
  profileFormSchema,
} from '@/validations/user.validation'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { genderOptions, languageOptions } from '@/data/options'
import { useMutation } from '@tanstack/react-query'
import { userService } from '@/api'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'

export function ProfileForm() {
  const { user, login } = useAuth()

  const defaultValues: Partial<ProfileUpdateRequest> = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    gender: user?.gender || undefined,
    dob: user?.dob ? new Date(user.dob) : undefined,
    language: user?.language || undefined,
  }

  const form = useForm<ProfileUpdateRequest>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultValues as any,
  })

  // Ensure form resets if user data loads late
  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        gender: user.gender || undefined,
        dob: user.dob ? new Date(user.dob) : undefined,
        language: user.language || undefined,
      } as any)
    }
  }, [user, form])

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: ProfileUpdateRequest) =>
      userService.updateProfile(data),
    onSuccess: (response) => {
      // Update local auth state with new user data
      if (response) {
        login(response as any)
      }
      toast({
        title: 'Profile updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: error?.message || 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })

  async function onSubmit(data: ProfileUpdateRequest) {
    mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form className='mt-2' onSubmit={form.handleSubmit(onSubmit)}>
        <div className='grid gap-2 '>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='first_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name*</FormLabel>
                  <FormControl {...field}>
                    <Input placeholder='Enter first name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='last_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name*</FormLabel>
                  <FormControl {...field}>
                    <Input placeholder='Enter last name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl {...field}>
                    <Input placeholder='Enter email' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='gender'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender*</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-row space-y-1'
                    >
                      {genderOptions.map((option) => (
                        <FormItem
                          key={option.value}
                          className='flex items-center space-x-3 space-y-0'
                        >
                          <FormControl>
                            <RadioGroupItem value={option.value} />
                          </FormControl>
                          <FormLabel className='font-normal'>
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dob'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Date of birth*</FormLabel>
                  <FormControl>
                    <Input
                      type='date'
                      className='w-full'
                      value={field.value ? dayjs(field.value).format('YYYY-MM-DD') : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          role='combobox'
                          className={cn(
                            'flex w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? languageOptions.find(
                              (language) => language.value === field.value
                            )?.label
                            : 'Select language'}
                          <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-[200px] p-0'>
                      <Command>
                        <CommandInput placeholder='Search language...' />
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {languageOptions.map((language) => (
                            <CommandItem
                              value={language.label}
                              key={language.value}
                              onSelect={() => {
                                form.setValue('language', language.value, {
                                  shouldValidate: true,
                                })
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  language.value === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {language.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type='submit'
            className='mr-auto mt-3  w-auto rounded-lg'
            loading={isPending}
          >
            Update Profile
          </Button>
        </div>
      </form>
    </Form>
  )
}
