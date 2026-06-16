<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { toast } from 'svelte-sonner';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { TextareaAutosize } from 'runed';
	import { PUBLIC_API } from '$env/static/public';
	import Send from '@lucide/svelte/icons/send';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { onMount, tick } from 'svelte';
	import { marked } from 'marked';
	import { fade, fly, slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { building } from '$app/environment';

	let messages: {
		text?: string;
		response?: Promise<any>;
		issuer: string;
	}[] = $state([]);
	let qVal = $state('');

	let locked = $state(false);
	let origin = $derived(building ? '' : page.url.searchParams.get('url') || '');
	let initialized = $state(false);
	let customerName = $state('');

	onMount(async () => {
		const qEl = document.querySelector('textarea');
		if (qEl) {
			new TextareaAutosize({
				element: () => qEl,
				input: () => qVal
			});
		}
		console.log('Origin:', origin);
		try {
			// Attempt to fetch the API root to check if the server is reachable
			const res = await fetch(`${PUBLIC_API}/initialize-agent?origin=${origin}`, {
				credentials: 'include'
			});
			if (res.ok) {
				const data = await res.json();
				customerName = data?.customer_name || '';
				initialized = true;
				console.log(data);
			}
		} catch (error) {
			console.error(error);
		}
	});

	const submitFeedback = async (rating: number, comments: string) => {
		const response = await fetch(`${PUBLIC_API}/send-feedback`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				rating,
				comments,
				origin
			})
		});
		if (response.ok) {
			toast.success('Feedback erfolgreich gesendet.');
			feedbackMessages = feedbackMessages.map((msg, index) =>
				index === messages.length - 1 ? '' : msg
			);
		} else {
			toast.error('Fehler beim Senden des Feedbacks. Bitte versuchen Sie es später erneut.');
		}

		return response.ok;
	};

	let helpful: number[] = $state([]);
	let feedbackMessages: string[] = $state([]);

	const focus = (node: HTMLElement) => {
		node.scrollIntoView();
	};

	const submitMessage = async (e: Event) => {
		e.preventDefault();
		if (!qVal.trim()) return; // Ignore empty messages
		locked = true;
		messages = [
			...messages,
			{
				text: qVal,
				issuer: 'user'
			}
		];
		// Call the RAG agent API
		const response = fetch(`${PUBLIC_API}/invoke-agent`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ text: qVal, origin })
		});
		messages = [
			...messages,
			{
				response: new Promise((resolve) => {
					response.then((res) => {
						if (res.ok) {
							res.json().then((data) => {
								resolve(data);
							});
						} else {
							toast.error('Fehler beim Abrufen der Antwort. Bitte versuchen Sie es später erneut.');
							resolve({
								output: 'Es gab einen Fehler bei der Anfrage. Bitte versuchen Sie es später erneut.'
							});
						}
					});
				}),
				issuer: 'bot'
			}
		];
		qVal = '';
		locked = false;
	};
</script>

<AlertDialog.Root open>
	<AlertDialog.Content class="w-full! max-w-full! sm:max-w-2xl!">
		<AlertDialog.Header>
			<AlertDialog.Title>Nutzungsbedingungen und Haftungsausschluss</AlertDialog.Title>
			<AlertDialog.Description>
				Bitte lesen und akzeptieren Sie die folgenden Bedingungen, bevor Sie diese Anwendung nutzen:
			</AlertDialog.Description>
		</AlertDialog.Header>
		<ul class="max-h-60 list-disc space-y-2 overflow-y-auto pl-6">
			<li>
				Diese Anwendung dient als Unterstützung bei der Suche nach Informationen im Zusammenhang mit
				den Aktivitäten der Abteilung für Qualitätssicherung und -entwicklung der Universität Bern.
			</li>
			<li>Diese Anwendung richtet sich an die Angehörigen der Universität Bern.</li>
			<li>
				Der Chatbot ist für Informationen allgemeiner Art und nicht für persönliche oder
				vertrauliche Anfragen vorgesehen. In solchen Fällen wenden Sie sich bitte direkt an die
				entsprechende Abteilung.
			</li>
			<li>
				Der Chatbot basiert auf einem Dienst von Microsoft Azure OpenAI (vgl. auch <a
					href="https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy?tabs=azure-portal"
					target="_blank"
				>
					Data, privacy, and security for Azure OpenAI Service
				</a>). Bei der Nutzung des Chatbots werden folgende Angaben zwecks Qualitätssicherung und
				Weiterentwicklung/Verbesserung der Anwendung aufgezeichnet: anonyme User-ID; jeweilige
				Organisationseinheit der Universität (Benutzergruppe); Inhalt der Benutzeranfrage; Antwort
				des Chatbots, Feedback (Bewertungen und Kommentare) an den Chatbot.
			</li>
			<li>
				Durch die Nutzung dieser Anwendung willigen Sie in die oben genannte Bearbeitung Ihrer
				Nutzerdaten ein.
			</li>
			<li>
				Die von dieser Anwendung bereitgestellten Informationen dienen ausschliesslich
				Informationszwecken. Die Universität Bern übernimmt keine Gewähr für die Richtigkeit,
				Vollständigkeit oder Aktualität der bereitgestellten Informationen.
			</li>
			<li>
				Antworten werden automatisiert von einem KI-System generiert und nicht von menschlichen
				Mitarbeitenden überprüft. Wenn Ihre Anfrage komplex oder sensibel ist und/oder menschliche
				Unterstützung erfordert, wenden Sie sich bitte direkt an die zuständige Stelle.
			</li>
			<li>
				Die vom Chatbot bereitgestellten Informationen stellen keine rechtliche Beratung dar. Für
				verbindliche Auskünfte wenden Sie sich bitte an die zuständigen Abteilungen und offiziellen
				Kanäle der Universität.
			</li>
			<li>
				Die Universität Bern haftet nicht für Folgen, die sich aus der Nutzung der vom Chatbot
				bereitgestellten Informationen ergeben.
			</li>
			<li>
				Jeglicher Missbrauch des Dienstes, insbesondere im Zusammenhang mit illegalen Aktivitäten
				oder der Verbreitung schädlicher Inhalte, ist untersagt. Es gelten die Weisungen der
				Universitätsleitung zur Benutzung der IT-Ressourcen an der Universität Bern. Abrufbar unter:
				<a
					href="https://www.unibe.ch/unibe/portal/content/e152701/e332575/e332595/e371241/ul_ws_benutzung_it_ressourcen_ger.pdf"
					target="_blank">ul_ws_benutzung_it_ressourcen_ger.pdf</a
				>
			</li>
			<li>
				Die Universität Bern behält sich das Recht vor, diese Nutzungsbedingungen jederzeit zu
				aktualisieren. Änderungen werden auf dieser Seite veröffentlicht.
			</li>
		</ul>
		<p class="mt-4">
			Indem Sie auf „Akzeptieren“ klicken, bestätigen Sie, dass Sie diese Bedingungen gelesen,
			verstanden und akzeptiert haben.
		</p>

		<AlertDialog.Footer>
			<AlertDialog.Cancel>Akzeptieren</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<h1
	class="sticky top-0 z-10 mb-9 scroll-m-20 bg-white pb-4 text-center text-3xl font-extrabold tracking-tight text-balance lg:text-5xl"
>
	Informationskiosk der Universität Bern
	{#if customerName === 'innovation'}
		<p class="mt-2 text-lg font-medium">Ideenlabot</p>
		<p class="text-base font-normal">Der Bot beantwortet Fragen rund um das Ideenlabor</p>
	{:else}
		<p class="mt-2 text-lg font-medium">Der Bot beantwortet Fragen rund um die Abteilung für Qualitätssicherung und -entwicklung.</p>
	{/if}
</h1>

<div class="flex flex-col items-center justify-center gap-4 p-4">
	{#if initialized}
		{#if messages.length === 0}
			<p class="p-4 text-gray-500" in:fly|global={{ x: 800 }} out:fade>
				Keine Nachrichten vorhanden. Bitte senden Sie eine Nachricht an den Informationskioskbot.
			</p>
		{:else}
			{#each messages as message, index}
				<div
					class={[
						'w-full max-w-2xl rounded-lg border border-gray-200  p-4 shadow-md',
						message.issuer === 'bot' ? 'bg-secondary' : 'bg-white'
					]}
					in:fly|global={{ x: 800 * (message.issuer === 'bot' ? -1 : 1) }}
					out:fade
				>
					{#if message.response}
						{#await message.response}
							<div transition:slide>
								<LoaderCircle class="mx-auto size-12 animate-spin" />
								<p class="prose text-gray-700">
									Die künstliche Intelligenz sucht nach relevanten Informationen...
								</p>
							</div>
						{:then content}
							<div transition:slide use:focus>
								<div class="prose mb-2 text-gray-700 [&_a]:wrap-break-word">
									{@html marked.parse(content.output)}
								</div>
								{#if content.sources && content.sources.length > 0}
									<Sheet.Root>
										<Sheet.Trigger class={buttonVariants({ variant: 'default' })}
											>Quellen</Sheet.Trigger
										>
										<Sheet.Content class="w-full! sm:w-135!">
											<Sheet.Header>
												<Sheet.Title>verwendete Quellen</Sheet.Title>
											</Sheet.Header>
											<div class=" h-full overflow-y-auto">
												{#each content.sources as source}
													<div class="mb-2">
														<dl class="pl-2">
															<dt class="text-sm font-semibold">Titel</dt>
															<dd class="mb-1">
																{#if source.document_url.startsWith('http')}
																	<a
																		href={source.document_url}
																		target="_blank"
																		rel="noopener noreferrer"
																	>
																		{source.title}
																	</a>
																{:else}
																	{source.title}
																{/if}
															</dd>
															<dt class="text-xs font-semibold text-gray-500">Kategorie</dt>
															<dd class="mb-1 text-xs">{source.category}</dd>
															<dt class="text-xs font-semibold text-gray-500">Ort</dt>
															<dd class="mb-1">{source.document_location}</dd>
															<dt class="text-xs font-semibold text-gray-500">Datum</dt>
															<dd class="mb-1 text-xs">{source.gathered_on}</dd>
															<dt class="text-xs font-semibold text-gray-500">Score</dt>
															<dd class="mb-1 text-xs">{source.score.toFixed(2)}</dd>
															<dt class="text-xs font-semibold text-gray-500">Letzte Änderung</dt>
															<dd class="mb-1 text-xs">{source.modified}</dd>
															<dt class="text-xs font-semibold text-gray-500">Inhalt</dt>
															<dd class="prose mb-1 text-xs">
																{@html marked.parse(source.page_content)}
															</dd>
														</dl>
													</div>
												{/each}
											</div>
										</Sheet.Content>
									</Sheet.Root>
								{/if}
								<p class="semibold mb-1">War die Antwort hilfreich?</p>
								<form
									onsubmit={(e) => {
										e.preventDefault();
										//validate if required fields are filled
										if (helpful[index] === 0 && !feedbackMessages[index].trim()) {
											alert(
												'Bitte geben Sie einen Kommentar ein, wenn die Antwort nicht hilfreich war.'
											);
											return;
										}
										//submit feedback
										submitFeedback(helpful[index] ?? 1, feedbackMessages[index]);
									}}
								>
									<div class="mb-2 flex space-x-2">
										<Button
											variant={helpful[index] === 1 ? 'default' : 'outline'}
											size="sm"
											onclick={async (e: Event) => {
												helpful[index] = 1;
												await tick();
												const target = e.target as HTMLButtonElement;
												target?.form?.requestSubmit();
											}}
										>
											Ja
										</Button>
										<Button
											variant={helpful[index] === 0 ? 'default' : 'outline'}
											size="sm"
											onclick={() => {
												helpful[index] = 0;
												document.getElementById(`feedback-comments_${index}`)?.focus();
											}}
										>
											Nein
										</Button>
									</div>
									<p class="mb-1">Kommentare</p>
									<Textarea
										placeholder="Feedback eingeben..."
										bind:value={feedbackMessages[index]}
										onkeydown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault();
												const target = e.target as HTMLTextAreaElement;
												target.form?.requestSubmit();
											}
										}}
										required={helpful[index] === 0}
										id="feedback-comments_{index}"
										class="mb-2"
									/>
									<Button type="submit" size="sm" disabled={typeof helpful[index] !== 'number'}
										>Absenden</Button
									>
								</form>
							</div>
						{/await}
					{:else}
						<p class="mb-2 text-gray-700">{message.text}</p>
					{/if}
				</div>
			{/each}
		{/if}
		<form
			onsubmit={submitMessage}
			class="sticky bottom-0 flex w-full max-w-2xl space-x-2 bg-white pt-4"
		>
			<Textarea
				placeholder="Nachricht eingeben..."
				bind:value={qVal}
				onkeydown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						const target = e.target as HTMLTextAreaElement;
						target.form?.requestSubmit();
					}
				}}
				data-sveltekit-keepfocus
			/>
			<Button type="submit" size="icon" class="hover:cursor-pointer" disabled={locked}>
				{#if locked}
					<LoaderCircle class="animate-spin" />
				{:else}
					<Send />
				{/if}
			</Button>
		</form>
		<p class="max-w-2xl text-sm text-gray-500">
			Alle Angaben ohne Gewähr. Bitte überprüfen Sie die Informationen auf der offiziellen Webseite
			der Universität Bern. Bei Fragen oder Support wenden Sie sich bitte an das DSL
			<a href="mailto:kb-support.dsl@unibe.ch">kb-support.dsl@unibe.ch</a>.
		</p>
		<p class="max-w-2xl text-sm text-gray-500">
			Der Informationskioskbot ist ein KI-gestützter Chatbot, der Benutzern hilft, Informationen,
			die mit der Universität Bern zusammenhängen, schnell und einfach zu finden. Er wird vom <a
				href="https://dsl.unibe.ch"
				target="_blank">Data Science Lab (DSL)</a
			> entwickelt.
		</p>
	{:else}
		<p>
			Der Chatbot ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut. Kontaktieren
			Sie bei anhaltenden Problemen <a href="mailto:kb-support.dsl@unibe.ch"
				>kb-support.dsl@unibe.ch</a
			>.
		</p>
	{/if}
</div>
