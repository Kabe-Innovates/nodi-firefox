export const getStorageItem = async (key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        browser.storage.local.get(key, (result) => {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
};

export const setStorageItem = async (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        browser.storage.local.set({ [key]: value }, () => {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
};

export const removeStorageItem = async (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        browser.storage.local.remove(key, () => {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
};