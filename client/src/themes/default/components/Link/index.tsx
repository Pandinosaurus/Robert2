import './index.scss';
import { defineComponent } from '@vue/composition-api';
import Fragment from '@/components/Fragment';
import Icon from '@/themes/default/components/Icon';

import type { Location } from 'vue-router';
import type { TooltipOptions } from 'v-tooltip';
import type { PropType } from '@vue/composition-api';
import type {
    Props as IconProps,
    Variant as IconVariant,
} from '@/themes/default/components/Icon';

type Props = {
    /**
     * La cible du lien sous forme de chaîne ou d'objet `Location` compatible avec Vue-Router.
     *
     * Si non définie, un élément HTML `<button>` sera utilisé et
     * vous devriez écouter l'événement `onClick` pour réagir au click.
     */
    to?: string | Location,

    /**
     * L'icône à utiliser avant le texte du lien.
     *
     * Doit contenir une chaîne de caractère avec les composantes suivantes séparées par `:`:
     * - Le nom de l'icône sous forme de chaîne (e.g. `plus`, `wrench`)
     *   Pour une liste exhaustive des codes, voir: https://fontawesome.com/v5.15/icons?m=free
     * - La variante à utiliser de l'icône à utiliser (`solid`, `regular`, ...).
     *
     * @example
     * - `wrench`
     * - `wrench:solid`
     */
    icon?: string | `${string}:${Required<IconProps>['variant']}`,

    /**
     * Le contenu d'une éventuelle infobulle qui sera affichée au survol du lien.
     *
     * La valeur peut avoir deux formats différents:
     * - Une chaîne de caractère: Celle-ci sera utilisée pour le contenu de l'infobulle
     *   qui sera elle-même affichée centrée en dessous du lien au survol.
     * - Un object de configuration contenant les clés:
     *   - `content`: Le texte affiché dans l'infobulle.
     *   - `placement`: La position de l'infobulle par rapport au lien.
     *                  (e.g. `top`, `bottom`, `left`, `right`, ...)
     */
    tooltip?: string | TooltipOptions,

    /**
     * Permet d'indiquer que c'est un lien externe.
     *
     * Si c'est le cas, le component fonctionnera comme suit:
     * - Le routing interne ("Vue Router"), ne sera pas utilisé.
     *   (Il ne faut donc pas passer d'objet à `to` mais bien une chaîne)
     * - Si c'est une URL absolue, celle-ci s'ouvrira dans une autre fenêtre / onglet.
     */
    external?: boolean,
};

/** Une lien. */
const Link = defineComponent({
    name: 'Link',
    props: {
        to: {
            type: [String, Object] as PropType<Props['to']>,
            default: undefined,
        },
        icon: {
            type: String as PropType<Props['icon']>,
            default: undefined,
        },
        tooltip: {
            type: [String, Object] as PropType<Props['tooltip']>,
            default: undefined,
        },
        external: {
            type: Boolean as PropType<Required<Props>['external']>,
            default: false,
        },
    },
    emits: ['click'],
    computed: {
        normalizedIcon(): IconProps | null {
            if (!this.icon) {
                return null;
            }

            if (!this.icon.includes(':')) {
                return { name: this.icon };
            }

            const [iconType, variant] = this.icon.split(':');
            return { name: iconType, variant: variant as IconVariant };
        },

        normalizedTooltip(): TooltipOptions | string | undefined {
            return typeof this.tooltip === 'object'
                ? { ...this.tooltip, content: this.tooltip.content }
                : this.tooltip;
        },
    },
    methods: {
        handleClick(event: MouseEvent) {
            this.$emit('click', event);
        },
    },
    render() {
        const children = this.$slots.default;
        const {
            normalizedIcon: icon,
            normalizedTooltip: tooltip,
            to,
            external,
            handleClick,
        } = this;

        const content = (
            <Fragment>
                {icon && <Icon {...{ props: icon } as any} class="Link__icon" />}
                {children && <span class="Link__content">{children}</span>}
            </Fragment>
        );

        if (to) {
            if (external) {
                const isOutside = typeof to === 'string' && to.includes('://');

                return (
                    <a
                        href={to}
                        class="Link"
                        v-tooltip={tooltip}
                        target={isOutside ? '_blank' : undefined}
                        rel={isOutside ? 'noreferrer noopener' : undefined}
                    >
                        {content}
                    </a>
                );
            }

            return (
                <router-link to={to} custom>
                    {({ href, navigate: handleNavigate }: any) => (
                        <a
                            href={href}
                            onClick={handleNavigate}
                            v-tooltip={tooltip}
                            class="Link"
                        >
                            {content}
                        </a>
                    )}
                </router-link>
            );
        }

        return (
            <button
                type="button"
                class="Link"
                v-tooltip={tooltip}
                onClick={handleClick}
            >
                {content}
            </button>
        );
    },
});

export default Link;
