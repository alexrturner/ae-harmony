// TypeScript/ SvelteKit: Cleaned up code for updating user profiles.

import { updateProfileSchema } from '$lib/schemas';
import { validateData } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { serialize } from 'object-to-formdata';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
    if (!locals.pb.authStore.isValid) {
        throw redirect(303, '/auth/login');
    }
};

export const actions: Actions = {
    updateProfile: async ({ request, locals }) => {
        try {
            const body = await request.formData();
            
            // Handle optional file fields
            if (body.has('avatar') && body.get('avatar') instanceof File && (body.get('avatar') as File).size === 0) {
                body.delete('avatar');
            }
            if (body.has('sound') && body.get('sound') instanceof File && (body.get('sound') as File).size === 0) {
                body.delete('sound');
            }

            const { formData, errors } = await validateData(body, updateProfileSchema);

            if (errors) {
                return fail(400, { data: formData, errors: errors.fieldErrors });
            }

            const { colour, sound } = await locals.pb.collection('users').update(locals.user?.id, serialize(formData));

            // Update local user state
            if (locals.user) {
                locals.user.colour = colour;
                locals.user.sound = sound;
            }

            return { success: true };
        } catch (err) {
            console.error('Error updating profile:', err);
            throw error(500, 'Failed to update profile.');
        }
    }
};
