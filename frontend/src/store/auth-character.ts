import { atom } from 'jotai';

export interface Character {
    id: string;
    name: string;
    type: 'boy' | 'girl';
    imageUrl: string;
    thumbnailUrl: string;
    color: string;
}

export const CHARACTERS: Character[] = [
    {
        id: 'boy-1',
        name: 'Alex',
        type: 'boy',
        imageUrl: '/images/characters/boy-1.jpg',
        thumbnailUrl: '/images/characters/boy-1.jpg',
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: 'girl-1',
        name: 'Sarah',
        type: 'girl',
        imageUrl: '/images/characters/girl-1.jpg',
        thumbnailUrl: '/images/characters/girl-1.jpg',
        color: 'from-pink-500 to-rose-400'
    },
    {
        id: 'boy-2',
        name: 'Marcus',
        type: 'boy',
        imageUrl: '/images/characters/boy-2.jpg',
        thumbnailUrl: '/images/characters/boy-2.jpg',
        color: 'from-orange-500 to-amber-400'
    },
    {
        id: 'girl-2',
        name: 'Emma',
        type: 'girl',
        imageUrl: '/images/characters/girl-2.jpg',
        thumbnailUrl: '/images/characters/girl-2.jpg',
        color: 'from-purple-500 to-indigo-400'
    }
];

export const selectedCharacterAtom = atom<Character | null>(null);
