import './index.scss';
import { defineComponent } from '@vue/composition-api';
import store from '../../../store';

import type { PropType } from '@vue/composition-api';
import type { SourceMaterial } from '../../../_types';

type Props = {
    /** Le matériel avec ses quantités disponibles. */
    material: SourceMaterial,
};

const MaterialsSelectorListAvailability = defineComponent({
    name: 'MaterialsSelectorListAvailability',
    props: {
        material: {
            type: Object as PropType<Required<Props>['material']>,
            required: true,
        },
    },
    computed: {
        availability() {
            const { material } = this;

            const quantityUsed: number = store.getters.getQuantity(material.id);

            // - Calcule la quantité disponible en prenant en compte la quantité utilisée par toutes les listes.
            //   (et pas seulement celle dans laquelle on est actuellement)
            const availableQuantity = (material.available_quantity ?? 0);

            // - Pour le calcul du surplus, on récupère le surplus en prenant en compte toutes les listes
            //   puis on fait en sorte que ça ne dépasse pas la quantité utilisée dans la liste courante.
            //   (car le surplus de la liste courante est au maximum la quantité utilisée dans cette même liste)
            const surplus = Math.min(Math.abs(Math.min(0, availableQuantity)), quantityUsed);

            return { stock: Math.max(availableQuantity, 0), surplus };
        },
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        __(key: string, params?: Record<string, number | string>, count?: number): string {
            key = !key.startsWith('global.')
                ? `components.MaterialsSelector.list-availability.${key}`
                : key.replace(/^global\./, '');

            return this.$t(key, params, count);
        },
    },
    render() {
        const { __, availability } = this;
        const classNames = ['MaterialsSelectorListAvailability', {
            'MaterialsSelectorListAvailability--warning': availability.stock === 0,
        }];

        return (
            <div class={classNames}>
                <span class="MaterialsSelectorListAvailability__stock">
                    {__('stock-count', { count: availability.stock }, availability.stock)}
                </span>
                {availability.surplus > 0 && (
                    <span class="MaterialsSelectorListAvailability__surplus">
                        ({__('surplus-count', { count: availability.surplus }, availability.surplus)})
                    </span>
                )}
            </div>
        );
    },
});

export default MaterialsSelectorListAvailability;
