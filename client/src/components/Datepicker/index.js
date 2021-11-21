import './index.scss';
import moment from 'moment';
import { defineComponent } from '@vue/composition-api';
import Datepicker from 'vue2-datepicker';
import * as langs from './locale';

// @vue/component
export default defineComponent({
    name: 'Datepicker',
    props: {
        value: { type: [Date, Array], default: undefined },
        withTime: { type: Boolean, default: false },
        isRange: { type: Boolean, default: false },
        isClearable: { type: Boolean, default: false },
        displayFormat: { type: String, default: 'LL' },
        placeholder: { type: String, default: undefined },
        disabledDates: { type: Object, default: undefined },
    },
    data() {
        const { locale } = this.$store.state.i18n;

        return {
            lang: langs[locale] || undefined,
            formatter: {
                stringify: (date, format) => (date ? moment(date).format(format) : ''),
            },
        };
    },
    methods: {
        handleInput(newValue) {
            this.$emit('input', newValue);
        },

        getDisabledDates(chosenDate) {
            if (!this.disabledDates) {
                return false;
            }

            const { from, to, notBetween } = this.disabledDates;
            const date = moment(chosenDate);

            if (Array.isArray(notBetween) && notBetween.length === 2) {
                const [start, end] = notBetween;
                return date.isBefore(start, 'day') || date.isAfter(end, 'day');
            }

            if (from && to) {
                return date.isAfter(from, 'day') && date.isBefore(to, 'day');
            }

            if (from) {
                return date.isAfter(from, 'day');
            }

            if (to) {
                return date.isBefore(to, 'day');
            }

            return false;
        },
    },
    render() {
        const { $t: __, $props, lang, formatter, handleInput, getDisabledDates } = this;
        const { value, withTime, isRange, isClearable, displayFormat, placeholder } = $props;

        return (
            <Datepicker
                value={value}
                type={withTime ? 'datetime' : 'date'}
                range={isRange}
                lang={lang}
                onInput={handleInput}
                minuteStep={15}
                showSecond={false}
                showTimeHeader={withTime}
                clearable={isClearable}
                placeholder={placeholder}
                formatter={formatter}
                format={withTime ? `${displayFormat} HH:mm` : displayFormat}
                disabledDate={getDisabledDates}
                rangeSeparator=" ⇒ "
                confirm={withTime}
                confirmText={__('done')}
            />
        );
    },
});
