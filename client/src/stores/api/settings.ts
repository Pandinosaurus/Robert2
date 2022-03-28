import requester from '@/globals/requester';

//
// - Types
//

export type MaterialDisplayMode = 'categories' | 'sub-categories' | 'parks' | 'flat';

export type Settings = {
    eventSummary: {
        customText: {
            title: string | null,
            content: string | null,
        },
        materialDisplayMode: MaterialDisplayMode,
        showLegalNumbers: boolean,
    },
    calendar: {
        event: {
            showLocation: boolean,
            showBorrower: boolean,
        },
    },
};

//
// - Functions
//

const all = async (): Promise<Settings> => (
    (await requester.get('settings')).data
);

const put = async (data: Partial<Settings>): Promise<Settings> => (
    (await requester.put('settings', data)).data
);

const reset = async (key: string): Promise<Settings> => (
    (await requester.delete(`/settings/${key}`)).data
);

export default { all, put, reset };
