// This file contains the logic for the popup interface, handling user interactions and saving settings.

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-button');
    const blocklistInput = document.getElementById('blocklist-input') as HTMLInputElement;

    // Load existing blocklist from storage
    chrome.storage.local.get(['blocklist'], (result) => {
        if (result.blocklist) {
            blocklistInput.value = result.blocklist.join(', ');
        }
    });

    // Save blocklist to storage on button click
    saveButton.addEventListener('click', () => {
        const blocklist = blocklistInput.value.split(',').map(item => item.trim()).filter(item => item);
        chrome.storage.local.set({ blocklist }, () => {
            alert('Blocklist saved!');
        });
    });
});