import { formatTime, getSettings } from '../common/utils';

type BlockReason = 'timer' | 'zone' | 'unknown';

type NullableElement<T extends Element> = T | null;

interface BlockedElements {
	title: NullableElement<HTMLElement>;
	message: NullableElement<HTMLElement>;
	reasonBadge: NullableElement<HTMLElement>;
	domainValue: NullableElement<HTMLElement>;
	sourceValue: NullableElement<HTMLElement>;
	zoneRow: NullableElement<HTMLElement>;
	zoneValue: NullableElement<HTMLElement>;
	distanceRow: NullableElement<HTMLElement>;
	distanceValue: NullableElement<HTMLElement>;
	radiusRow: NullableElement<HTMLElement>;
	radiusValue: NullableElement<HTMLElement>;
	sessionRow: NullableElement<HTMLElement>;
	sessionValue: NullableElement<HTMLElement>;
	remainingRow: NullableElement<HTMLElement>;
	remainingValue: NullableElement<HTMLElement>;
	goBackBtn: NullableElement<HTMLButtonElement>;
	openOptionsBtn: NullableElement<HTMLButtonElement>;
}

function getElements(): BlockedElements {
	return {
		title: document.getElementById('blocked-title'),
		message: document.getElementById('blocked-message'),
		reasonBadge: document.getElementById('reason-badge'),
		domainValue: document.getElementById('domain-value'),
		sourceValue: document.getElementById('source-value'),
		zoneRow: document.getElementById('zone-row'),
		zoneValue: document.getElementById('zone-value'),
		distanceRow: document.getElementById('distance-row'),
		distanceValue: document.getElementById('distance-value'),
		radiusRow: document.getElementById('radius-row'),
		radiusValue: document.getElementById('radius-value'),
		sessionRow: document.getElementById('session-row'),
		sessionValue: document.getElementById('session-value'),
		remainingRow: document.getElementById('remaining-row'),
		remainingValue: document.getElementById('remaining-value'),
		goBackBtn: document.getElementById('go-back') as HTMLButtonElement | null,
		openOptionsBtn: document.getElementById('open-options') as HTMLButtonElement | null,
	};
}

function getParam(params: URLSearchParams, key: string): string {
	return (params.get(key) || '').trim();
}

function parseReason(params: URLSearchParams): BlockReason {
	const reason = getParam(params, 'reason').toLowerCase();
	if (reason === 'timer' || reason === 'zone') {
		return reason;
	}
	return 'unknown';
}

function setText(el: NullableElement<HTMLElement>, value: string): void {
	if (el) {
		el.textContent = value;
	}
}

function showRow(row: NullableElement<HTMLElement>, visible: boolean): void {
	if (!row) {
		return;
	}
	row.style.display = visible ? 'flex' : 'none';
}

function formatNumberLabel(value: string, suffix: string): string {
	const n = Number(value);
	if (!Number.isFinite(n)) {
		return '-';
	}
	return `${Math.round(n)} ${suffix}`;
}

function renderTimerBlock(params: URLSearchParams, elements: BlockedElements): void {
	setText(elements.reasonBadge, 'TIMER_LOCK');
	setText(elements.title, 'FOCUS_MODE_ACTIVE');
	setText(elements.message, 'This domain is blocked while your Pomodoro focus session is running.');
	setText(elements.sourceValue, 'POMODORO_TIMER');

	const session = getParam(params, 'session');
	const remaining = getParam(params, 'remaining');
	const remainingSeconds = Number(remaining);

	showRow(elements.sessionRow, true);
	setText(elements.sessionValue, session || '-');

	showRow(elements.remainingRow, true);
	if (Number.isFinite(remainingSeconds) && remainingSeconds >= 0) {
		setText(elements.remainingValue, formatTime(Math.round(remainingSeconds)));
	} else {
		setText(elements.remainingValue, '-');
	}

	showRow(elements.zoneRow, false);
	showRow(elements.distanceRow, false);
	showRow(elements.radiusRow, false);
}

function renderZoneBlock(params: URLSearchParams, elements: BlockedElements): void {
	setText(elements.reasonBadge, 'ZONE_LOCK');
	setText(elements.title, 'ZONE_RESTRICTION_ACTIVE');
	setText(elements.message, 'This domain is blocked while you are inside an active focus zone.');
	setText(elements.sourceValue, 'LOCATION_ZONE');

	const zoneName = getParam(params, 'zone');
	const distance = getParam(params, 'distance');
	const radius = getParam(params, 'radius');

	showRow(elements.zoneRow, true);
	setText(elements.zoneValue, zoneName || 'UNNAMED_ZONE');

	showRow(elements.distanceRow, true);
	setText(elements.distanceValue, formatNumberLabel(distance, 'm'));

	showRow(elements.radiusRow, true);
	setText(elements.radiusValue, formatNumberLabel(radius, 'm'));

	showRow(elements.sessionRow, false);
	showRow(elements.remainingRow, false);
}

function renderUnknownBlock(elements: BlockedElements): void {
	setText(elements.reasonBadge, 'POLICY_LOCK');
	setText(elements.title, 'ACCESS_RESTRICTED');
	setText(elements.message, 'This domain is restricted by your active Nodi settings.');
	setText(elements.sourceValue, 'POLICY_ENGINE');

	showRow(elements.zoneRow, false);
	showRow(elements.distanceRow, false);
	showRow(elements.radiusRow, false);
	showRow(elements.sessionRow, false);
	showRow(elements.remainingRow, false);
}

async function applyTheme(): Promise<void> {
	try {
		const settings = await getSettings();
		const preference = settings.theme || 'dark';
		const resolvedTheme = preference === 'system'
			? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
			: preference;

		document.body.classList.toggle('light-theme', resolvedTheme === 'light');
	} catch (error) {
		console.warn('[Nodi] Failed to apply blocked page theme:', error);
		document.body.classList.remove('light-theme');
	}
}

function setupActions(elements: BlockedElements): void {
	elements.goBackBtn?.addEventListener('click', () => {
		window.history.back();
	});

	elements.openOptionsBtn?.addEventListener('click', async () => {
		try {
			await browser.runtime.openOptionsPage();
		} catch (error) {
			console.error('[Nodi] Failed to open options page:', error);
		}
	});
}

function setupThemeSync(): void {
	browser.runtime.onMessage.addListener((message) => {
		if (message?.type === 'THEME_CHANGED') {
			applyTheme().catch((error) => {
				console.error('[Nodi] Theme sync failed:', error);
			});
		}
	});

	const colorScheme = window.matchMedia('(prefers-color-scheme: light)');
	colorScheme.addEventListener('change', () => {
		applyTheme().catch((error) => {
			console.error('[Nodi] System theme sync failed:', error);
		});
	});
}

function renderBlockedPage(): void {
	const params = new URLSearchParams(window.location.search);
	const elements = getElements();
	const reason = parseReason(params);
	const domain = getParam(params, 'domain') || 'UNKNOWN';

	setText(elements.domainValue, domain);

	switch (reason) {
		case 'timer':
			renderTimerBlock(params, elements);
			break;
		case 'zone':
			renderZoneBlock(params, elements);
			break;
		default:
			renderUnknownBlock(elements);
			break;
	}

	setupActions(elements);
}

document.addEventListener('DOMContentLoaded', () => {
	renderBlockedPage();
	applyTheme().catch((error) => {
		console.error('[Nodi] Initial theme load failed:', error);
	});
	setupThemeSync();
});
