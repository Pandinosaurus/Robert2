import './index.scss';
import { defineComponent } from '@vue/composition-api';
import MaterialsSorted from '@/themes/default/components/MaterialsSorted';
import EventMissingMaterials from '@/themes/default/components/EventMissingMaterials';
import Totals from '@/themes/default/components/Totals';
import ReturnSummary from './ReturnSummary';

import type { PropType } from '@vue/composition-api';
import type { EventDetails, EventExtra } from '@/stores/api/events';

type Props = {
    /** L'événement dont on souhaite afficher l'onglet des techniciens. */
    event: EventDetails,
};

/** Onglet "Materiel" de la fenêtre d'un événement. */
const EventDetailsMaterials = defineComponent({
    name: 'EventDetailsMaterials',
    props: {
        event: {
            type: Object as PropType<Required<Props>['event']>,
            required: true,
        },
    },
    computed: {
        extras(): EventExtra[] {
            return this.event.is_billable
                ? this.event.extras
                : [];
        },
    },
    render() {
        const { event, extras } = this;
        const {
            id,
            materials,
            currency,
            is_billable: isBillable,
            has_missing_materials: hasMissingMaterials,
            is_return_inventory_done: isReturnInventoryDone,
        } = event;

        return (
            <div class="EventDetailsMaterials">
                {isReturnInventoryDone && (
                    <ReturnSummary event={event} />
                )}
                {(!isReturnInventoryDone && hasMissingMaterials) && (
                    <EventMissingMaterials
                        id={id}
                        class="EventDetailsMaterials__missing"
                    />
                )}
                <div class="EventDetailsMaterials__list">
                    <MaterialsSorted
                        materials={materials}
                        extras={extras}
                        withBilling={isBillable}
                        currency={currency}
                    />
                </div>
                <div class="EventDetailsMaterials__totals">
                    <Totals booking={event} />
                </div>
            </div>
        );
    },
});

export default EventDetailsMaterials;
