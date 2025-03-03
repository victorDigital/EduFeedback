<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let blockSubmission = $state(false);

	let message = $state('');

	let timestampText = $state('');

	async function handleSubmit(event: Event) {
		blockSubmission = true;
		try {
			event.preventDefault();
			const res = await fetch(`/api/lecture/${data.lecture.id}/annotate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text: timestampText })
			});
			if (!res.ok) {
				console.error('Failed to submit annotation:', res.statusText);
				return;
			}
			message = 'Timestamp submitted successfully.';
			await new Promise((resolve) => setTimeout(resolve, 3000));
			timestampText = '';
			message = '';
			blockSubmission = false;
			console.log('Timestamp submitted successfully.');
		} catch (error) {
			message = 'Failed to submit Timestamp.';
			await new Promise((resolve) => setTimeout(resolve, 3000));
			message = '';
			blockSubmission = false;
			console.error('Failed to submit annotation:', error);
		} finally {
			blockSubmission = false;
		}
	}
</script>

<form method="post" onsubmit={handleSubmit}>
	<div class="flex max-w-xl flex-row flex-wrap items-end gap-2">
		<div>
			<Label for="text" class="mb-1">Timestamp</Label>
			<Input
				disabled={blockSubmission}
				placeholder="Timestamp text"
				type="text"
				name="text"
				bind:value={timestampText}
			/>
		</div>
		<div>
			<button
				disabled={blockSubmission}
				type="submit"
				class={buttonVariants({ variant: 'default' })}>Submit</button
			>
		</div>
	</div>
	<p>{message}</p>
</form>
