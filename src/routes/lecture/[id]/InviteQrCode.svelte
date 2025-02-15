<script lang="ts">
	const { inviteCode, width }: { inviteCode: string; width: number } = $props();

	import QRCode from 'qrcode';

	let element: HTMLCanvasElement;

	const baseUrl = 'https://tracker.voe.dk/join/';

	$effect(() => {
		QRCode.toCanvas(
			element,
			baseUrl + inviteCode,
			{ errorCorrectionLevel: 'M', width: width || 256, margin: 0 },
			function (error) {
				if (error) console.error(error);
			}
		);
	});
</script>

<canvas bind:this={element} id="qr-code"></canvas>
