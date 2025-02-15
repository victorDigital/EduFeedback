<script lang="ts">
	import type { Readable } from 'svelte/store';
	import type { PageData } from './$types';
	import { source } from 'sveltekit-sse';
	import Feedback from './Feedback.svelte';
	import ScorePlot from './ScorePlot.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let { data }: { data: PageData } = $props();

	const connection = source(`/api/realtime/${data.lecture.id}/submitter`);

	const connected = connection.select('message');
	const status = connection.select('status') as Readable<'not_started' | 'active' | 'done'>;
	const canSendFeedback = connection.select('canSendFeedback');
	const whenCanSendFeedbackString = connection.select('whenCanSendFeedback');
</script>

<span class="sr-only">{$connected}</span>

{#if $status === 'not_started'}
	<!-- content here -->
	<p class="mt-10 text-center">Please wait for the host to start the lecture.</p>
{:else if $status === 'active'}
	<Feedback
		{data}
		canSendFeedbackString={$canSendFeedback}
		whenCanSendFeedbackString={$whenCanSendFeedbackString}
	/>
{:else if $status === 'done'}
	<Button href="/" class="my-3">Go Home</Button>
	<p>The lecture has concluded. Thank you for participating!</p>
	<div class="mx-auto mt-3 flex flex-col">
		<ScorePlot {data} />
	</div>
{/if}
