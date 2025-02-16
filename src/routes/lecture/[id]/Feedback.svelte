<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import NumberFlow, { NumberFlowGroup } from '@number-flow/svelte';
	import type { PageData } from './$types';
	let {
		data,
		canSendFeedbackString,
		whenCanSendFeedbackString
	}: { data: PageData; canSendFeedbackString: string; whenCanSendFeedbackString: string } =
		$props();

	// canSendFeedbackString => "true" | "false"
	let canSendFeedback = $derived(canSendFeedbackString === 'true');

	let loadingInterval = $state(true);

	$effect(() => {
		if (canSendFeedback) {
			blockFeedback = false;
		}
	});

	let blockFeedback = $state(false);
	let timeLeft = $state(0);

	// Call resetInterval after feedback is submitted
	async function submitFeedback(sentiment: number) {
		if (!canSendFeedback || blockFeedback) {
			blockFeedback = true;
			console.error('Feedback cannot be submitted at this time.');
			await new Promise((resolve) => setTimeout(resolve, 3000));
			blockFeedback = false;
			return;
		}

		blockFeedback = true;

		const res = await fetch(`/api/lecture/${data.lecture.id}/feedback`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ sentiment })
		});
		if (!res.ok) {
			console.error('Failed to submit feedback:', res.statusText);
			blockFeedback = false;
			return;
		}
		console.log('Feedback submitted successfully.');

		// Simulate waiting for 1 second before allowing further feedback
		await new Promise((resolve) => setTimeout(resolve, 3000));

		blockFeedback = false;
	}
</script>

<div class="mt-10 flex w-full flex-row justify-center">
	<div class="flex w-fit flex-col items-center gap-2">
		<p class="w-full text-xl font-semibold">
			How is the pace of the lecture <span class="underline">right now</span>?
		</p>
		<Separator />
		<div class="flex w-full flex-row justify-between gap-2">
			<p>Too slow</p>
			<p>Just right</p>
			<p>Too fast</p>
		</div>
		<div class="relative flex w-full flex-row justify-between gap-2">
			<Button
				size="icon"
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				disabled={blockFeedback}
				onclick={() => {
					submitFeedback(-2);
				}}
				aria-label="Way too slow">😴</Button
			>
			<Button
				size="icon"
				disabled={blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(-1);
				}}
				aria-label="A bit too slow">🥱</Button
			>
			<Button
				size="icon"
				disabled={blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(0);
				}}
				aria-label="Just right">😊</Button
			>
			<Button
				size="icon"
				disabled={blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(1);
				}}
				aria-label="A bit too fast">😮</Button
			>
			<Button
				size="icon"
				disabled={blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(2);
				}}
				aria-label="Way too fast">🫨</Button
			>
			{#if blockFeedback}
				<div
					class="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black bg-opacity-50 text-background backdrop-blur"
				>
					<p>Thank you for your feedback!</p>
				</div>
			{/if}
		</div>
	</div>
</div>
