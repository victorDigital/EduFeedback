<script lang="ts">
	import type { PageData } from './$types';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import InviteQrCode from './InviteQrCode.svelte';
	import { source } from 'sveltekit-sse';
	import NumberFlow from '@number-flow/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { invalidateAll } from '$app/navigation';
	import ScorePlot from './ScorePlot.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ScanQrCode from 'lucide-svelte/icons/scan-qr-code';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { cn } from '$lib/utils';
	import { dev } from '$app/environment';
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

	async function startLecture(minutesToEnd?: number) {
		const res = await fetch(`/api/lecture/${data.lecture.id}/start`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ duration: minutesToEnd ?? 0 })
		});
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

	async function abortEndLecture() {
		const res = await fetch(`/api/lecture/${data.lecture.id}/abort-end`);
		if (!res.ok) {
			console.error('Failed to abort the end of the lecture:', res.statusText);
			return;
		}
		console.log('Lecture end aborted successfully.');
		invalidateAll(); // Ensure the UI is updated after aborting the end of the lecture
	}

	let timeRemaining = $state('--:--:--');
	// Update every second
	const interval = setInterval(() => {
		if (data.lecture.endedAt) {
			const endTime = new Date(data.lecture.endedAt).getTime();
			const now = new Date().getTime();
			const diff = endTime - now;

			if (diff <= 0) {
				clearInterval(interval);
				invalidateAll();
				timeRemaining = '00:00:00';
			} else {
				const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((diff % (1000 * 60)) / 1000);
				timeRemaining = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
			}
		}
	}, 1000);
</script>

<div class="my-3 flex w-full justify-end">
	{#if data.lecture.status === 'not_started'}
		<Button
			variant="default"
			class="rounded-r-none"
			onclick={() => {
				startLecture();
			}}>Begin</Button
		>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(buttonVariants({ variant: 'default', size: 'icon' }), 'rounded-l-none')}
			>
				<ChevronDown />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>Select Duration</DropdownMenu.GroupHeading>
					<DropdownMenu.Separator />
					{#if dev}
						<DropdownMenu.Item
							onclick={() => {
								startLecture(1);
							}}>1 minute</DropdownMenu.Item
						>
					{/if}
					<DropdownMenu.Item
						onclick={() => {
							startLecture(30);
						}}>30 minutes</DropdownMenu.Item
					>
					<DropdownMenu.Item
						onclick={() => {
							startLecture(60);
						}}>1 hour</DropdownMenu.Item
					>
					<DropdownMenu.Item
						onclick={() => {
							startLecture(120);
						}}>2 hours</DropdownMenu.Item
					>
					<DropdownMenu.Item
						onclick={() => {
							startLecture(180);
						}}>3 hours</DropdownMenu.Item
					>
					<DropdownMenu.Item
						onclick={() => {
							startLecture(240);
						}}>4 hours</DropdownMenu.Item
					>
					<DropdownMenu.Item
						onclick={() => {
							startLecture();
						}}>Not specified</DropdownMenu.Item
					>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else if data.status === 'active'}
		<div class="flex w-full flex-row flex-wrap items-center justify-end gap-2">
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
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'default', size: 'icon' })}>
					<ScanQrCode />
				</Dialog.Trigger>
				<Dialog.Content class="w-fit">
					<Dialog.Header>
						<Dialog.Title>Scan QR Code</Dialog.Title>
					</Dialog.Header>
					<InviteQrCode {inviteCode} width={256} />
				</Dialog.Content>
			</Dialog.Root>
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

{#if data.status === 'active'}
	<div class="flex w-full justify-end gap-3">
		<Button variant="default" size="sm" href="/lecture/list">View All</Button>
		{#if data.lecture.endedAt}
			<Button
				variant="destructive"
				size="sm"
				onclick={() => {
					abortEndLecture();
				}}>Abort Auto End</Button
			>
			<Button variant="outline" size="sm"
				>Ending In <span class="font-mono">{timeRemaining}</span></Button
			>
		{:else}
			<Button
				variant="destructive"
				size="sm"
				onclick={() => {
					endLecture();
				}}>End Lecture</Button
			>
		{/if}
	</div>
	<div class="mx-auto mt-3 flex flex-col">
		<ScorePlot {data} />
	</div>
{/if}

{#if data.status === 'done'}
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
