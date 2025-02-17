<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { ArrowTopRight, Rocket, Pencil2 as Pencil, Mix } from 'svelte-radix';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import type { PageData } from './$types';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let { data }: { data: PageData } = $props();

	let createDialogOpen = $state(false);
	const isDesktop = new MediaQuery('(min-width: 768px)');

	let sessionName = $state('');
	let createError = $state('');

	async function handleCreateSession() {
		if (!sessionName) {
			createError = 'Session name is required.';
		} else if (sessionName.length < 3) {
			createError = 'Session name must be at least 3 characters.';
		} else if (sessionName.length > 50) {
			createError = 'Session name must be at most 50 characters.';
		} else {
			createError = '';
			createDialogOpen = false;
			const res = await fetch('/api/lecture/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: sessionName })
			});
			if (res.ok) {
				const { id } = await res.json();
				window.location.href = `/lecture/${id}`;
			} else {
				createError = 'Failed to create session.';
			}
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-2 *:w-full *:max-w-xs">
	<Button variant="default" href="/join"><Rocket /> Join</Button>
	<Button variant="outline" onclick={() => (createDialogOpen = true)}><Pencil /> Create</Button>
	<Separator />
	<p class="text-xs text-muted-foreground">
		No account required. Created by
		<a href="https://voe.dk" class="hover:underline"
			>Victor Østergaard <ArrowTopRight class="inline size-[1em]" /></a
		>
	</p>
	{#if data.lectures.count > 0}
		<Separator />
		<Button variant="secondary" href="/lecture/list">
			<Mix />
			View Created Lectures
			<Badge variant="outline">{data.lectures.count}</Badge>
		</Button>
	{/if}
</div>

{#if isDesktop.current}
	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Create Session</Dialog.Title>
				<Dialog.Description>
					Create a new session to get realtime feedback on your presentation.
				</Dialog.Description>
			</Dialog.Header>
			<div>
				<Label for="session-name" class="mt-4">Session name</Label>
				<Input id="session-name" bind:value={sessionName} placeholder="Session name" class="mt-1" />
				{#if createError}
					<p class="mt-1 text-xs text-red-500">{createError}</p>
				{/if}
			</div>
			<Dialog.Footer class="pt-2">
				<Button class="mt-4" onclick={handleCreateSession}>Create</Button>
				<Button variant="outline" class="mt-4" onclick={() => (createDialogOpen = false)}>
					Cancel
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open={createDialogOpen}>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>Create Session</Drawer.Title>
				<Drawer.Description>
					Create a new session to get realtime feedback on your presentation.
				</Drawer.Description>
			</Drawer.Header>
			<div class="m-4">
				<Label for="session-name">Session name</Label>
				<Input type="text" placeholder="Session name" bind:value={sessionName} />
				{#if createError}
					<p class="mt-1 text-xs text-red-500">{createError}</p>
				{/if}
			</div>
			<Drawer.Footer class="pt-2">
				<Button class="mt-4" onclick={handleCreateSession}>Create</Button>
				<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
