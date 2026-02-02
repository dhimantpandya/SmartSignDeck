import { FC } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { Regex } from '@/utilities/regex'

interface PasswordIndicatorProps {
  value: string
}

export const PasswordIndicator: FC<PasswordIndicatorProps> = ({ value }) => {
  const { UPPERCASE, LOWERCASE, NUMBER, SPECIAL_CHAR } = Regex
  const MIN_CHARACTER = 8
  const password = value ?? ''

  const calculatePasswordStrength = (password: string) => {
    let strength = 0

    if (password.length >= MIN_CHARACTER) strength += 1
    if (UPPERCASE.test(password)) strength += 1
    if (LOWERCASE.test(password)) strength += 1
    if (NUMBER.test(password)) strength += 1
    if (SPECIAL_CHAR.test(password)) strength += 1

    return strength
  }

  const strength = calculatePasswordStrength(password)

  const requirements = [
    {
      text: `At least ${MIN_CHARACTER} characters long`,
      check: password.length >= MIN_CHARACTER,
    },
    {
      text: 'Includes at least 1 uppercase letter',
      check: UPPERCASE.test(password),
    },
    {
      text: 'Includes at least 1 lowercase letter',
      check: LOWERCASE.test(password),
    },
    {
      text: 'Includes at least 1 number',
      check: NUMBER.test(password),
    },
    {
      text: 'Includes at least 1 special character',
      check: SPECIAL_CHAR.test(password),
    },
  ]

  const getStrengthLabel = (strength: number) => {
    if (strength < 2) return 'Weak password'
    if (strength === 2) return 'Fair password'
    return 'Strong password'
  }

  return (
    <div className='space-y-2'>
      <div className='hidden text-sm font-semibold text-gray-700 md:block'>
        {getStrengthLabel(strength)}
      </div>
      <div className=' mt-1  items-center gap-2'>
        <div className='flex max-w-[380px] flex-grow items-center space-x-1'>
          {Array.from({ length: 5 }, (_, index) => {
            const color =
              index < strength
                ? strength <= 2
                  ? index < 2
                    ? 'bg-[#ff1744]' // Red for weak
                    : 'bg-[#ff6d00]' // Orange for fair
                  : strength === 3
                    ? 'bg-[#ffc400]' // Yellow for medium
                    : 'bg-[#097837]' // Green for strong
                : 'bg-gray-300' // Gray for inactive
            return (
              <div
                key={index}
                className={`h-1 w-full rounded-full ${color}`}
                aria-label={`Password strength level ${index + 1}`}
              />
            )
          })}
        </div>
      </div>

      <ul className='hidden list-disc space-y-2 pl-2 text-gray-700 md:block'>
        {requirements.map((req, index) => (
          <li key={index} className='flex items-center space-x-2'>
            {req.check ? (
              <IconCheck size={16} className='text-green-500' />
            ) : (
              <IconX size={16} className='text-red-500' />
            )}
            <span className='text-sm text-gray-500 '>{req.text}</span>
          </li>
        ))}
      </ul>
      <span className='block text-sm text-gray-500 md:hidden'>
        Password must contain at least 1 uppercase , 1 lowercase , 1 number, and
        1 special character
      </span>
    </div>
  )
}
