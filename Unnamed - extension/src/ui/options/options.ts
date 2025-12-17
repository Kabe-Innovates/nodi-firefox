// This file contains the logic for the options page, managing user input and saving settings.

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-button');
    const blocklistInput = document.getElementById('blocklist-input') as HTMLInputElement;

    // Load existing settings
    loadSettings();

    saveButton.addEventListener('click', () => {
        const blocklist = blocklistInput.value.split(',').map(url => url.trim());
        saveSettings(blocklist);
    });
});

function loadSettings() {
    browser.storage.local.get('blocklist').then((result) => {
        const blocklist = result.blocklist || [];
        const blocklistInput = document.getElementById('blocklist-input') as HTMLInputElement;
        blocklistInput.value = blocklist.join(', ');
    });
}

function saveSettings(blocklist: string[]) {
    browser.storage.local.set({ blocklist }).then(() => {
        alert('Settings saved!');
    });
}