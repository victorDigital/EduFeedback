<script lang="ts">
	import { source } from 'sveltekit-sse';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	import { VisXYContainer, VisLine, VisAxis, VisScatter, VisStackedBar } from '@unovis/svelte';
	import type { Score } from '$lib/server/db/schema';

	const connection = source(`/api/realtime/${data.lecture.id}/host`);
	const scores = connection.select('scores');
	console.log($scores === '');

	type DataRecord = { time: number; value: number };
	const plotData: DataRecord[] = $derived(format($scores));
	//lineData is a rolling 10 minute average of the scores ()
	const lineData: DataRecord[] = $derived(calculateRollingAverage(plotData, 30));

	function calculateRollingAverage(data: DataRecord[], minutes: number): DataRecord[] {
		const windowSize = minutes;
		const averages: DataRecord[] = [];

		for (let i = 0; i < data.length; i++) {
			const windowStart = data[i].time - windowSize;
			const windowEnd = data[i].time;
			const windowData = data.filter((d) => d.time >= windowStart && d.time <= windowEnd);
			const average = windowData.reduce((acc, d) => acc + d.value, 0) / windowData.length;
			averages.push({ time: data[i].time, value: average });
		}
		return averages;
	}

	const middleLine: DataRecord[] = $derived(plotData.map((d) => ({ time: d.time, value: 0 })));

	function format(scores: string) {
		if (!data.lecture.startedAt) return [];
		if (scores === '') return [];
		const json: Score[] = JSON.parse(scores);
		return json.map((score) => ({
			time: Math.floor(
				(Number(score.at) - (data.lecture.startedAt ? data.lecture.startedAt.getTime() : 0)) / 60000
			), //Converted to minutes
			value: score.value //Score value from -2 to 2
		}));
	}
	const histogramData: DataRecord[] = $derived(calculateHistogram(plotData));

	// calculateHistogram will tally the number of scores in each bin (sentiment value) so -2, -1, 0, 1, 2
	function calculateHistogram(data: DataRecord[]): DataRecord[] {
		const histogram: DataRecord[] = [];
		for (let i = -2; i <= 2; i++) {
			const count = data.filter((d) => d.value === i).length;
			histogram.push({ time: i, value: count });
		}
		return histogram;
	}
</script>

{#key $scores}
	<VisXYContainer duration={0}>
		<VisScatter
			data={plotData}
			x={(d) => d.time}
			y={(d) => d.value}
			color={(d: DataRecord) => (d.value > 0 ? '#f87171' : d.value < 0 ? '#60a5fa' : '#4ade80')}
			size={5}
		/>
		<VisAxis type="x" label="Minutes since start" />
		<VisAxis type="y" />
		<VisLine data={lineData} x={(d) => d.time} y={(d) => d.value} lineWidth={5} />
		<VisLine data={middleLine} x={(d) => d.time} y={(d) => d.value} lineWidth={2} color="black" />
	</VisXYContainer>
{/key}

{#key $scores}
	<VisXYContainer duration={0} width={300} height={200}>
		<VisStackedBar
			data={histogramData}
			x={(d) => d.time}
			y={(d) => d.value}
			color={(d: DataRecord) => (d.time > 0 ? '#f87171' : d.time < 0 ? '#60a5fa' : '#4ade80')}
			roundedCorners={10}
		/>
		<VisAxis type="x" label="Sentiment" numTicks={5} />
		<VisAxis type="y" />
	</VisXYContainer>
{/key}
