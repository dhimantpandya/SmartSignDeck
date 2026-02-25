import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { CHARACTERS, selectedCharacterAtom } from '@/store/auth-character'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

export function CharacterSelection() {
    const [, setSelectedCharacter] = useAtom(selectedCharacterAtom)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            <div className="relative z-10 w-full max-w-5xl px-8 text-center">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" as const }}
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-8 w-8" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
                        Choose Your Avatar
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Select a character to guide you through your journey.
                    </p>
                </motion.div>

                <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                    {CHARACTERS.map((character, index) => (
                        <motion.button
                            key={character.id}
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                delay: 0.2 + index * 0.1,
                                type: "spring" as const,
                                stiffness: 300,
                                damping: 20
                            }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCharacter(character)}
                            className="group relative aspect-[3/4] overflow-hidden rounded-3xl border-2 border-white/10 bg-white/5 shadow-2xl transition-colors hover:border-white/30"
                        >
                            <img
                                src={character.thumbnailUrl}
                                alt={character.name}
                                className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-110 group-hover:grayscale-0"
                            />

                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80"
                            )}></div>

                            <div className="absolute inset-x-0 bottom-0 p-6 text-left">
                                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white shadow-black drop-shadow-md">
                                    {character.name}
                                </h3>
                                <p className="text-sm font-medium uppercase tracking-widest text-white/70">
                                    {character.type}
                                </p>
                            </div>

                            {/* Hover overlay gradient */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-40 bg-gradient-to-br",
                                character.color
                            )}></div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
