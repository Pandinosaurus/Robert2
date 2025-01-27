import '../index.scss';
import clsx from 'clsx';
import { defineComponent } from '@vue/composition-api';
import generateUniqueId from 'lodash/uniqueId';
import { initColumnsDisplay } from '../@utils';
import { defaultSearcher } from './_utils';
import { Variant } from '../@constants';

import type { ClassValue } from 'clsx';
import type { CreateElement } from 'vue';
import type { PropType } from '@vue/composition-api';
import type { Column, Columns } from './_types';
import type { ColumnsDisplay } from '../@utils';
import type {
    ColumnSorter,
    ColumnSearcher,
    ClientTableOptions,
    ClientTableInstance,
    ColumnsVisibility,
    RowClickEventPayload,
} from 'vue-tables-2-premium';
import type {
    OrderBy,
    RenderFunction,
    RenderedColumn,
} from '../@types';

export type Props<Datum = any, TColumns extends Columns<Datum> = Columns<Datum>> = {
    /**
     * Nom unique du tableau.
     *
     * Si cette prop. est passée, l'état du tableau sera persisté pour que
     * l'utilisateur puisse le récupérer dans le même état la prochaine fois.
     * (on parle ici des colonnes affichées, du tri, etc.)
     */
    name?: string | undefined,

    /**
     * Les colonnes du tableau.
     *
     * Cette prop. doit contenir un tableau d'objets, chaque objet
     * représentant une colonne avec les informations permettant
     * d'afficher son header, de formater son contenu, etc.
     *
     * Voir {@see {@link Column}} pour le format des données des colonnes.
     */
    columns: TColumns,

    /** Les données du tableau. */
    data: Datum[],

    /**
     * Le nom de la clé contenant l'identifiant unique de chaque
     * ligne dans le jeu de données.
     *
     * @default 'id'
     */
    uniqueKey?: string,

    /**
     * Variante de la présentation du tableau.
     *
     * Valeur acceptées:
     * - `default`: Variante par défaut.
     * - `minimalist`: Présentation minimaliste, sans fond ni séparateurs.
     */
    variant?: Variant,

    /** Permet d'activer ou de désactiver la pagination. */
    paginated?: boolean,

    /** Permet d'activer ou de désactiver le redimensionnement du tableau. */
    resizable?: boolean,

    /**
     * L'ordre dans lequel le tableau doit être triée initialement.
     *
     * Peut contenir:
     * - Soit un object avec la colonne et le sens dans lequel cette
     *   colonne doit être triée ({@see {@link OrderBy}}).
     * - Soit le nom de la colonne qui sera triée de façon ascendante.
     *
     * Si cette prop. n'est pas passée, le tableau conservera son tri initial.
     */
    defaultOrderBy?: OrderBy<TColumns> | OrderBy<TColumns>['column'],

    /**
     * Classe(s) qui seront ajoutées aux lignes du tableau.
     *
     * Différents formats sont acceptés:
     * - Les formats acceptés par défaut par Vue pour les classes.
     *   ({@see {@link ClassValue}})
     * - Une fonction a qui le jeu de données de chaque ligne sera passé
     *   et qui devra renvoyer des classes dans les formats acceptés par
     *   Vue (cf. ci-dessus).
     */
    rowClass?: ClassValue | ((row: Datum) => ClassValue),

    /**
     * Le sélecteur des colonnes affichés doit-il être affiché ?
     *
     * Si cette valeur n'est pas explicitement passée, le fait d'utiliser
     * un nom pour le tableau activera le sélecteur de colonnes et la
     * persistence de l'état du tableau. Dans les autres cas, le sélecteur
     * ne sera pas visible.
     */
    withColumnsSelector?: boolean,
};

type InstanceProperties = {
    uniqueId: string | undefined,
};

/**
 * Un tableau dont les données sont passés à l'initialisation.
 *
 * Si vous avez besoin de récupérer les données de manière asynchrone,
 * utilisez plutôt `<ServerTable />`.
 */
const ClientTable = defineComponent({
    name: 'ClientTable',
    props: {
        name: {
            type: String as PropType<Props['name']>,
            default: undefined,
        },
        columns: {
            type: Array as PropType<Props['columns']>,
            required: true,
        },
        uniqueKey: {
            type: String as PropType<Required<Props>['uniqueKey']>,
            default: 'id',
        },
        data: {
            type: Array as PropType<Props['data']>,
            required: true,
        },
        variant: {
            type: String as PropType<Required<Props>['variant']>,
            default: Variant.DEFAULT,
            validator: (value: unknown) => (
                typeof value === 'string' &&
                Object.values(Variant).includes(value as any)
            ),
        },
        paginated: {
            type: Boolean as PropType<Required<Props>['paginated']>,
            default: true,
        },
        resizable: {
            type: Boolean as PropType<Required<Props>['resizable']>,
            default: true,
        },
        defaultOrderBy: {
            type: [Object, String] as PropType<Props['defaultOrderBy']>,
            default: undefined,
        },
        rowClass: {
            type: [
                String,
                Number,
                Array,
                Boolean,
                Object,
                Function,
            ] as PropType<Props['rowClass']>,
            default: undefined,
        },
        withColumnsSelector: {
            type: Boolean as PropType<Props['withColumnsSelector']>,
            default: undefined,
        },
    },
    emits: ['rowClick'],
    setup: (): InstanceProperties => ({
        uniqueId: undefined,
    }),
    computed: {
        columnsKeys(): Array<Column['key']> {
            return this.columns.map(({ key }: Column) => key);
        },

        columnsRenders(): Record<Column['key'], RenderFunction> {
            return this.columns.reduce(
                (acc: Record<Column['key'], RenderFunction>, column: Column) => {
                    const rawRenderColumn = column.render;
                    if (undefined === rawRenderColumn) {
                        return acc;
                    }

                    return {
                        ...acc,
                        [column.key]: (h: CreateElement, row: any, index: number): RenderedColumn => {
                            const renderedColumn = rawRenderColumn(h, row, index);

                            return column.key === 'actions'
                                ? <div class="Table__cell__actions">{renderedColumn}</div>
                                : renderedColumn;
                        },
                    };
                },
                {},
            );
        },

        columnsHeadings(): Record<Column['key'], string> {
            return this.columns.reduce(
                (acc: Record<Column['key'], string>, { key, title }: Column) => (
                    { ...acc, [key]: title }
                ),
                {},
            );
        },

        columnsClasses(): Record<Column['key'], string> {
            return this.columns.reduce(
                (acc: Record<Column['key'], string>, column: Column) => {
                    const columnClass = ['Table__cell', {
                        'Table__cell--actions': column.key === 'actions',
                    }];
                    return { ...acc, [column.key]: `${clsx(columnClass, column.class)} ` };
                },
                {},
            );
        },

        columnsSortable(): Array<Column['key']> {
            return this.columns
                .filter(({ sortable }: Column) => !!sortable)
                .map(({ key }: Column) => key);
        },

        columnsSorting(): Record<string, ColumnSorter> {
            return this.columns
                .filter(({ sortable }: Column) => !!sortable)
                .reduce(
                    (acc: Record<Column['key'], ColumnSorter>, column: Column) => {
                        const columnSorter = typeof column.sortable === 'function'
                            ? column.sortable
                            : undefined;

                        return columnSorter !== undefined
                            ? { ...acc, [column.key]: columnSorter }
                            : acc;
                    },
                    {},
                );
        },

        columnsSearchable(): Array<Column['key']> {
            return this.columns
                .filter(({ searchable }: Column) => !!searchable)
                .map(({ key }: Column) => key);
        },

        columnsSearches(): Record<string, ColumnSearcher> {
            return this.columns
                .filter(({ searchable }: Column) => !!searchable)
                .reduce(
                    (acc: Record<Column['key'], ColumnSearcher>, column: Column) => {
                        const columnSearcher = typeof column.searchable === 'function'
                            ? column.searchable
                            : defaultSearcher(column.key);

                        const searcher = (row: unknown, query: unknown): boolean => {
                            if (typeof query !== 'string' || query.length < 1) {
                                return false;
                            }
                            return columnSearcher(row, query);
                        };
                        return { ...acc, [column.key]: searcher };
                    },
                    {},
                );
        },

        columnsDisplay(): ColumnsVisibility {
            const columnsDisplay = this.columns.reduce(
                (acc: ColumnsDisplay, column: Column) => {
                    const visible = !(column.hidden ?? false);
                    return { ...acc, [column.key]: visible };
                },
                {},
            );
            return initColumnsDisplay(this.name, columnsDisplay);
        },

        shouldPersistState(): boolean {
            return this.name !== undefined;
        },

        withColumnsSelectorInferred(): boolean {
            const { shouldPersistState, withColumnsSelector } = this;
            return withColumnsSelector ?? shouldPersistState;
        },

        options(): ClientTableOptions {
            const {
                uniqueKey,
                rowClass,
                paginated,
                resizable,
                defaultOrderBy,
                columnsHeadings,
                columnsClasses,
                columnsDisplay,
                columnsSortable,
                columnsSearchable,
                columnsSearches,
                columnsSorting,
                columnsRenders,
                shouldPersistState,
                withColumnsSelectorInferred: withColumnsSelector,
            } = this;

            const options: ClientTableOptions = {
                uniqueKey,
                columnsDropdown: withColumnsSelector,
                preserveState: shouldPersistState,
                saveState: shouldPersistState,
                sortable: columnsSortable,
                filterable: (
                    columnsSearchable.length > 0
                        ? columnsSearchable
                        : false
                ),
                headings: columnsHeadings,
                templates: columnsRenders,
                customSorting: columnsSorting,
                filterByColumn: false,
                filterAlgorithm: columnsSearches,
                resizableColumns: resizable,
                pagination: { show: paginated },
                columnsDisplay,
                columnsClasses,
                rowClassCallback: (row: any): ClassValue => (
                    clsx('Table__row', typeof rowClass === 'function' ? rowClass(row) : rowClass)
                ),
            };

            if (!paginated) {
                options.perPage = Infinity;
            }

            if (defaultOrderBy !== undefined) {
                options.orderBy = typeof defaultOrderBy === 'string'
                    ? { column: defaultOrderBy, ascending: true }
                    : {
                        column: defaultOrderBy.column,
                        ascending: defaultOrderBy.ascending ?? true,
                    };
            }

            return options;
        },
    },
    created() {
        const { $options } = this;

        this.uniqueId = generateUniqueId(`${$options.name!}-`);
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleRowClick({ row, event: e }: RowClickEventPayload) {
            if (e.type === 'dblclick') {
                return;
            }

            let currentElement: HTMLElement | null = e.target as HTMLElement;
            while (currentElement && currentElement !== document.body) {
                const { nodeName } = currentElement;
                if (['A', 'BUTTON'].includes(nodeName)) {
                    return;
                }
                currentElement = currentElement.parentElement;
            }

            this.$emit('rowClick', row);
        },

        // ------------------------------------------------------
        // -
        // -    API Publique
        // -
        // ------------------------------------------------------

        /**
         * Permet de changer la page courante du tableau (dans le cas ou celui-ci est paginé).
         *
         * @param number - Le numéro de la page à afficher.
         */
        setPage(number: number): void {
            const $table = this.$refs.table as ClientTableInstance | undefined;
            $table?.setPage(number);
        },
    },
    render() {
        const {
            name,
            data,
            uniqueId,
            variant,
            columnsKeys,
            columnsSearchable,
            options,
            handleRowClick,
            withColumnsSelectorInferred: withColumnsSelector,
        } = this;

        const className = ['Table', `Table--${variant}`, {
            'Table--static': columnsSearchable.length === 0 && !withColumnsSelector,
        }];

        return (
            <v-client-table
                ref="table"
                class={className}
                key={name ?? uniqueId}
                name={name ?? uniqueId}
                columns={columnsKeys}
                options={options}
                data={data}
                onRow-click={handleRowClick}
            />
        );
    },
});

export { Variant };
export type { Columns, Column };
export default ClientTable;
