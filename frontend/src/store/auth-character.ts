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
        imageUrl: 'https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&w=300',
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: 'girl-1',
        name: 'Sarah',
        type: 'girl',
        imageUrl: 'https://images.pexels.com/photos/1181682/pexels-photo-1181682.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/1181682/pexels-photo-1181682.jpeg?auto=compress&cs=tinysrgb&w=300',
        color: 'from-pink-500 to-rose-400'
    },
    {
        id: 'boy-2',
        name: 'Marcus',
        type: 'boy',
        imageUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
        color: 'from-orange-500 to-amber-400'
    },
    {
        id: 'girl-2',
        name: 'Emma',
        type: 'girl',
        imageUrl: 'https://images.pexels.com/photos/3777570/pexels-photo-3777570.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/3777570/pexels-photo-3777570.jpeg?auto=compress&cs=tinysrgb&w=300',
        color: 'from-purple-500 to-indigo-400'
    }
];

export const selectedCharacterAtom = atom<Character | null>(null);
