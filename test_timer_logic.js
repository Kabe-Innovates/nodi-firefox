
// Mock browser storage
const storage = {
    local: {
        data: {},
        get: async (keys) => storage.local.data,
        set: async (items) => { Object.assign(storage.local.data, items); return Promise.resolve(); }
    }
};
global.browser = { storage };

// Mocking logic
const getDefaultTimer = () => ({
    focusDuration: 1500, state: 'idle', startedAt: null, remainingSeconds: 1500,
});

let settings = { pomodoroTimer: getDefaultTimer() };
storage.local.data = settings;

const getTimerState = async () => storage.local.data.pomodoroTimer;
const saveTimerState = async (updates) => {
    const current = await getTimerState();
    storage.local.data.pomodoroTimer = { ...current, ...updates };
};

const calculateRemainingTime = (timer) => {
    if (!timer.startedAt || timer.state === 'idle') return timer.remainingSeconds;
    const now = Date.now();
    const elapsed = Math.floor((now - timer.startedAt) / 1000);
    let duration = timer.focusDuration;
    return Math.max(0, duration - elapsed);
};

const startTimer = async () => {
    const timer = await getTimerState();
    await saveTimerState({
        state: 'focus',
        startedAt: Date.now(),
        remainingSeconds: timer.focusDuration
    });
};

async function test() {
    console.log('1. Initial State:', await getTimerState());

    console.log('2. Starting Timer...');
    await startTimer();
    const afterStart = await getTimerState();
    console.log('   State:', afterStart.state);

    console.log('3. Calculating Remaining (Immediate):', calculateRemainingTime(afterStart));

    console.log('4. Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));

    const later = await getTimerState();
    const remaining = calculateRemainingTime(later);
    console.log('5. Calculating Remaining (After 2s):', remaining);

    if (remaining <= 1498 && remaining > 1400) {
        console.log('SUCCESS: Timer is ticking down.');
    } else {
        console.error('FAILURE: Timer is NOT ticking. Remaining:', remaining);
        process.exit(1);
    }
}

test();
