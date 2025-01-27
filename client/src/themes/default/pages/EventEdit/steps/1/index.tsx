import './index.scss';
import Period from '@/utils/period';
import upperFirst from 'lodash/upperFirst';
import { defineComponent } from '@vue/composition-api';
import axios from 'axios';
import HttpCode from 'status-code-enum';
import pick from 'lodash/pick';
import config, { BillingMode } from '@/globals/config';
import apiEvents from '@/stores/api/events';
import Alert from '@/themes/default/components/Alert';
import Button from '@/themes/default/components/Button';
import FormField from '@/themes/default/components/FormField';
import Fieldset from '@/themes/default/components/Fieldset';
import { ApiErrorCode } from '@/stores/api/@codes';
import getCSSProperty from '@/utils/getCSSProperty';

import type { PropType } from '@vue/composition-api';
import type { EventDetails, EventEdit, EventTechnician } from '@/stores/api/events';

type Props = {
    /**
     * L'événement en cours d'édition.
     *
     * Si l'événement n'a pas encore été sauvegardé, cette prop. doit être à `null`.
     */
    event: EventDetails | null,
};

type Edited = Pick<EventEdit, (
    | 'title'
    | 'operation_period'
    | 'mobilization_period'
    | 'location'
    | 'description'
    | 'color'
    | 'is_billable'
    | 'is_confirmed'
)>;

type Data = {
    data: Edited,
    shouldSyncPeriods: boolean,
    validationErrors: Record<string, string> | null,
    operationPeriodIsFullDays: boolean,
};

const DEFAULT_VALUES: Edited = Object.freeze({
    title: '',
    operation_period: null,
    mobilization_period: null,
    location: '',
    description: '',
    color: null,
    is_billable: config.billingMode !== BillingMode.NONE,
    is_confirmed: false,
});

const hasDirtyData = (savedData: EventDetails | null, pendingData: Edited): boolean => (
    savedData === null ||
    pendingData.title !== savedData.title ||
    pendingData.color !== savedData.color ||
    pendingData.is_confirmed !== savedData.is_confirmed ||
    pendingData.is_billable !== savedData.is_billable ||
    !pendingData.operation_period?.isSame(savedData.operation_period) ||
    !pendingData.mobilization_period?.isSame(savedData.mobilization_period) ||
    (pendingData.description || null) !== (savedData.description || null) ||
    (pendingData.location || null) !== (savedData.location || null)
);

/** Étape 1 de l'édition d'un événement : Informations générales. */
const EventEditStepInfos = defineComponent({
    name: 'EventEditStepInfos',
    provide: {
        verticalForm: true,
    },
    props: {
        event: {
            type: Object as PropType<Props['event']>,
            default: null,
        },
    },
    emits: [
        'loading',
        'updateEvent',
        'goToStep',
        'stopLoading',
        'dataChange',
        'dataReset', // eslint-disable-line vue/no-unused-emit-declarations
    ],
    data(): Data {
        let defaultOperationPeriod = null;
        try {
            const requestedDate = this.$route.query.atDate ?? null;
            if (requestedDate !== null && typeof requestedDate === 'string') {
                defaultOperationPeriod = new Period(requestedDate, requestedDate, true);
            }
        } catch {
            // -
        }
        const data: Edited = {
            ...DEFAULT_VALUES,
            operation_period: defaultOperationPeriod,
            ...pick(this.event ?? {}, Object.keys(DEFAULT_VALUES)),
        };

        const canSyncPeriods = (
            !this.event?.is_departure_inventory_done &&
            !this.event?.is_return_inventory_done
        );
        const shouldSyncPeriods: boolean = canSyncPeriods && (
            data.mobilization_period === null ||
            (
                data.operation_period !== null &&
                data.operation_period.setFullDays(false)
                    .isSame(data.mobilization_period)
            )
        );
        if (canSyncPeriods && shouldSyncPeriods) {
            data.mobilization_period = data.operation_period
                ?.setFullDays(false) ?? null;
        }

        return {
            data,
            shouldSyncPeriods,
            validationErrors: null,
            operationPeriodIsFullDays: (
                data.operation_period?.isFullDays ?? true
            ),
        };
    },
    computed: {
        isNew(): boolean {
            return this.event === null;
        },

        allowBillingToggling(): boolean {
            return config.billingMode === BillingMode.PARTIAL;
        },

        duration(): number | undefined {
            return this.data.operation_period?.asDays();
        },

        defaultColor(): string | null {
            return getCSSProperty('calendar-event-default-color');
        },

        hasTechnicians(): boolean {
            return (this.event?.technicians ?? []).length > 0;
        },

        isDepartureInventoryDone(): boolean {
            return !!this.event?.is_departure_inventory_done;
        },

        isReturnInventoryDone(): boolean {
            return !!this.event?.is_return_inventory_done;
        },

        canSyncPeriods(): boolean {
            return (
                !this.isDepartureInventoryDone &&
                !this.isReturnInventoryDone
            );
        },

        hasAssignmentImpactingChange(): boolean {
            if (this.event === null || !this.hasTechnicians) {
                return false;
            }

            // - Si on a pas encore
            if (!this.data.operation_period || !this.data.mobilization_period) {
                return false;
            }

            return (
                !this.event.operation_period.isSame(this.data.operation_period) ||
                !this.event.mobilization_period.isSame(this.data.mobilization_period)
            );
        },

        hasAssignmentCriticalImpactingChange(): boolean {
            if (!this.hasAssignmentImpactingChange) {
                return false;
            }

            const assignationPeriod = this.data.mobilization_period!
                .merge(this.data.operation_period!)
                .setFullDays(false);

            return this.event!.technicians.some((assignment: EventTechnician) => {
                const normalizedPeriod = assignment.period.setFullDays(false);
                const normalizedPeriodStart = normalizedPeriod.start.roundMinutes(15);
                const normalizedPeriodEnd = normalizedPeriod.end.roundMinutes(15);

                return (
                    normalizedPeriodStart.isSameOrAfter(assignationPeriod.end) ||
                    normalizedPeriodStart.isBefore(assignationPeriod.start) ||
                    normalizedPeriodEnd.isSameOrBefore(assignationPeriod.start) ||
                    normalizedPeriodEnd.isAfter(assignationPeriod.end)
                );
            });
        },

        readonlyMobilizationPeriodWarning(): string | null {
            const { __, event, isDepartureInventoryDone, isReturnInventoryDone } = this;

            if (!isDepartureInventoryDone && !isReturnInventoryDone) {
                return null;
            }

            if (isDepartureInventoryDone && isReturnInventoryDone) {
                return __('readonly-mobilization-period-warning.entirely');
            }

            if (isDepartureInventoryDone) {
                const formattedDate = event?.departure_inventory_datetime?.toReadable() ?? null;
                const author = (event?.departure_inventory_author ?? null) !== null
                    ? event!.departure_inventory_author!.full_name
                    : null;

                if (author !== null && formattedDate !== null) {
                    return __('readonly-mobilization-period-warning.start-only.with-author-date', {
                        date: formattedDate,
                        author,
                    });
                }

                if (author !== null) {
                    return __('readonly-mobilization-period-warning.start-only.with-author', { author });
                }

                if (formattedDate !== null) {
                    return __('readonly-mobilization-period-warning.start-only.with-date', {
                        date: formattedDate,
                    });
                }

                return __('readonly-mobilization-period-warning.start-only.simple');
            }

            const formattedDate = event?.return_inventory_datetime?.toReadable() ?? null;
            const author = (event?.return_inventory_author ?? null) !== null
                ? event!.return_inventory_author!.full_name
                : null;

            if (author !== null && formattedDate !== null) {
                return __('readonly-mobilization-period-warning.end-only.with-author-date', {
                    date: formattedDate,
                    author,
                });
            }

            if (author !== null) {
                return __('readonly-mobilization-period-warning.end-only.with-author', { author });
            }

            if (formattedDate !== null) {
                return __('readonly-mobilization-period-warning.end-only.with-date', {
                    date: formattedDate,
                });
            }

            return __('readonly-mobilization-period-warning.end-only.simple');
        },

        technicianTransferWarning(): string | null {
            const { __, data } = this;

            if (!this.hasAssignmentImpactingChange) {
                return null;
            }

            if (!this.hasAssignmentCriticalImpactingChange) {
                return __('technician-transfer-warning.without-critical-impact');
            }

            if (!data.mobilization_period || !data.operation_period) {
                return null;
            }

            const assignationPeriod = data.mobilization_period
                .merge(data.operation_period)
                .setFullDays(false);

            return __('technician-transfer-warning.with-critical-impact', {
                period: upperFirst(assignationPeriod.toReadable(this.$t)),
            });
        },
    },
    watch: {
        event() {
            this.setValuesFromEvent();
        },
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleOperationPeriodChange(operationPeriod: Period | null, isFullDays: boolean) {
            this.operationPeriodIsFullDays = isFullDays;

            if (this.canSyncPeriods && this.shouldSyncPeriods) {
                this.data.mobilization_period = operationPeriod?.setFullDays(false) ?? null;
            }

            const hasChanges = hasDirtyData(this.event, this.data);
            this.$emit(hasChanges ? 'dataChange' : 'dataReset');
        },

        handleSyncPeriodsChange(shouldSync: boolean) {
            if (!this.canSyncPeriods) {
                this.shouldSyncPeriods = false;
                return;
            }
            this.shouldSyncPeriods = shouldSync;

            if (shouldSync) {
                this.data.mobilization_period = this.data.operation_period
                    ?.setFullDays(false) ?? null;
            }
        },

        handleChange() {
            const hasChanges = hasDirtyData(this.event, this.data);
            this.$emit(hasChanges ? 'dataChange' : 'dataReset');
        },

        handleSubmit(e: SubmitEvent) {
            e.preventDefault();

            this.save();
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        setValuesFromEvent() {
            if (!this.event) {
                return;
            }

            this.data = {
                ...DEFAULT_VALUES,
                ...this.data,
                ...pick(this.event ?? {}, Object.keys(DEFAULT_VALUES)),
            };

            if (hasDirtyData(this.event, this.data)) {
                this.$emit('dataChange');
            }
        },

        async save() {
            this.$emit('loading');
            const { isNew } = this;

            const doRequest = (): Promise<EventDetails> => (
                isNew
                    ? apiEvents.create(this.data)
                    : apiEvents.update(this.event!.id, this.data)
            );

            try {
                const data = await doRequest();
                this.$emit('updateEvent', data);
                this.$emit('goToStep', 2);
            } catch (error) {
                const { __ } = this;

                let errorMessage = __('global.errors.unexpected-while-saving');
                if (axios.isAxiosError(error)) {
                    const { status, data } = error.response! || {
                        status: HttpCode.ServerErrorInternal,
                        data: undefined,
                    };
                    const { code, details } = data?.error || {
                        code: ApiErrorCode.UNKNOWN,
                        details: {},
                    };

                    if (code === ApiErrorCode.VALIDATION_FAILED) {
                        this.validationErrors = { ...details };
                        errorMessage = __('global.errors.validation');
                    } else if (status === HttpCode.ClientErrorNotFound) {
                        errorMessage = __('global.errors.record-not-found');
                    } else if (status === HttpCode.ClientErrorConflict) {
                        errorMessage = __('global.errors.already-exists');
                    }
                }

                this.$toasted.error(errorMessage);
            } finally {
                this.$emit('stopLoading');
            }
        },

        __(key: string, params?: Record<string, number | string>, count?: number): string {
            if (!key.startsWith('global.')) {
                if (!key.startsWith('page.')) {
                    key = `page.steps.informations.${key}`;
                }
                key = key.replace(/^page\./, 'page.event-edit.');
            } else {
                key = key.replace(/^global\./, '');
            }
            return this.$t(key, params, count);
        },
    },
    render() {
        const {
            __,
            duration,
            data,
            defaultColor,
            canSyncPeriods,
            shouldSyncPeriods,
            allowBillingToggling,
            isReturnInventoryDone,
            isDepartureInventoryDone,
            operationPeriodIsFullDays,
            hasAssignmentCriticalImpactingChange,
            readonlyMobilizationPeriodWarning,
            technicianTransferWarning,
            validationErrors,
            handleChange,
            handleSubmit,
            handleSyncPeriodsChange,
            handleOperationPeriodChange,
        } = this;

        return (
            <form class="EventEditStepInfos" onSubmit={handleSubmit}>
                <Fieldset>
                    <FormField
                        label="title"
                        v-model={data.title}
                        onInput={handleChange}
                        error={validationErrors?.title}
                        required
                    />
                    <div class="EventEditStepInfos__operation-period">
                        <div class="EventEditStepInfos__operation-period__dates">
                            <FormField
                                label={__('operation-period')}
                                type={(
                                    (data.operation_period?.isFullDays ?? operationPeriodIsFullDays)
                                        ? 'date' : 'datetime'
                                )}
                                v-model={data.operation_period}
                                error={validationErrors?.operation_period}
                                onChange={handleOperationPeriodChange}
                                withFullDaysToggle
                                withoutMinutes
                                required
                                range
                            />
                        </div>
                        {(duration !== undefined && duration > 0) && (
                            <div class="EventEditStepInfos__operation-period__duration">
                                {__('global.duration-days', { duration }, duration)}
                            </div>
                        )}
                    </div>
                    {canSyncPeriods && (
                        <FormField
                            type="switch"
                            label={__('sync-mobilization-period')}
                            value={shouldSyncPeriods}
                            onChange={handleSyncPeriodsChange}
                            required
                        />
                    )}
                    {(!canSyncPeriods || !shouldSyncPeriods) && (
                        <FormField
                            label={__('mobilization-period')}
                            help={__('mobilization-period-help')}
                            type="datetime"
                            v-model={data.mobilization_period}
                            error={validationErrors?.mobilization_period}
                            readonly={((): boolean | 'start' | 'end' => {
                                if (!isDepartureInventoryDone && !isReturnInventoryDone) {
                                    return false;
                                }
                                if (isDepartureInventoryDone && isReturnInventoryDone) {
                                    return true;
                                }
                                return isDepartureInventoryDone ? 'start' : 'end';
                            })()}
                            minDate={(
                                isDepartureInventoryDone
                                    ? data.mobilization_period?.start
                                    : undefined
                            )}
                            maxDate={(
                                isReturnInventoryDone
                                    ? data.mobilization_period?.end
                                    : undefined
                            )}
                            onChange={handleChange}
                            required
                            range
                        />
                    )}
                    {readonlyMobilizationPeriodWarning !== null && (
                        <Alert
                            type="info"
                            class={[
                                'EventEditStepInfos__warning',
                                'EventEditStepInfos__warning--mobilization-period-readonly',
                            ]}
                        >
                            {readonlyMobilizationPeriodWarning}
                        </Alert>
                    )}
                    {technicianTransferWarning !== null && (
                        <Alert
                            type={hasAssignmentCriticalImpactingChange ? 'warning' : 'info'}
                            class={[
                                'EventEditStepInfos__warning',
                                'EventEditStepInfos__warning--technician-transfer',
                            ]}
                        >
                            {technicianTransferWarning}
                        </Alert>
                    )}
                </Fieldset>
                <Fieldset title={__('global.event-details')}>
                    <FormField
                        label="location"
                        v-model={data.location}
                        class="EventEditStepInfos__location"
                        onInput={handleChange}
                        error={validationErrors?.location}
                    />
                    <FormField
                        label="description"
                        type="textarea"
                        v-model={data.description}
                        class="EventEditStepInfos__description"
                        onInput={handleChange}
                        error={validationErrors?.description}
                    />
                    {allowBillingToggling && (
                        <div class="EventEditStepInfos__is-billable">
                            <FormField
                                label="is-billable"
                                type="switch"
                                v-model={data.is_billable}
                                class="EventEditStepInfos__is-billable__input"
                                onChange={handleChange}
                                error={validationErrors?.is_billable}
                            />
                            <div class="EventEditStepInfos__is-billable__help">
                                <i class="fas fa-arrow-right" />&nbsp;
                                {data.is_billable && __('global.is-billable-help')}
                                {!data.is_billable && __('global.is-not-billable-help')}
                            </div>
                        </div>
                    )}
                </Fieldset>
                <Fieldset title={__('global.customization')}>
                    <FormField
                        label={__('color-on-calendar')}
                        type="color"
                        v-model={data.color}
                        class="EventEditStepInfos__color"
                        placeholder={defaultColor}
                        onChange={handleChange}
                        error={validationErrors?.color}
                    />
                </Fieldset>
                <section class="EventEditStepInfos__actions">
                    <Button
                        htmlType="submit"
                        type="primary"
                        icon={{ name: 'arrow-right', position: 'after' }}
                    >
                        {__('page.save-and-go-to-next-step')}
                    </Button>
                </section>
            </form>
        );
    },
});

export default EventEditStepInfos;
