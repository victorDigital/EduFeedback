<script lang="ts" module>
	import { z } from 'zod';
	export let formSchema = z.object({
		code: z
			.string()
			.min(6, {
				message: 'invalid code'
			})
			.max(6, {
				message: 'invalid code'
			})
			.regex(/^[a-zA-Z0-9]+$/, {
				message: 'Your join code must only contain numbers and letters.'
			})
	});
	export type FormSchema = typeof formSchema;
</script>

<script lang="ts">
	import SuperDebug, { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import * as Form from '$lib/components/ui/form/index.js';

	let { data }: { data: SuperValidated<Infer<FormSchema>> } = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		dataType: 'json',
		onUpdated: ({ form: f }) => {
			if (f.valid) {
				toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
			} else {
				toast.error('Please fix the errors in the form.');
			}
		}
	});

	const { form: formData, enhance, errors } = form;
	$formData.code = '';
</script>

<div class="mt-10 flex flex-col items-center justify-center gap-2 md:mt-0 md:min-h-screen">
	<form method="POST" class="w-[216px]" use:enhance>
		<Form.Field {form} name="code">
			<Form.Control>
				{#snippet children({ props }: { props: any })}
					<Form.Label>Join Code</Form.Label>
					<InputOTP.Root maxlength={6} {...props} inputmode="text" bind:value={$formData.code}>
						{#snippet children({ cells })}
							<InputOTP.Group>
								{#each cells as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
				{/snippet}
			</Form.Control>
			<Form.Description>Please enter the join code.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Button>Join</Form.Button>
	</form>
</div>
