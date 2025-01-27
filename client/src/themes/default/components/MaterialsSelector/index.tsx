import './index.scss';
import invariant from 'invariant';
import config from '@/globals/config';
import { defineComponent } from '@vue/composition-api';
import showModal from '@/utils/showModal';
import isMaterialResyncable from './utils/isMaterialResyncable';
import { BookingEntity } from '@/stores/api/bookings';
import apiMaterials from '@/stores/api/materials';
import CriticalError from '@/themes/default/components/CriticalError';
import Loading from '@/themes/default/components/Loading';
import Button from '@/themes/default/components/Button';
import Dropdown from '@/themes/default/components/Dropdown';
import Filters from './components/Filters';
import List from './components/List';
import store from './store';

// - Modales
import ImportFromEvent from './modals/ImportFromEvent';
import ResyncMaterialData from './modals/ResyncMaterialData';

import type { PropType } from '@vue/composition-api';
import type { Booking } from '@/stores/api/bookings';
import type { MaterialWithAvailability, MaterialWithContext } from '@/stores/api/materials';
import type {
    EventDetails,
    EventMaterial,
} from '@/stores/api/events';
import type {
    SelectedMaterial,
    EmbeddedMaterial,
    SourceMaterial,
    SourceMaterialOverrides,
    Filters as FiltersType,
} from './_types';

type Props = {
    /**
     * La sélection de matériel initiale.
     *
     * /!\ Attention, cette prop. ne peut pas être utilisée pour "controller" le component.
     * Celui-ci maintient son propre "state". Vous pouvez récupérer l'état courant
     * via l'API publique `[Ref].values` ou en écoutant l'événement `onChange`.
     */
    defaultValues?: SelectedMaterial[],

    /**
     * Le booking (événement) dans lequel le matériel va être ajouté.
     *
     * Si spécifié, le comportement du component changera comme suit:
     * - Si la valeur de `withBilling` est non spécifiée, c'est la valeur du
     *   champ `is_billable` du booking qui sera utilisée.
     * - Si la devise du booking ne correspond pas à la devise courante de l'application,
     *   il ne sera possible que de modifier les quantités du matériel déjà existant,
     *   il ne sera pas possible d'importer depuis des modèles, ni de resynchroniser
     *   les prix (vu que la devise n'est plus la même).
     *
     * NOTE: À noter que les matériels déjà contenu dans cette prop. ne seront pas
     * directement utilisés. C'est à dire que si vous passez un booking sans
     * passer `defaultValues`, il n'y aura pas de matériel pré-sélectionné.
     */
    booking?: Booking,

    /**
     * Doit-on afficher les informations liées à la facturation ?
     *
     * Si non spécifié et qu'un `booking` est passé, c'est la valeur de
     * son champ `is_billable` qui sera utilisée, sinon `false`.
     */
    withBilling?: boolean,
};

type Data = {
    isInitialized: boolean,
    isFetched: boolean,
    criticalError: boolean,
    filters: FiltersType,
    rawMaterials: (
        | MaterialWithAvailability[]
        | MaterialWithContext[]
    ),
};

type InstanceProperties = {
    unsubscribeStore: (() => void) | undefined,
    fetchInterval: ReturnType<typeof setInterval> | undefined,
};

/**
 * Représente l'état des filtres quand ils sont vides.
 *
 * @param onlySelected - Dois-t'on afficher uniquement le matériel sélectionné ?
 *
 * @returns Les filtres "vides".
 */
const getEmptyFilters = (onlySelected: boolean): FiltersType => ({
    search: null,
    onlySelected,
    park: null,
    category: null,
    subCategory: null,
    tags: [],
});

/** Sélecteur de matériels. */
const MaterialsSelector = defineComponent({
    name: 'MaterialsSelector',
    props: {
        booking: {
            type: Object as PropType<Props['booking']>,
            default: undefined,
        },
        defaultValues: {
            type: Array as PropType<Required<Props>['defaultValues']>,
            default: () => [],
        },
        withBilling: {
            type: Boolean as PropType<Props['withBilling']>,
            default: undefined,
        },
    },
    emits: [
        'ready',
        'change',
        'materialResynced',
    ],
    setup: (): InstanceProperties => ({
        unsubscribeStore: undefined,
        fetchInterval: undefined,
    }),
    data(): Data {
        return {
            isInitialized: false,
            isFetched: false,
            criticalError: false,
            filters: getEmptyFilters(false),
            rawMaterials: [],
        };
    },
    computed: {
        materials(): SourceMaterial[] {
            const { booking, withBillingFinal: withBilling } = this;

            return this.rawMaterials.map(
                (material: MaterialWithAvailability | MaterialWithContext) => {
                    const overrides: SourceMaterialOverrides | null = (() => {
                        if (booking === undefined) {
                            return null;
                        }

                        if (!booking.is_billable || !withBilling) {
                            const bookingMaterial = booking.materials.find(
                                ({ id }: EmbeddedMaterial) => (id === material.id),
                            );
                            return bookingMaterial === undefined ? null : {
                                name: bookingMaterial.name,
                                reference: bookingMaterial.reference,
                                replacement_price: bookingMaterial.unit_replacement_price,
                                currency: booking.currency,
                            };
                        }

                        const bookingMaterial = booking.materials.find(
                            ({ id }: EmbeddedMaterial) => (id === material.id),
                        );
                        return bookingMaterial === undefined ? null : {
                            name: bookingMaterial.name,
                            reference: bookingMaterial.reference,
                            rental_price: bookingMaterial.unit_price,
                            degressive_rate: bookingMaterial.degressive_rate,
                            rental_price_period: bookingMaterial.unit_price_period,
                            replacement_price: bookingMaterial.unit_replacement_price,
                            currency: booking.currency,
                        };
                    })();

                    return { ...material, overrides };
                },
            );
        },

        withBillingFinal(): boolean {
            if (this.withBilling !== undefined) {
                return this.withBilling;
            }
            return this.booking?.is_billable ?? false;
        },

        hasSelectedMaterials(): boolean {
            return !store.getters.isEmpty;
        },

        isEditOnly(): boolean {
            if (this.booking === undefined) {
                return false;
            }

            // - Si la devise du booking n'est pas la même que la devise courante, on bloque
            //   en édition only (comprendre: uniquement la modification des quantités de
            //   l'existant) car le matériel tiers est dans une autre devise et les deux ne
            //   peuvent pas être réconciliés, pour cela il faudrait prendre en charge la
            //   conversion.
            return !config.currency.isSame(this.booking.currency);
        },

        // ------------------------------------------------------
        // -
        // -    API Publique
        // -
        // ------------------------------------------------------

        /**
         * Retourne les quantités actuellement sélectionnées.
         *
         * @returns Les quantités actuellement sélectionnées.
         */
        values(): SelectedMaterial[] {
            return store.getters.export();
        },
    },
    mounted() {
        this.$store.dispatch('parks/fetch');

        this.init();
    },
    beforeDestroy() {
        this.unsubscribeStore?.();

        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleChange() {
            if (store.getters.isEmpty && !this.isEditOnly) {
                this.filters = { ...this.filters, onlySelected: false };
            }
            this.$emit('change', store.getters.export());
        },

        handleFiltersChanges(filters: FiltersType) {
            this.filters = filters;
        },

        async handleEventImport() {
            if (this.isEditOnly) {
                return;
            }

            const withBilling = this.withBillingFinal;
            const event: EventDetails | undefined = (
                await showModal(this.$modal, ImportFromEvent, {
                    materials: this.materials,
                    booking: this.booking,
                    withBilling,
                })
            );
            if (event) {
                this.importFromEvent(event);
            }
        },

        async handleResyncMaterialData(materialId: SourceMaterial['id']) {
            const material = this.materials.find(({ id }: SourceMaterial) => id === materialId);
            if (!material || !isMaterialResyncable(material, this.withBillingFinal)) {
                return;
            }

            const withBilling = this.withBillingFinal;
            const updatedMaterial: EmbeddedMaterial | undefined = (
                await showModal(this.$modal, ResyncMaterialData, {
                    booking: this.booking,
                    withBilling,
                    material,
                })
            );
            if (updatedMaterial !== undefined) {
                this.$emit('materialResynced', updatedMaterial);
            }
        },

        handleShowAllMaterials() {
            if (!this.filters.onlySelected || this.isEditOnly) {
                return;
            }
            this.filters = { ...this.filters, onlySelected: false };
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        init() {
            invariant(!this.isInitialized, 'Already initialized.');

            // - On initialise le store avec les données initiales.
            store.commit('init', this.defaultValues);

            // - Si du matériel est déjà sélectionné à l'initialisation ...
            //   => On passe en mode "Sélectionné uniquement".
            const showOnlySelected = this.isEditOnly || !store.getters.isEmpty;
            this.filters = { ...this.filters, onlySelected: showOnlySelected };

            // - Observe les changements du store et appelle le handler adéquate.
            this.unsubscribeStore = store.subscribe(() => { this.handleChange(); });

            // - Actualise la liste du matériel toutes les 30 secondes.
            this.fetchInterval = setInterval(this.fetchMaterials.bind(this), 30_000);
            this.fetchMaterials();

            this.isInitialized = true;
        },

        async fetchMaterials() {
            const { entity, id } = this.booking ?? { entity: null, id: null };

            try {
                if (entity && entity === BookingEntity.EVENT) {
                    this.rawMaterials = await apiMaterials.allWhileEvent(id);
                } else {
                    this.rawMaterials = await apiMaterials.all({
                        withDeleted: true,
                        paginated: false,
                    });
                }

                this.isFetched = true;
                this.$emit('ready');
            } catch {
                if (!this.isFetched) {
                    this.criticalError = true;

                    // - On ne tente pas de refetch si on est en erreur critique...
                    if (this.fetchInterval) {
                        clearInterval(this.fetchInterval);
                    }
                }
            }
        },

        async importFromEvent(event: EventDetails) {
            if (this.isEditOnly) {
                return;
            }

            // - On reset les filtres sans quoi l'utilisateur ne pourra
            //   potentiellement pas voir ce qu'il vient d'importer.
            this.filters = getEmptyFilters(true);

            event.materials.forEach((eventMaterial: EventMaterial) => {
                const { id, quantity } = eventMaterial;

                const material = this.materials.find(({ id: _id }: SourceMaterial) => _id === id);
                if (!material || material.is_deleted || quantity <= 0) {
                    return;
                }

                //
                // - Liste globale.
                //

                const globalQuantity = Math.max(0, quantity);

                //
                // - Ajustement des quantités.
                //

                // - Ajuste la quantité de la liste globale.
                if (globalQuantity > 0) {
                    store.commit('setQuantity', { material, quantity: globalQuantity });
                }
            });
        },

        __(key: string, params?: Record<string, number | string>, count?: number): string {
            key = !key.startsWith('global.')
                ? `components.MaterialsSelector.${key}`
                : key.replace(/^global\./, '');

            return this.$t(key, params, count);
        },
    },
    render() {
        const {
            __,
            filters,
            isInitialized,
            isEditOnly,
            isFetched,
            materials,
            criticalError,
            hasSelectedMaterials,
            withBillingFinal: withBilling,
            handleFiltersChanges,
            handleEventImport,
            handleShowAllMaterials,
            handleResyncMaterialData,
        } = this;

        // - On affiche le filtre permettant de n'afficher que le matériel
        //   sélectionné que s'il y a effectivement du matériel sélectionné.
        //   (ou que le filtre est encore sur "activé" et qu'il n'y a plus
        //   de matériel sélectionné) et qu'on est pas en "edit only".
        const showSelectedOnlyFilter = !isEditOnly && (
            hasSelectedMaterials || filters.onlySelected
        );

        if (criticalError || !isInitialized || !isFetched) {
            return (
                <div class="MaterialsSelector MaterialsSelector--not-ready">
                    {criticalError ? <CriticalError /> : <Loading />}
                </div>
            );
        }

        const renderImportActions = (): JSX.Element => (
            <Dropdown label={__('add-materials-from.dropdown.title')}>
                <Button
                    type="add"
                    class="Dropdown__item"
                    onClick={handleEventImport}
                    disabled={isEditOnly}
                >
                    {__('add-materials-from.dropdown.choices.an-event')}
                </Button>
            </Dropdown>
        );

        return (
            <div class="MaterialsSelector">
                <header class="MaterialsSelector__header">
                    <div class="MaterialsSelector__header__filters">
                        <Filters
                            ref="filters"
                            values={filters}
                            withSelectedOnlyFilter={showSelectedOnlyFilter}
                            onChange={handleFiltersChanges}
                        />
                    </div>
                    <div class="MaterialsSelector__header__actions">
                        {renderImportActions()}
                    </div>
                </header>
                <div class="MaterialsSelector__main">
                    <List
                        ref="list"
                        filters={filters}
                        materials={materials}
                        withBilling={withBilling}
                        isEditOnly={isEditOnly}
                        onRequestResyncMaterialData={handleResyncMaterialData}
                        onRequestShowAllMaterials={handleShowAllMaterials}
                    />
                </div>
            </div>
        );
    },
});

export type { SelectedMaterial };

export { default as getEmbeddedMaterialsQuantities } from './utils/getEmbeddedMaterialsQuantities';
export { default as hasQuantitiesChanged } from './utils/hasQuantitiesChanged';

export default MaterialsSelector;
