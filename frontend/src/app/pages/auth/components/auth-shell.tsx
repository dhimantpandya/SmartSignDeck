import { motion, AnimatePresence } from 'framer-motion'
import { useAtom } from 'jotai'
import { selectedCharacterAtom } from '@/store/auth-character'
import { CharacterSelection } from './character-selection'
import { VismeAuthForm } from './visme-auth-form'

interface AuthShellProps {
    // Children and other props are kept for backward compatibility
    // but the Visme form replaces the visual entirely
    children?: React.ReactNode
    title?: string
    subtitle?: string
    isPureForm?: boolean
}

export function AuthShell({ isPureForm }: AuthShellProps) {
    const [selectedCharacter] = useAtom(selectedCharacterAtom)

    // For pure forms (OTP, Forgot Password), render a simple centered card
    if (isPureForm) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/30 shadow-2xl backdrop-blur-3xl p-10"
            >
            </motion.div>
        )
    }

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center">
            {/* Step 1: Character Selection Overlay */}
            <AnimatePresence>
                {!selectedCharacter && (
                    <motion.div
                        key="character-selection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-50 flex items-center justify-center"
                    >
                        <CharacterSelection />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step 2: Visme Animated Form (sign-in / sign-up handled inside Visme) */}
            <AnimatePresence>
                {selectedCharacter && (
                    <motion.div
                        key="visme-form"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring' as const, stiffness: 250, damping: 22 }}
                        className="w-full min-h-screen"
                    >
                        <VismeAuthForm />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
