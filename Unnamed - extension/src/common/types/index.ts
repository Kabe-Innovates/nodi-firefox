export type BlockedDomain = {
    domain: string;
    reason: string;
    timestamp: number;
};

export type Location = {
    latitude: number;
    longitude: number;
};

export type Blocklist = {
    domains: BlockedDomain[];
};

export interface UserSettings {
    isEnabled: boolean;
    blocklist: Blocklist;
    location: Location | null;
}