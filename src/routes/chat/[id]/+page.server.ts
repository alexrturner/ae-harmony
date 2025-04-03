import { createMessageSchema } from '$lib/schemas';
import { validateData } from '$lib/utils';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

interface CustomError {
    status: number;
    message: string;
}

export const actions: Actions = {
    createMessage: async ({ request, locals }) => {
        const formData = await request.formData();
        
        // note to self : don't validate audioFile via Zod
        const { errors } = await validateData({
            chat: formData.get('chat'),
            sender: formData.get('sender'),
            created: formData.get('created')
        }, createMessageSchema);

        if (errors) {
            return fail(400, {
                errors: errors.fieldErrors
            });
        }

        try {
            const message = await locals.pb.collection('messages').create(formData);
            return { success: true, message };
        } catch (err) {
            const customError = err as CustomError;
            console.log('Error creating message:', customError.message);
            throw error(customError.status, customError.message);
        }
    }
}; 