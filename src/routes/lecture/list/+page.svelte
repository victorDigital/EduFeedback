<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { ArrowTopRight, Trash } from 'svelte-radix';
	import type { PageData } from './$types';
	import { flip } from 'svelte/animate';
	import { invalidateAll } from '$app/navigation';
	import { computeStatus } from '$lib/utils';

	let { data }: { data: PageData } = $props();
	$inspect(data);

	const statusTranslator = (status: 'not_started' | 'active' | 'done') => {
		switch (status) {
			case 'not_started':
				return 'Not Started';
			case 'active':
				return 'Active';
			case 'done':
				return 'Done';
			default:
				return 'Unknown';
		}
	};

	async function deleteLecture(id: string) {
		const res = await fetch(`/api/lecture/${id}/delete`, { method: 'DELETE' });
		if (!res.ok) {
			console.error('Failed to delete lecture:', res.statusText);
			invalidateAll();
			return;
		}
		console.log('Lecture deleted successfully.');
		invalidateAll();
	}
</script>

<div class="container mx-auto mt-10">
	<main>
		<h1
			class="line-clamp-1 scroll-m-20 break-words text-4xl font-extrabold tracking-tight lg:text-5xl"
		>
			Your Lectures
		</h1>
		<Separator />
		<Button href="/" class="mt-4">
			<ArrowTopRight />
			Back
		</Button>
		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#if Array.isArray(data.lectures) && data.lectures.length > 0}
				{#each data.lectures as lecture (lecture.id)}
					<div animate:flip={{ duration: 300 }}>
						<Card.Root class={computeStatus(lecture) ? 'border-emerald-500' : 'border-border'}>
							<Card.Header>
								<Card.Title>{lecture.eventTitle}</Card.Title>
								<Card.Description
									>{lecture.scores?.length} Datapoints, {lecture.annotations?.length} Timestamps</Card.Description
								>
							</Card.Header>
							<Card.Content>
								<Badge>{statusTranslator(computeStatus(lecture))}</Badge>
								<Badge>{lecture.createdAt.toLocaleDateString()}</Badge>
							</Card.Content>
							<Card.Footer class="flex justify-end gap-2">
								<Button href={`/lecture/${lecture.id}`}>
									View
									<ArrowTopRight />
								</Button>
								<Button
									onclick={() => deleteLecture(lecture.id)}
									variant="destructive"
									disabled={computeStatus(lecture) == 'active'}
								>
									Delete
									<Trash />
								</Button>
							</Card.Footer>
						</Card.Root>
					</div>
				{/each}
			{:else}
				<p>You have no lectures.</p>
			{/if}
		</div>
	</main>
</div>
