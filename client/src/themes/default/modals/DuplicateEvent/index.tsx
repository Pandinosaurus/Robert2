import './index.scss';
import axios from 'axios';
import config from '@/globals/config';
import apiEvents from '@/stores/api/events';
import FormField from '@/themes/default/components/FormField';
import Icon from '@/themes/default/components/Icon';
import Button from '@/themes/default/components/Button';
import Alert from '@/themes/default/components/Alert';
import { ApiErrorCode } from '@/stores/api/@codes';
import { defineComponent } from '@vue/composition-api';

import type Period from '@/utils/period';
import type { PropType } from '@vue/composition-api';
import type { EventDetails, EventMaterial } from '@/stores/api/events';
import type { Beneficiary } from '@/stores/api/beneficiaries';

type Props = {
    /** L'événement à dupliquer. */
    event: EventDetails,
};

type Data = {
    isSaving: boolean,
    operationPeriod: Period | null,
    operationPeriodIsFullDays: boolean,
    shouldKeepBillingData: boolean,
    shouldSyncPeriods: boolean,
    mobilizationPeriod: Period | null,
    validationErrors: Record<string, string> | null,
};

/** Modale de duplication d'un événement. */
const DuplicateEvent = defineComponent({
    name: 'DuplicateEvent',
    modal: {
        width: 700,
        draggable: true,
        clickToClose: false,
    },
    provide: {
        verticalForm: true,
    },
    props: {
        event: {
            type: Object as PropType<Props['event']>,
            required: true,
        },
    },
    emits: ['close'],
    data: (): Data => ({
        isSaving: false,
        operationPeriod: null,
        operationPeriodIsFullDays: true,
        shouldKeepBillingData: false,
        shouldSyncPeriods: true,
        mobilizationPeriod: null,
        validationErrors: null,
    }),
    computed: {
        duration(): number | null {
            return this.operationPeriod?.asDays() ?? null;
        },

        itemsCount(): number {
            const { materials } = this.event;

            return materials.reduce(
                (total: number, material: EventMaterial) => (
                    total + material.quantity
                ),
                0,
            );
        },

        hasBeneficiaries(): boolean {
            return this.event.beneficiaries.length > 0;
        },

        canKeepBillingData(): boolean {
            if (!this.event.is_billable) {
                return false;
            }

            // - On ne peut pas dupliquer un événement dans une devise différente de la devise globale
            //   actuelle en conservant les données de facturation de l'ancien événement car il va être
            //   impossible de récupérer les prix de remplacement dans la devise de l'événement d'origine.
            //   (et les prix de remplacement ne sont pas conservés d'une duplication à une autre, ces
            //   données doivent toujours être à jour)
            return this.event.currency.isSame(config.currency);
        },

        beneficiariesNames(): string[] {
            const { beneficiaries } = this.event;

            return beneficiaries.map(({ company, full_name: fullName }: Beneficiary) => (
                `${fullName}${company ? ` (${company.legal_name})` : ''}`
            ));
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

            if (this.shouldSyncPeriods) {
                this.mobilizationPeriod = operationPeriod?.setFullDays(false) ?? null;
            }
        },

        handleKeepBillingDataChange(shouldKeep: boolean) {
            this.shouldKeepBillingData = shouldKeep;
        },

        handleSyncPeriodsChange(shouldSync: boolean) {
            this.shouldSyncPeriods = shouldSync;

            if (shouldSync) {
                this.mobilizationPeriod = this.operationPeriod
                    ?.setFullDays(false) ?? null;
            }
        },

        handleSubmit(e: SubmitEvent) {
            e?.preventDefault();

            this.save();
        },

        handleClose() {
            this.$emit('close');
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        async save() {
            if (this.isSaving) {
                return;
            }

            const {
                __,
                operationPeriod,
                mobilizationPeriod,
                shouldKeepBillingData,
            } = this;

            if (!operationPeriod) {
                this.validationErrors = {
                    operation_period: __('please-choose-dates'),
                };
                return;
            }
            if (!mobilizationPeriod) {
                this.validationErrors = {
                    mobilization_period: __('please-choose-dates'),
                };
                return;
            }

            this.isSaving = true;
            const { event: { id } } = this;

            try {
                const newEvent = await apiEvents.duplicate(id, {
                    operation_period: operationPeriod,
                    mobilization_period: mobilizationPeriod,
                    keepBillingData: shouldKeepBillingData,
                });

                this.$toasted.success(__('new-event-saved'));
                this.validationErrors = null;
                this.$emit('close', newEvent);
            } catch (error) {
                this.isSaving = false;

                if (axios.isAxiosError(error)) {
                    const { code, details } = error.response?.data?.error || { code: ApiErrorCode.UNKNOWN, details: {} };
                    if (code === ApiErrorCode.VALIDATION_FAILED) {
                        this.validationErrors = { ...details };
                        return;
                    }
                }
                this.$toasted.error(__('global.errors.unexpected-while-saving'));
            }
        },

        __(key: string, params?: Record<string, number | string>, count?: number): string {
            key = !key.startsWith('global.')
                ? `modal.duplicate-event.${key}`
                : key.replace(/^global\./, '');

            return this.$t(key, params, count);
        },
    },
    render() {
        const { title, location, technicians } = this.event;
        const {
            __,
            duration,
            itemsCount,
            hasBeneficiaries,
            beneficiariesNames,
            canKeepBillingData,
            validationErrors,
            isSaving,
            shouldSyncPeriods,
            shouldKeepBillingData,
            operationPeriodIsFullDays,
            handleClose,
            handleSubmit,
            handleSyncPeriodsChange,
            handleOperationPeriodChange,
            handleKeepBillingDataChange,
        } = this;

        return (
            <div class="DuplicateEvent">
                <div class="DuplicateEvent__header">
                    <h2 class="DuplicateEvent__header__title">
                        {__('title', { title })}
                    </h2>
                    <Button
                        type="close"
                        class="DuplicateEvent__header__close-button"
                        onClick={handleClose}
                    />
                </div>
                <div class="DuplicateEvent__body">
                    <form onSubmit={handleSubmit}>
                        <FormField
                            type={(
                                (this.operationPeriod?.isFullDays ?? operationPeriodIsFullDays)
                                    ? 'date' : 'datetime'
                            )}
                            label={__('operation-period')}
                            v-model={this.operationPeriod}
                            error={validationErrors?.operation_period}
                            onChange={handleOperationPeriodChange}
                            withFullDaysToggle
                            withoutMinutes
                            minDate="now"
                            required
                            range
                        />
                        <FormField
                            type="switch"
                            label={__('sync-mobilization-period')}
                            value={shouldSyncPeriods}
                            onChange={handleSyncPeriodsChange}
                            required
                        />
                        {!shouldSyncPeriods && (
                            <FormField
                                label={__('mobilization-period')}
                                help={__('mobilization-period-help')}
                                type="datetime"
                                v-model={this.mobilizationPeriod}
                                error={validationErrors?.mobilization_period}
                                required
                                range
                            />
                        )}
                        {canKeepBillingData && (
                            <FormField
                                type="switch"
                                label={__('keep-billing-data')}
                                value={shouldKeepBillingData}
                                onChange={handleKeepBillingDataChange}
                                required
                            />
                        )}
                    </form>
                    <div class="DuplicateEvent__data">
                        {(technicians.length > 0) && (
                            <Alert
                                type="warning"
                                class={[
                                    'DuplicateEvent__warning',
                                    'DuplicateEvent__warning--technician-transfer',
                                ]}
                            >
                                {__('technician-transfer-warning')}
                            </Alert>
                        )}
                        <div class="DuplicateEvent__infos">
                            <div class="DuplicateEvent__infos__item">
                                <Icon name="clock" class="DuplicateEvent__infos__item__icon" />
                                <span class="DuplicateEvent__infos__item__content">
                                    {(
                                        duration !== null
                                            ? __('global.duration-days', { duration }, duration)
                                            : `${__('global.duration')} ?`
                                    )}
                                </span>
                            </div>
                            {location && (
                                <div class="DuplicateEvent__infos__item">
                                    <Icon name="map-marker-alt" class="DuplicateEvent__infos__item__icon" />
                                    <span class="DuplicateEvent__infos__item__content">
                                        {__('global.in', { location })}
                                    </span>
                                </div>
                            )}
                            {!hasBeneficiaries && (
                                <div class="DuplicateEvent__infos__item DuplicateEvent__infos__item--empty">
                                    <Icon name="address-book" class="DuplicateEvent__infos__item__icon" />
                                    <span class="DuplicateEvent__infos__item__content">
                                        {__('global.@event.warning-no-beneficiary')}
                                    </span>
                                </div>
                            )}
                            {hasBeneficiaries && (
                                <div class="DuplicateEvent__infos__item">
                                    <Icon name="address-book" class="DuplicateEvent__infos__item__icon" />
                                    <span class="DuplicateEvent__infos__item__content">
                                        {__('global.for', { beneficiary: beneficiariesNames.join(', ') })}
                                    </span>
                                </div>
                            )}
                            <div class="DuplicateEvent__infos__item">
                                <Icon name="box" class="DuplicateEvent__infos__item__icon" />
                                <span class="DuplicateEvent__infos__item__content">
                                    {__('global.materials-count', { count: itemsCount }, itemsCount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="DuplicateEvent__footer">
                    <Button type="primary" onClick={handleSubmit} loading={isSaving}>
                        {__('global.duplicate-event')}
                    </Button>
                    <Button onClick={handleClose}>
                        {__('global.cancel')}
                    </Button>
                </div>
            </div>
        );
    },
});

export default DuplicateEvent;
