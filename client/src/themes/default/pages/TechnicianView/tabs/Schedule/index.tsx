import './index.scss';
import DateTime from '@/utils/datetime';
import truncate from 'lodash/truncate';
import Period, { PeriodReadableFormat } from '@/utils/period';
import { defineComponent } from '@vue/composition-api';
import apiTechnicians from '@/stores/api/technicians';
import EventDetails, { TabIndex as EventDetailsTab } from '@/themes/default/modals/EventDetails';
import CriticalError from '@/themes/default/components/CriticalError';
import MonthCalendar from '@/themes/default/components/MonthCalendar';
import Loading from '@/themes/default/components/Loading';
import showModal from '@/utils/showModal';

import type { PropType } from '@vue/composition-api';
import type { CalendarItem } from '@/themes/default/components/MonthCalendar';
import type { Technician, TechnicianEvent } from '@/stores/api/technicians';
import type { RawColor } from '@/utils/color';

type Props = {
    /** Le technicien dont on veut voir le planning */
    technician: Technician,
};

type InstanceProperties = {
    nowTimer: ReturnType<typeof setInterval> | undefined,
};

type Data = {
    isFetched: boolean,
    assignments: TechnicianEvent[],
    hasCriticalError: boolean,
    now: DateTime,
};

/** Onglet du planning du technicien. */
const TechnicianViewSchedule = defineComponent({
    name: 'TechnicianViewSchedule',
    props: {
        technician: {
            type: Object as PropType<Props['technician']>,
            required: true,
        },
    },
    setup: (): InstanceProperties => ({
        nowTimer: undefined,
    }),
    data: (): Data => ({
        isFetched: false,
        hasCriticalError: false,
        assignments: [],
        now: DateTime.now(),
    }),
    computed: {
        formattedAssignments(): CalendarItem[] {
            const { $t: __, now } = this;

            return this.assignments.map((assignment: TechnicianEvent): CalendarItem => {
                const { event } = assignment;
                const { is_confirmed: isConfirmed } = event;
                const isPast = assignment.period.isBefore(now);

                // - Si la date de fin est minuit du jour suivant, on la met à la seconde précédente
                //   pour éviter que le slot apparaisse dans le jour suivant sur le calendrier.
                const period = new Period(
                    (assignment.period as Period<false>).start,
                    (
                        (assignment.period as Period<false>).end.isStartOfDay()
                            ? (assignment.period as Period<false>).end.subSecond()
                            : (assignment.period as Period<false>).end
                    ),
                );

                const eventInfos = (event.location ?? '').length > 0
                    ? `${truncate(event.title, { length: 25 })} (${truncate(event.location!, { length: 15 })})`
                    : truncate(event.title, { length: 45 });

                const formattedPeriod = assignment.period.toReadable(__, PeriodReadableFormat.MINIMALIST);
                const assignmentInfos = (assignment.position ?? '').length > 0
                    ? `${formattedPeriod}: ${assignment.position!}`
                    : formattedPeriod;

                return {
                    id: assignment.id,
                    summary: `${eventInfos}\n${assignmentInfos}`,
                    period,
                    color: event.color as RawColor | null,
                    className: ['TechnicianViewSchedule__item', {
                        'TechnicianViewSchedule__item--past': isPast,
                        'TechnicianViewSchedule__item--not-confirmed': !isConfirmed,
                    }],
                };
            });
        },
    },
    mounted() {
        this.fetchData();

        // - Actualise le timestamp courant toutes les 60 secondes.
        this.nowTimer = setInterval(() => { this.now = DateTime.now(); }, 60_000);
    },
    beforeDestroy() {
        if (this.nowTimer) {
            clearInterval(this.nowTimer);
        }
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleDoubleClickItem(id: TechnicianEvent['id']) {
            const assignment = this.assignments.find(
                (_assignment: TechnicianEvent) => (
                    _assignment.id === id
                ),
            );
            if (assignment === undefined) {
                return;
            }

            showModal(this.$modal, EventDetails, {
                id: assignment.event.id,
                defaultTabIndex: EventDetailsTab.TECHNICIANS,
                onClose: () => { this.fetchData(); },
            });
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        async fetchData() {
            const { id } = this.technician;

            try {
                this.assignments = await apiTechnicians.assignments(id);
                this.isFetched = true;
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(`Error occurred while retrieving technician assignments:`, error);
                this.hasCriticalError = true;
            }
        },
    },
    render() {
        const {
            isFetched,
            hasCriticalError,
            formattedAssignments,
            handleDoubleClickItem,
        } = this;

        if (hasCriticalError || !isFetched) {
            return (
                <div class="TechnicianViewSchedule">
                    {hasCriticalError ? <CriticalError /> : <Loading />}
                </div>
            );
        }

        return (
            <div class="TechnicianViewSchedule">
                <MonthCalendar
                    items={formattedAssignments}
                    onDoubleClickItem={handleDoubleClickItem}
                />
            </div>
        );
    },
});

export default TechnicianViewSchedule;
