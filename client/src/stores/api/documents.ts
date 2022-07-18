import requester from '@/globals/requester';

//
// - Types
//

export type Document = {
    id: number,
    name: string,
    type: string,
    size: number,
};

//
// - Fonctions
//

const remove = async (id: Document['id']): Promise<void> => {
    await requester.delete(`/documents/${id}`);
};

export default { remove };
