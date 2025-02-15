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
			clearInterval(interval);
		}
	});

	let blockFeedback = $state(false);
	let timeLeft = $state(0);
	let interval = setInterval(updateTimeLeft, 1000);

	function updateTimeLeft() {
		const feedbackAvailableAt = parseInt(whenCanSendFeedbackString);
		if (isNaN(feedbackAvailableAt)) {
			loadingInterval = true;
			return;
		}

		if (canSendFeedback) {
			clearInterval(interval);
			return;
		}

		timeLeft = Math.floor((feedbackAvailableAt - Date.now()) / 1000);
		console.log('Time left:', timeLeft);

		if (timeLeft < 0) {
			timeLeft = 0;
		}

		if (timeLeft === 0) {
			clearInterval(interval);
			blockFeedback = false;
			loadingInterval = true;
		} else {
			loadingInterval = false;
		}
		return timeLeft;
	}

	function resetInterval() {
		loadingInterval = true;
		clearInterval(interval);
		interval = setInterval(updateTimeLeft, 1000);
	}

	// Call resetInterval after feedback is submitted
	async function submitFeedback(sentiment: number) {
		if (!canSendFeedback) {
			console.error('Feedback cannot be submitted at this time.');
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

		setTimeout(() => {
			blockFeedback = false;
			resetInterval(); // Reactivate the interval
		}, 6000);
	}

	// Clear the interval on component destruction to prevent memory leaks
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		clearInterval(interval);
	});

	const mm = $derived(Math.floor((timeLeft % 3600) / 60));
	const ss = $derived(timeLeft % 60);
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
				disabled={!canSendFeedback || blockFeedback}
				onclick={() => {
					submitFeedback(-2);
				}}
				aria-label="Way too slow">😴</Button
			>
			<Button
				size="icon"
				disabled={!canSendFeedback || blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(-1);
				}}
				aria-label="A bit too slow">🥱</Button
			>
			<Button
				size="icon"
				disabled={!canSendFeedback || blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(0);
				}}
				aria-label="Just right">😊</Button
			>
			<Button
				size="icon"
				disabled={!canSendFeedback || blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(1);
				}}
				aria-label="A bit too fast">😮</Button
			>
			<Button
				size="icon"
				disabled={!canSendFeedback || blockFeedback}
				class="size-12 select-none text-2xl md:size-20 md:text-4xl"
				onclick={() => {
					submitFeedback(2);
				}}
				aria-label="Way too fast">🫨</Button
			>
			{#if blockFeedback || !canSendFeedback}
				<div
					class="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black bg-opacity-50 text-background backdrop-blur"
				>
					<p>Thank you for your feedback!</p>
					<p>
						Submit again in
						{#if !loadingInterval}
							<span class="inline">
								<NumberFlowGroup>
									<div
										style="--number-flow-char-height: 0.85em"
										class="number-flow inline-flex items-baseline"
									>
										<NumberFlow
											trend={-1}
											value={mm}
											digits={{ 1: { max: 5 } }}
											format={{ minimumIntegerDigits: 2 }}
										/>
										<NumberFlow
											prefix=":"
											trend={-1}
											value={ss}
											digits={{ 1: { max: 5 } }}
											format={{ minimumIntegerDigits: 2 }}
										/>
									</div></NumberFlowGroup
								>
							</span>
						{:else}
							<span class="inline">
								<!-- prettier-ignore -->
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="size-[1em] animate-spin inline"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
							</span>
						{/if}
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
