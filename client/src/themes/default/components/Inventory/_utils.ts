import trim from 'lodash/trim';
import stringCompare from '@/utils/stringCompare';

import type { Category } from '@/stores/api/categories';
import type { AwaitedMaterial, AwaitedMaterialGroup } from './_types';

export const normalizeComment = (comment: string | null): string | null => {
    comment = comment !== null ? trim(comment) : null;
    return comment && comment.length > 0 ? comment : null;
};

export const groupByCategories = (
    materials: AwaitedMaterial[],
    categories: Category[],
): Array<AwaitedMaterialGroup<Category>> => {
    if (materials.length === 0) {
        return [];
    }

    const sections = new Map<Category['id'] | null, AwaitedMaterialGroup<Category>>();

    materials.forEach((material: AwaitedMaterial) => {
        const { id: categoryId = null, name: categoryName = null } = (
            material.category_id !== null
                ? (categories.find(({ id }: Category) => id === material.category_id) ?? {})
                : {}
        );

        if (!sections.has(categoryId)) {
            const group = {
                id: categoryId,
                name: categoryName,
                materials: [],
            } as AwaitedMaterialGroup<Category>;
            sections.set(categoryId, group);
        }

        const section = sections.get(categoryId);
        section!.materials.push(material);
    });

    const result = Array.from(sections.values());

    result.sort((a: AwaitedMaterialGroup<Category>, b: AwaitedMaterialGroup<Category>) => (
        stringCompare(a.name ?? '', b.name ?? '')
    ));
    result.forEach((section: AwaitedMaterialGroup<Category>) => {
        section.materials.sort((a: AwaitedMaterial, b: AwaitedMaterial) => (
            stringCompare(a.name, b.name)
        ));
    });

    return result;
};
