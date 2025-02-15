<script lang="ts">
	import type { PageData } from './$types';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import InviteQrCode from './InviteQrCode.svelte';
	import { source } from 'sveltekit-sse';
	import NumberFlow from '@number-flow/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { invalidateAll } from '$app/navigation';
	import ScorePlot from './ScorePlot.svelte';

	let { data }: { data: PageData } = $props();

	console.log(data.lecture);

	let inviteCode = $state('');

	$effect(() => {
		fetch('/api/lecture/generate-code', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ lectureId: data.lecture.id })
		})
			.then((response) => response.json())
			.then((data) => {
				inviteCode = data.code;
				console.log('Invite Code:', data.code);
			})
			.catch((error) => console.error('Error generating invite code:', error));
	});

	const value = source(`/api/realtime/${data.lecture.id}/participants`).select('message');

	async function startLecture() {
		const res = await fetch(`/api/lecture/${data.lecture.id}/start`);
		if (!res.ok) {
			console.error('Failed to start the lecture:', res.statusText);
			return;
		}
		console.log('Lecture started successfully.');
		invalidateAll(); // Ensure the UI is updated after starting the lecture
	}

	async function endLecture() {
		const res = await fetch(`/api/lecture/${data.lecture.id}/end`);
		if (!res.ok) {
			console.error('Failed to end the lecture:', res.statusText);
			return;
		}
		console.log('Lecture ended successfully.');
		invalidateAll(); // Ensure the UI is updated after ending the lecture
	}
</script>

<div class="my-3 flex w-full justify-end">
	{#if data.lecture.status === 'not_started'}
		<Button
			variant="default"
			size="lg"
			onclick={() => {
				startLecture();
			}}>Begin</Button
		>
	{:else if data.lecture.status === 'active'}
		<div class="flex w-full flex-row flex-wrap justify-end gap-2">
			<div class="flex flex-col items-end">
				<p class="text-sm">Join at tracker.voe.dk</p>
				<p class="mb-1 text-xs opacity-75">Lecture code:</p>
			</div>
			<InputOTP.Root maxlength={6} class="!opacity-100" disabled bind:value={inviteCode}>
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells as cell}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
		</div>
	{/if}
</div>
{#if data.lecture.status === 'not_started'}
	<div class="mt-10 flex flex-col items-center gap-2">
		<p class="text-xl font-bold">Join this lecture</p>
		<p class="text-center text-sm">Scan the QR code or enter the code below to join the lecture.</p>
	</div>
	<div class="mt-10 flex flex-row flex-wrap-reverse items-end justify-center gap-4">
		<div class="flex flex-col items-center gap-2">
			<div class="mb-2">
				{#if inviteCode}
					<InviteQrCode {inviteCode} width={256} />
				{:else}
					<Skeleton class="size-[256px]" />
				{/if}
			</div>
			<div class="flex flex-col items-center">
				<p class="text-sm">Join at tracker.voe.dk</p>
				<p class="mb-1 text-xs opacity-75">Lecture code:</p>
				<InputOTP.Root maxlength={6} class="!opacity-100" disabled bind:value={inviteCode}>
					{#snippet children({ cells })}
						<InputOTP.Group>
							{#each cells as cell}
								<InputOTP.Slot {cell} />
							{/each}
						</InputOTP.Group>
					{/snippet}
				</InputOTP.Root>
			</div>
		</div>
		<div class="flex flex-col items-start gap-0">
			<Badge>LIVE</Badge>
			<p>Participants:</p>
			{#if !isNaN(parseInt($value))}
				<div class="number-flow">
					<NumberFlow value={parseInt($value)} />
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if data.lecture.status === 'active'}
	<div class="flex w-full justify-end">
		<Button
			variant="default"
			size="sm"
			onclick={() => {
				endLecture();
			}}>End lecture</Button
		>
	</div>
	<div class="mx-auto mt-3 flex flex-col">
		<ScorePlot {data} />
	</div>
{/if}

{#if data.lecture.status === 'done'}
	<Button href="/">Go Home</Button>
	<div class="mx-auto mt-3 flex flex-col">
		<p class="text-lg font-semibold">The lecture has ended.</p>
		<ScorePlot {data} />
	</div>
{/if}

<style>
	.number-flow {
		--number-flow-char-height: 0.85em;
		font-size: 4rem;
		font-weight: 500;
	}
</style>
