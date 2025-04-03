import { registerUserSchema } from '$lib/schemas';
import { validateData } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';

function getRandomColor() {
	const colors = [
		'#008080', // Teal
		'#008000', // Green
		'#FFA500', // Orange
		'#FF0000', // Red
		'#FF00FF', // Fuchsia
		'#ECC94B', // Yellow
		'#00FF00', // Lime
		'#0000FF', // Blue
		'#800000', // Maroon
		'#800080', // Purple
		'#000080', // Navy
		'#00FFFF'  // Aqua
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

export const actions = {
	register: async ({ locals, request }) => {
		const { formData, errors } = await validateData(await request.formData(), registerUserSchema);

		if (errors) {
			return fail(400, {
				data: formData,
				errors: errors.fieldErrors
			});
		}

		const emailHandle = formData.email.split('@')[0].toLowerCase();
		const randomDigits = Math.floor(1000 + Math.random() * 9000);
		const username = `${emailHandle}${randomDigits}`;

		// Set random color if not provided
		if (!formData.colour) {
			formData.colour = getRandomColor();
		}

		try {
			await locals.pb.collection('users').create({ username, ...formData });
			await locals.pb.collection('users').requestVerification(formData.email);
		} catch (err) {
			console.log('Error: ', err);
			throw error(500, 'Something went wrong');
		}

		throw redirect(303, '/auth/login');
	}
};