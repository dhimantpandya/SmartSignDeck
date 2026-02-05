import { User } from '@/models/user.model';

/**
 * Maps a user object from the API response to the standardized frontend User model.
 * Handles type conversions and default values.
 * 
 * @param apiUser - The raw user data from the backend API
 * @returns Standardized User object
 */
export const mapApiUserToUser = (apiUser: any): User => {
    return {
        id: apiUser.id?.toString() || apiUser._id?.toString() || '',
        email: apiUser.email || '',
        first_name: apiUser.first_name || '',
        last_name: apiUser.last_name || '',
        role: (apiUser.role as User['role']) ?? 'user',
        is_email_verified: apiUser.is_email_verified ?? false,
        onboardingCompleted: apiUser.onboardingCompleted ?? false,
        companyId: apiUser.companyId?._id || apiUser.companyId?.id || apiUser.companyId || undefined,
        companyName: apiUser.companyName || apiUser.companyId?.name || undefined,
        avatar: apiUser.avatar,
        gender: apiUser.gender,
        dob: apiUser.dob,
        language: apiUser.language,
    };
};
