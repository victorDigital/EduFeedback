<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let timestampText = $state('');

	async function handleSubmit(event: Event) {
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
		console.log('Annotation submitted successfully.');
	}
</script>

<form method="post" onsubmit={handleSubmit}>
	<div class="flex max-w-xl flex-row flex-wrap items-end gap-2">
		<div>
			<Label for="text" class="mb-1">Timestamp</Label>
			<Input placeholder="Timestamp text" type="text" name="text" bind:value={timestampText} />
		</div>
		<div>
			<button type="submit" class={buttonVariants({ variant: 'default' })}>Submit</button>
		</div>
	</div>
</form>
