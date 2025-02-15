<script lang="ts">
	import HostView from './HostView.svelte';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import type { PageData } from './$types';
	import SubmitterView from './SubmitterView.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto mt-10">
	<main>
		<h1
			class="line-clamp-1 scroll-m-20 break-words text-4xl font-extrabold tracking-tight lg:text-5xl"
		>
			{data.lecture.eventTitle}
		</h1>
		<Separator />
		{#if data.isHost}
			<HostView {data} />
			<!-- content here -->
		{:else}
			<SubmitterView {data} />
			<!-- else content here -->
		{/if}
	</main>
</div>
