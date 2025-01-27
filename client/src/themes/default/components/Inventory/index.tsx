import './index.scss';
import invariant from 'invariant';
import { defineComponent } from '@vue/composition-api';
import { groupByCategories /* groupByParks */ } from './_utils';
import { InventoryLock, InventoryErrorsSchema } from './_types';
import Item from './components/Item';

import type { PropType } from '@vue/composition-api';
import type {
    AwaitedMaterial,
    AwaitedMaterialGroup,
    InventoryData,
    InventoryMaterial,
    InventoryMaterialData,
    InventoryMaterialError,
} from './_types';

export enum DisplayGroup {
    /** Tri par catégories. */
    CATEGORIES = 'categories',

    // /** Tri par parcs. */
    // PARKS = 'parks',

    /** Pas de tri. */
    NONE = 'none',
}

type Props = {
    /**
     * Le matériel attendu dans l'inventaire.
     *
     * @see {@link AwaitedMaterial} pour plus d'informations.
     */
    materials: AwaitedMaterial[],

    /**
     * L'inventaire déjà réalisé (le cas échéant).
     *
     * Le matériel dont il est fait l'inventaire dans cette prop. doit
     * impérativement exister dans la prop. `materials` (idem pour ses unités).
     *
     * @see {@link InventoryData} pour plus d'informations.
     */
    inventory: InventoryData,

    /** L'affichage par groupe à utiliser. */
    displayGroup?: DisplayGroup,

    /**
     * Permet de "verrouiller" l'inventaire (= Lecture seule).
     *
     * @default false
     */
    locked?: boolean | InventoryLock[],

    /**
     * Permet d'activer ou non le mode "strict".
     *
     * Si activé, il ne sera pas possible de spécifier une plus grande
     * quantité qu'attendue pour chaque matériel inventorié.
     *
     * @default false
     */
    strict?: boolean,

    /**
     * Doit-on inventorier les quantités cassés ?
     *
     * @default false
     */
    withBrokenCount?: boolean,

    /**
     * Les commentaires sont-ils activés sur cet inventaire ?
     *
     * Ceci peut-être utile pour permettre à l'utilisateur d'ajouter des
     * remarques sur l'état, la condition, etc. d'un matériel.
     *
     * Note: Cette prop. n'impacte que l'activation ou non de la fonctionnalité
     * des commentaires sur l'inventaire (= l'affichage de ceux-ci), elle
     * n'implique pas que les commentaires sont autorisés en écriture.
     * Pour ceci veuillez utiliser voir la prop. `locked`.
     *
     * @default false
     */
    withComments?: boolean,

    /**
     * Une liste d'erreurs pour certains matériels (si nécessaire).
     *
     * Doit contenir un tableau d'objets au format suivant:
     * - `id`: L'identifiant du matériel (existant dans la prop `materials` donc).
     * - `message`: Un - éventuel - message d'erreur associé.
     */
    errors?: InventoryMaterialError[],
};

/** Inventaire de matériel. */
const Inventory = defineComponent({
    name: 'Inventory',
    props: {
        materials: {
            type: Array as PropType<Props['materials']>,
            required: true,
        },
        inventory: {
            type: Array as PropType<Props['inventory']>,
            required: true,
        },
        errors: {
            type: Array as PropType<Required<Props>['errors']>,
            default: () => [],
        },
        locked: {
            type: [Boolean, Array] as PropType<Required<Props>['locked']>,
            default: false,
        },
        strict: {
            type: Boolean as PropType<Required<Props>['strict']>,
            default: false,
        },
        withBrokenCount: {
            type: Boolean as PropType<Required<Props>['withBrokenCount']>,
            default: false,
        },
        withComments: {
            type: Boolean as PropType<Required<Props>['withComments']>,
            default: false,
        },
        displayGroup: {
            type: String as PropType<Required<Props>['displayGroup']>,
            default: DisplayGroup.CATEGORIES,
            validator: (displayGroup: unknown): boolean => (
                typeof displayGroup === 'string' &&
                (Object.values(DisplayGroup) as string[]).includes(displayGroup)
            ),
        },
    },
    emits: ['change'],
    computed: {
        isStateLocked(): boolean {
            if (Array.isArray(this.locked)) {
                return this.locked.includes(InventoryLock.STATE);
            }
            return this.locked === true;
        },

        isCommentSpecificallyLocked(): boolean {
            return Array.isArray(this.locked)
                ? this.locked.includes(InventoryLock.COMMENT)
                : false;
        },

        list(): AwaitedMaterialGroup[] {
            switch (this.displayGroup) {
                case DisplayGroup.CATEGORIES: {
                    const categories = this.$store.state.categories.list;
                    return groupByCategories(this.materials, categories);
                }
                // case DisplayGroup.PARKS: {
                //     const parks = this.$store.state.parks.list;
                //     // return dispatchMaterialInSections(this.materials, 'park_id', parks);
                //     return groupByParks(this.materials, parks);
                // }
                default: {
                    return [{ id: null, name: null, materials: this.materials }];
                }
            }
        },
    },
    mounted() {
        this.$store.dispatch('categories/fetch');
        this.$store.dispatch('parks/fetch');
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleChange(materialId: AwaitedMaterial['id'], materialInventory: InventoryMaterialData) {
            if (this.locked === true) {
                return;
            }
            this.$emit('change', materialId, materialInventory);
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        getMaterialInventory(materialId: AwaitedMaterial['id']): InventoryMaterialData {
            const material = this.materials.find((_material: AwaitedMaterial) => _material.id === materialId);
            invariant(material, 'The requested material is not part of the inventory.');

            const existingInventory = this.inventory.find(
                ({ id }: InventoryMaterial) => id === materialId,
            );

            const materialInventory: InventoryMaterialData = {
                actual: existingInventory?.actual ?? 0,
            };
            if (this.withComments && !this.isCommentSpecificallyLocked) {
                (materialInventory as InventoryMaterialData<boolean, true>).comment = (
                    (existingInventory as InventoryMaterial<boolean, true> | undefined)?.comment ?? null
                );
            }
            if (this.withBrokenCount) {
                (materialInventory as InventoryMaterialData<true>).broken = (
                    (existingInventory as InventoryMaterial<true> | undefined)?.broken ?? 0
                );
            }

            return materialInventory;
        },

        getMaterialError(materialId: AwaitedMaterial['id']): string | undefined {
            const error = this.errors?.find(({ id }: InventoryMaterialError) => id === materialId);
            return error?.message?.trim() || undefined;
        },
    },
    render() {
        const {
            $t: __,
            list,
            strict,
            locked,
            withComments,
            withBrokenCount,
            displayGroup,
            getMaterialInventory,
            getMaterialError,
            handleChange,
        } = this;

        const classNames = ['Inventory', {
            'Inventory--editable': locked !== true,
        }];

        return (
            <div class={classNames}>
                {list.map(({ id: sectionId, name: sectionName, materials }: AwaitedMaterialGroup) => {
                    const key = sectionId ?? (displayGroup !== DisplayGroup.NONE ? null : 'flat');
                    return (
                        <div key={key} class="Inventory__section">
                            <div class="Inventory__section__header">
                                {displayGroup !== DisplayGroup.NONE && (
                                    <h3 class="Inventory__section__title">
                                        {sectionName ?? __('not-categorized')}
                                    </h3>
                                )}
                                <div class="Inventory__section__columns">
                                    <span class="Inventory__section__columns__item">
                                        {__('actual-qty')}
                                    </span>
                                    {withBrokenCount && (
                                        <span class="Inventory__section__columns__item">
                                            {__('out-of-order-qty')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div class="Inventory__section__items">
                                {materials.map((material: AwaitedMaterial) => (
                                    <Item
                                        ref={`items[${material.id}]`}
                                        key={material.id}
                                        material={material}
                                        inventory={getMaterialInventory(material.id)}
                                        error={getMaterialError(material.id)}
                                        withBrokenCount={withBrokenCount}
                                        withComments={withComments}
                                        locked={locked}
                                        strict={strict}
                                        onChange={handleChange}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    },
});

export type {
    AwaitedMaterial,
    InventoryData,
    InventoryMaterial,
    InventoryMaterialData,
    InventoryMaterialError,
};

export {
    InventoryLock,
    InventoryErrorsSchema,
};

export default Inventory;
