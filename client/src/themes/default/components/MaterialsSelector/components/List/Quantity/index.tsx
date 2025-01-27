import { defineComponent } from '@vue/composition-api';
import debounce from 'lodash/debounce';
import { DEBOUNCE_WAIT_DURATION } from '@/globals/constants';
import QuantityInput from '@/themes/default/components/QuantityInput';

import type { DebouncedMethod } from 'lodash';
import type { PropType } from '@vue/composition-api';
import type { SourceMaterial } from '../../../_types';

type Props = {
    /** Le matériel dont on veut définir les quantités. */
    material: SourceMaterial,

    /** La quantité actuelle. */
    quantity: number,
};

type Data = {
    bouncedQuantity: number,
};

type InstanceProperties = {
    updateQuantityDebounced: (
        | DebouncedMethod<typeof MaterialsSelectorListQuantity, 'updateQuantity'>
        | undefined
    ),
};

/** Sélecteur de quantité de matériel. */
const MaterialsSelectorListQuantity = defineComponent({
    name: 'MaterialsSelectorListQuantity',
    props: {
        material: {
            type: Object as PropType<Required<Props['material']>>,
            required: true,
        },
        quantity: {
            type: Number as PropType<Required<Props['quantity']>>,
            required: true,
        },
    },
    emits: ['change'],
    setup: (): InstanceProperties => ({
        updateQuantityDebounced: undefined,
    }),
    data(): Data {
        return {
            bouncedQuantity: this.quantity,
        };
    },
    watch: {
        quantity(newValue: number) {
            this.bouncedQuantity = newValue;
        },
    },
    created() {
        this.updateQuantityDebounced = debounce(
            this.updateQuantity.bind(this),
            DEBOUNCE_WAIT_DURATION.asMilliseconds(),
        );
    },
    beforeDestroy() {
        this.updateQuantityDebounced?.cancel();
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleChange(value: string) {
            this.bouncedQuantity = parseInt(value, 10) || 0;
            this.updateQuantityDebounced!();
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        updateQuantity() {
            const { material, bouncedQuantity } = this;
            this.$emit('change', material, bouncedQuantity);
        },
    },
    render() {
        const { bouncedQuantity, handleChange } = this;

        return (
            <QuantityInput
                limit={{ min: 0 }}
                value={bouncedQuantity}
                onChange={handleChange}
            />
        );
    },
});

export default MaterialsSelectorListQuantity;
