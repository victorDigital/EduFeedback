import type { PageServerLoad, Actions } from './$types.js';
import { superValidate } from 'sveltekit-superforms';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './+page.svelte';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(formSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		console.log('Form:', form);
		if (!form.valid) {
			console.log('Form is invalid');
			return fail(400, {
				form
			});
		}
		console.log('Form is valid, redirecting with code:', form.data.code);
		return redirect(303, '/join/' + form.data.code);
	}
};
