import './index.scss';
import Color from '@/utils/color';
import ClickOutside from 'vue-click-outside';
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
import { MountingPortal as Portal } from 'portal-vue';
import { defineComponent } from '@vue/composition-api';
import ColorPicker from '@/themes/default/components/ColorPicker';

import type { PropType } from '@vue/composition-api';
import type { RawColor } from '@/utils/color';

type Props = {
    /**
     * Le nom du champ (attribut `[name]`).
     *
     * Ceci permettra notamment de récupérer la valeur du champ dans
     * le jeu de données d'un formulaire parent lors de la soumission
     * (`submit`) de celui-ci.
     */
    name?: string,

    /**
     * Valeur actuelle (= couleur) du champ.
     *
     * Peut-être fournie en différent formats:
     * - Une chaîne de caractère représentant une couleur (e.g. `#ffffff`, `rgb(255, 255, 255)`, etc.)
     * - Un objet littéral représentant une couleur (e.g. `{ r: 255, g: 255, b: 255, a: 0.5 }`)
     * - Une instance de `Color` (e.g. `new Color('#ffffff')`).
     * - La valeur `null` si le champ est "vide".
     */
    value: Color | RawColor | null,

    /**
     * Couleur "placeholder" utilisée lorsque le champ n'est pas remplie (= `value` à `null`).
     *
     * Cela peut correspondre par exemple à la couleur utilisée
     * en l'absence de surcharge de ce champ par l'utilisateur.
     *
     * Peut-être fournie en différent formats:
     * - Une chaîne de caractère représentant une couleur (e.g. `#ffffff`, `rgb(255, 255, 255)`, etc.)
     * - Un objet littéral représentant une couleur (e.g. `{ r: 255, g: 255, b: 255, a: 0.5 }`)
     * - Une instance de `Color` (e.g. `new Color('#ffffff')`).
     *
     * Si non spécifié, un damier barré sera utilisé.
     */
    placeholder?: Color | RawColor,

    /** Le champ est-il désactivé ? */
    disabled?: boolean,

    /** Le champ doit-il être marqué comme invalide ? */
    invalid?: boolean,
};

type InstanceProperties = {
    cancelPickerPositionUpdater: (() => void) | undefined,
};

type Data = {
    currentColor: Color | null,
    showPicker: boolean,
    pickerPosition: Position,
};

/** Un champ de formulaire permettant de choisir une couleur. */
const InputColor = defineComponent({
    name: 'InputColor',
    directives: { ClickOutside },
    inject: {
        'input.invalid': { default: { value: false } },
        'input.disabled': { default: { value: false } },
    },
    props: {
        name: {
            type: String as PropType<Required<Props>['name']>,
            default: undefined,
        },
        value: {
            type: null as unknown as PropType<Required<Props>['value']>,
            required: true,
            validator: (value: unknown | null) => (
                value === null || Color.isValid(value)
            ),
        },
        placeholder: {
            type: null as unknown as PropType<Props['placeholder']>,
            default: undefined,
            validator: (value: unknown | null) => (
                value === null || Color.isValid(value)
            ),
        },
        disabled: {
            type: Boolean as PropType<Props['disabled']>,
            default: undefined,
        },
        invalid: {
            type: Boolean as PropType<Props['invalid']>,
            default: undefined,
        },
    },
    emits: ['input', 'change'],
    setup: (): InstanceProperties => ({
        cancelPickerPositionUpdater: undefined,
    }),
    data: (): Data => ({
        currentColor: null,
        showPicker: false,
        pickerPosition: { x: 0, y: 0 },
    }),
    computed: {
        inheritedInvalid(): boolean {
            if (this.invalid !== undefined) {
                return this.invalid;
            }

            // @ts-expect-error -- Normalement fixé lors du passage à Vue 3 (et son meilleur typage).
            // @see https://github.com/vuejs/core/pull/6804
            return this['input.invalid'].value;
        },

        inheritedDisabled(): boolean {
            if (this.disabled !== undefined) {
                return this.disabled;
            }

            // @ts-expect-error -- Normalement fixé lors du passage à Vue 3 (et son meilleur typage).
            // @see https://github.com/vuejs/core/pull/6804
            return this['input.disabled'].value;
        },

        color(): Color | null {
            if (!this.inheritedDisabled && this.currentColor !== null) {
                return this.currentColor;
            }

            if (this.value === null || !Color.isValid(this.value)) {
                return null;
            }

            return !(this.value instanceof Color)
                ? new Color(this.value)
                : this.value;
        },

        placeholderColor(): Color | null {
            if (!this.placeholder || !Color.isValid(this.placeholder)) {
                return null;
            }

            return !(this.placeholder instanceof Color)
                ? new Color(this.placeholder)
                : this.placeholder;
        },

        formattedValue(): string | undefined {
            return this.color?.toString();
        },

        formattedPlaceholder(): string | undefined {
            return this.placeholderColor?.toString();
        },
    },
    watch: {
        value() {
            this.currentColor = null;
        },

        inheritedDisabled(disabled: boolean) {
            if (disabled) {
                this.showPicker = false;
                this.currentColor = null;
            }
        },
    },
    mounted() {
        this.registerPickerPositionUpdater();
    },
    updated() {
        this.registerPickerPositionUpdater();
    },
    beforeDestroy() {
        this.cleanupPickerPositionUpdater();
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleFieldClick() {
            if (this.inheritedDisabled) {
                return;
            }
            this.showPicker = true;
        },

        handleChange(color: Color) {
            if (this.inheritedDisabled) {
                return;
            }
            this.currentColor = color;
        },

        handlePickerClose(e: Event) {
            if (this.inheritedDisabled || !this.showPicker) {
                return;
            }

            // - Si c'est un click sur le champ, on ignore.
            const $field = this.$refs.field as HTMLDivElement;
            if ($field.contains(e.target as Element)) {
                return;
            }

            this.showPicker = false;

            if (this.currentColor !== null) {
                this.$emit('input', this.currentColor.toString());
                this.$emit('change', this.currentColor.toString());
            }
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        async updatePickerPosition(): Promise<void> {
            const $field = this.$refs.field as HTMLDivElement;
            const $picker = this.$refs.picker as HTMLDivElement | undefined;

            if (!this.showPicker || !$picker) {
                return;
            }

            const oldPosition = { ...this.pickerPosition };
            const newPosition = await computePosition($field, $picker, {
                placement: 'bottom',
                middleware: [flip(), shift(), offset(10)],
            });

            if (newPosition.x === oldPosition.x && newPosition.y === oldPosition.y) {
                return;
            }

            this.pickerPosition = { x: newPosition.x, y: newPosition.y };
        },

        cleanupPickerPositionUpdater() {
            if (typeof this.cancelPickerPositionUpdater === 'function') {
                this.cancelPickerPositionUpdater();
                this.cancelPickerPositionUpdater = undefined;
            }
        },

        registerPickerPositionUpdater() {
            this.cleanupPickerPositionUpdater();

            const $field = this.$refs.field as HTMLDivElement | undefined;
            const $picker = this.$refs.picker as HTMLDivElement | undefined;
            if ($field && $picker) {
                this.cancelPickerPositionUpdater = autoUpdate(
                    $field,
                    $picker,
                    this.updatePickerPosition.bind(this),
                );
            }
        },
    },
    render() {
        const {
            name,
            color,
            showPicker,
            pickerPosition,
            placeholderColor,
            formattedValue,
            formattedPlaceholder,
            inheritedInvalid: invalid,
            inheritedDisabled: disabled,
            handleChange,
            handleFieldClick,
            handlePickerClose,
        } = this;
        const hasColor = color !== null || placeholderColor !== null;

        const className = ['InputColor', {
            'InputColor--empty': !hasColor,
            'InputColor--invalid': invalid,
            'InputColor--disabled': disabled,
        }];

        return (
            <div
                class={className}
                style={{
                    '--InputColor--value': formattedValue,
                    '--InputColor--placeholder': formattedPlaceholder,
                }}
            >
                <div ref="field" class="InputColor__field" onClick={handleFieldClick}>
                    <div class="InputColor__field__preview" />
                    {(!!name && !disabled) && (
                        <input type="hidden" name={name} value={formattedValue ?? ''} />
                    )}
                </div>
                {showPicker && (
                    <Portal mountTo="#app" append>
                        <div
                            ref="picker"
                            class="InputColor__picker"
                            v-clickOutside={handlePickerClose}
                            style={{
                                left: `${pickerPosition.x}px`,
                                top: `${pickerPosition.y}px`,
                            }}
                        >
                            <ColorPicker
                                value={color ?? placeholderColor}
                                onChange={handleChange}
                                alphaMode="none"
                            />
                        </div>
                    </Portal>
                )}
            </div>
        );
    },
});

export default InputColor;
