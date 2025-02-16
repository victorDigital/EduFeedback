<script lang="ts">
	import { source } from 'sveltekit-sse';
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	let { data }: { data: PageData } = $props();
	import {
		VisXYContainer,
		VisLine,
		VisAxis,
		VisScatter,
		VisStackedBar,
		VisAnnotations
	} from '@unovis/svelte';
	import type { Score } from '$lib/server/db/schema';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { AnnotationItem } from '@unovis/ts';
	import NumberFlow from '@number-flow/svelte';
	import Annotator from './Annotator.svelte';
	import { cn } from '$lib/utils';

	const connection = source(`/api/realtime/${data.lecture.id}/host`);
	const scores = connection.select('scores');
	const annotations = connection.select('annotations');

	type DataRecord = { time: number; value: number };
	const plotData: DataRecord[] = $derived(format($scores));
	const lineData: DataRecord[] = $derived(calculateRollingAverage(plotData, 5));
	const middleLine: DataRecord[] = $derived(plotData.map((d) => ({ time: d.time, value: 0 })));
	const histogramData: DataRecord[] = $derived(calculateHistogram(plotData));
	const histogramDataLast5min: DataRecord[] = $derived(
		calculateHistogram(
			plotData.filter((d) => {
				const currentTime = plotData.length ? plotData[plotData.length - 1].time : 0;
				return d.time > currentTime - 5;
			})
		)
	);

	// @ts-ignore
	const annotationData: AnnotationItem[] = $derived(formatAnnotations($annotations, plotData));

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

	function formatAnnotations(annotations: string, scores: DataRecord[]) {
		if (annotations === '') return [];
		const json: { at: number; submitterId: string; text: string }[] = JSON.parse(annotations);

		const times = scores.map((d) => d.time);
		const minTime = Math.min(...times);
		const maxTime = Math.max(...times);
		const range = maxTime - minTime;

		const res = json.map((annotation) => {
			const annotationTime =
				(Number(annotation.at) - (data.lecture.startedAt ? data.lecture.startedAt.getTime() : 0)) /
				60000;
			const percentage =
				range === 0
					? '50%'
					: Math.floor(((annotationTime - minTime) / range) * 100).toString() + '%';
			return {
				x: percentage,
				y: '80%',
				content: annotation.text,
				subject: {
					x: percentage,
					y: '50%'
				},
				verticalAlign: 'top',
				cursor: 'pointer',
				separator: ' ',
				textAlign: 'center'
			};
		});

		console.log(res);
		return res;
	}

	function format(scores: string) {
		if (!data.lecture.startedAt) return [];
		if (scores === '') return [];
		const json: Score[] = JSON.parse(scores);
		return json.map((score) => ({
			time:
				(Number(score.at) - (data.lecture.startedAt ? data.lecture.startedAt.getTime() : 0)) /
				60000,
			value: score.value
		}));
	}

	function calculateHistogram(data: DataRecord[]): DataRecord[] {
		const histogram: DataRecord[] = [];
		for (let i = -2; i <= 2; i++) {
			const count = data.filter((d) => d.value === i).length;
			histogram.push({ time: i, value: count });
		}
		return histogram;
	}

	function downloadData() {
		const data = JSON.stringify(plotData);
		const blob = new Blob([data], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'scores.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function splitByUser(scores: string) {
		if (!scores) return []; // Added return statement to exit if scores are not provided
		const json: Score[] = JSON.parse(scores);
		const userScores: { [userId: string]: DataRecord[] } = {};

		json.forEach((score) => {
			const userId = score.submitterId;
			if (!userScores[userId]) {
				userScores[userId] = [];
			}
			userScores[userId].push({
				time:
					(Number(score.at) - (data.lecture.startedAt ? data.lecture.startedAt.getTime() : 0)) /
					60000,
				value: score.value
			});
		});

		return Object.keys(userScores).map((userId) => ({ userId, data: userScores[userId] }));
	}

	function colorFromUserId(userId: string) {
		const colors = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa'];
		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash = userId.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash % colors.length);
		return colors[index];
	}
</script>

{#if data.lecture.status === 'done'}
	<Button
		class="mb-3 w-fit"
		onclick={() => {
			downloadData();
		}}>Download</Button
	>
{/if}

<div class="mb-40 flex flex-col gap-4">
	{#if data.lecture.status !== 'done'}
		<div class="flex w-full flex-col gap-4 *:w-full md:flex-row">
			<Card.Root>
				<Card.Header>
					<Card.Title>Latest avg.</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="number-flow">
						<NumberFlow
							value={lineData.length ? lineData[lineData.length - 1].value : 0}
							format={{
								maximumSignificantDigits: 1,
								minimumSignificantDigits: 1,
								signDisplay: 'always'
							}}
							class={cn(
								'~text-lg/2xl transition-colors duration-300',
								(lineData.length ? lineData[lineData.length - 1].value : 0) >= -0.5 &&
									(lineData.length ? lineData[lineData.length - 1].value : 0) <= 0.5
									? 'text-emerald-500'
									: 'text-red-500'
							)}
						></NumberFlow>
					</div>
					{#if (lineData.length ? lineData[lineData.length - 1].value : 0) <= -0.5}
						<p>Speed Up!</p>
					{:else if (lineData.length ? lineData[lineData.length - 1].value : 0) >= 0.5}
						<p>Slow Down!</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Create Timestamp</Card.Title>
				</Card.Header>
				<Card.Content>
					<Annotator {data} />
				</Card.Content>
			</Card.Root>
		</div>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>5min avg.</Card.Title>
			<Card.Description>
				Shows the 5 minute rolling average of the sentiment scores. And any timestamps made during
				the lecture.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#key $scores}
				{#key $annotations}
					<VisXYContainer duration={0}>
						<VisScatter
							data={plotData}
							x={(d) => d.time}
							y={(d) => d.value}
							color={(d: DataRecord) =>
								d.value > 0 ? '#f87171' : d.value < 0 ? '#60a5fa' : '#4ade80'}
							size={5}
						/>
						<VisAxis type="x" label="Minutes since start" />
						<VisAxis type="y" />
						<VisLine data={lineData} x={(d) => d.time} y={(d) => d.value} lineWidth={5} />
						<VisLine
							data={middleLine}
							x={(d) => d.time}
							y={(d) => d.value}
							lineWidth={2}
							color="gray"
						/>
						<VisAnnotations items={annotationData} />
					</VisXYContainer>
				{/key}
			{/key}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Breakdown By submitter</Card.Title>
			<Card.Description>Shows the scores submitted by each user over time.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#key $scores}
				<VisXYContainer duration={0}>
					<VisAxis type="x" label="Minutes since start" />
					<VisAxis type="y" />
					<VisLine data={lineData} x={(d) => d.time} y={(d) => d.value} lineWidth={5} />
					<VisLine
						data={middleLine}
						x={(d) => d.time}
						y={(d) => d.value}
						lineWidth={2}
						color="gray"
					/>
					{#each splitByUser($scores) as userData}
						<VisLine
							data={userData.data}
							x={(d) => d.time}
							y={(d) => d.value}
							color={colorFromUserId(userData.userId)}
							lineWidth={2}
						/>
					{/each}
				</VisXYContainer>
			{/key}
		</Card.Content>
	</Card.Root>

	<div class="flex w-full flex-col gap-4 *:w-full md:flex-row">
		<Card.Root>
			<Card.Header>
				<Card.Title>Histogram</Card.Title>
				<Card.Description
					>Shows the sentiment score distribution for the entire lecture.</Card.Description
				>
			</Card.Header>
			<Card.Content>
				{#key $scores}
					<VisXYContainer duration={0} height={200}>
						<VisStackedBar
							data={histogramData}
							x={(d) => d.time}
							y={(d) => d.value}
							color={(d: DataRecord) =>
								d.time > 0 ? '#f87171' : d.time < 0 ? '#60a5fa' : '#4ade80'}
							roundedCorners={10}
						/>
						<VisAxis type="x" label="Sentiment" numTicks={5} />
						<VisAxis type="y" />
					</VisXYContainer>
				{/key}
			</Card.Content>
		</Card.Root>

		{#if data.lecture.status !== 'done'}
			<Card.Root>
				<Card.Header>
					<Card.Title>Histogram of last 5min</Card.Title>
					<Card.Description
						>Shows the sentiment score distribution for the last 5 minutes.</Card.Description
					>
				</Card.Header>
				<Card.Content>
					{#key $scores}
						<VisXYContainer duration={0} height={200}>
							<VisStackedBar
								data={histogramDataLast5min}
								x={(d) => d.time}
								y={(d) => d.value}
								color={(d: DataRecord) =>
									d.time > 0 ? '#f87171' : d.time < 0 ? '#60a5fa' : '#4ade80'}
								roundedCorners={10}
							/>
							<VisAxis type="x" label="Sentiment" numTicks={5} />
							<VisAxis type="y" />
						</VisXYContainer>
					{/key}
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

<style>
	.number-flow {
		--number-flow-char-height: 0.85em;
		font-size: 4rem;
		font-weight: 500;
	}
</style>
