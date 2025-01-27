import { z } from '@/utils/validation';
import requester from '@/globals/requester';
import { BeneficiarySchema } from './beneficiaries';
import { withPaginationEnvelope } from './@schema';
import {
    EventExtraSchema,
    EventTechnicianSchema,
    createEventDetailsSchema,
    EventMaterialBillableSchema,
    EventMaterialNotBillableSchema,
} from './events';

import type Decimal from 'decimal.js';
import type Period from '@/utils/period';
import type { ZodRawShape } from 'zod';
import type { Tax } from '@/stores/api/taxes';
import type { Material, UNCATEGORIZED } from '@/stores/api/materials';
import type { Category } from '@/stores/api/categories';
import type { Park } from '@/stores/api/parks';
import type { SchemaInfer } from '@/utils/validation';
import type {
    EventTax,
    EventTaxTotal,
} from '@/stores/api/events';
import type {
    PaginatedData,
    SortableParams,
    PaginationParams,
} from './@types';

// ------------------------------------------------------
// -
// -    Schema / Enums
// -
// ------------------------------------------------------

export enum BookingEntity {
    EVENT = 'event',
}

//
// - Schemas secondaires
//

const BookingMaterialNotBillableSchema = EventMaterialNotBillableSchema;
const BookingMaterialBillableSchema = EventMaterialBillableSchema;
const BookingMaterialSchema = z.union([
    BookingMaterialNotBillableSchema,
    BookingMaterialBillableSchema,
]);

const BookingExtraSchema = EventExtraSchema;

//
// - Schemas principaux
//

// - Booking excerpt schema.
export const BookingExcerptSchema = (() => z.strictObject({
    id: z.number(),
    entity: z.literal(BookingEntity.EVENT),
    title: z.string(),
    location: z.string().nullable(),
    color: z.string().nullable(),
    mobilization_period: z.period(),
    operation_period: z.period(),
    beneficiaries: z.lazy(() => BeneficiarySchema.array()),
    technicians: z.lazy(() => EventTechnicianSchema.array()),
    is_confirmed: z.boolean(),
    is_archived: z.boolean(),
    is_departure_inventory_done: z.boolean(),
    is_return_inventory_done: z.boolean(),
    has_not_returned_materials: z.boolean().nullable(),
    categories: z.number().array(), // - Ids des catégories liés.
    parks: z.number().array(), // - Ids des parcs liés.
    created_at: z.datetime(),
}))();

// - Booking summary schema.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createBookingSummarySchema = <T extends ZodRawShape>(augmentation: T) => z.strictObject({
    id: z.number(),
    entity: z.literal(BookingEntity.EVENT),
    title: z.string(),
    reference: z.string().nullable(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    color: z.string().nullable(),
    mobilization_period: z.period(),
    operation_period: z.period(),
    beneficiaries: z.lazy(() => BeneficiarySchema.array()),
    technicians: z.lazy(() => EventTechnicianSchema.array()),
    materials_count: z.number().nonnegative(),
    is_confirmed: z.boolean(),
    is_billable: z.boolean(),
    is_archived: z.boolean(),
    is_departure_inventory_done: z.boolean(),
    is_return_inventory_done: z.boolean(),
    has_missing_materials: z.boolean().nullable(),
    has_not_returned_materials: z.boolean().nullable(),
    categories: z.number().array(), // - Ids des catégories liés.
    parks: z.number().array(), // - Ids des parcs liés.
    created_at: z.datetime(),
}).extend<T>(augmentation);

export const BookingSummarySchema = createBookingSummarySchema({});

// - Booking schema.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createBookingSchema = <T extends ZodRawShape>(augmentation: T) => z.lazy(() => (
    createEventDetailsSchema({
        entity: z.literal(BookingEntity.EVENT),
        ...augmentation,
    })
));
export const BookingSchema = createBookingSchema({});

// ------------------------------------------------------
// -
// -    Types
// -
// ------------------------------------------------------

//
// - Main Types
//

type NarrowBooking<Schema, Entity extends BookingEntity> = (
    Extract<Schema, { entity: Entity }>
);

export type BookingExcerpt<Entity extends BookingEntity = BookingEntity> = (
    NarrowBooking<SchemaInfer<typeof BookingExcerptSchema>, Entity>
);

export type BookingSummary<Entity extends BookingEntity = BookingEntity> = (
    NarrowBooking<SchemaInfer<typeof BookingSummarySchema>, Entity>
);

export type Booking<IsBillable extends boolean = boolean, Entity extends BookingEntity = BookingEntity> = (
    IsBillable extends true
        ? Extract<SchemaInfer<typeof BookingSchema>, { entity: Entity, is_billable: true }>
        : Extract<SchemaInfer<typeof BookingSchema>, { entity: Entity, is_billable: false }>
);

//
// - Secondary Types
//

export type BookingMaterial<IsBillable extends boolean = boolean> =
    IsBillable extends true
        ? SchemaInfer<typeof BookingMaterialBillableSchema>
        : SchemaInfer<typeof BookingMaterialNotBillableSchema>;

export type BookingExtra = SchemaInfer<typeof BookingExtraSchema>;

export type BookingTax = EventTax;
export type BookingTaxTotal = EventTaxTotal;

//
// - Édition
//

export type MaterialQuantity = {
    id: Material['id'],
    quantity: number,
};

export type MaterialBillingData = {
    id: Material['id'],
    unit_price: Decimal,
    discount_rate: Decimal,
};

export type ExtraBillingTaxData = {
    name: string,
    is_rate: boolean,
    value: Decimal,
};

export type ExtraBillingData = {
    id: number | null,
    description: string | null,
    quantity: number,
    unit_price: Decimal | null,
    tax_id: Tax['id'] | null,
    taxes?: ExtraBillingTaxData[],
};

export type BillingData = {
    materials: MaterialBillingData[],
    extras: ExtraBillingData[],
    global_discount_rate: Decimal,
};

export type MaterialResynchronizableField =
    | 'name'
    | 'reference'
    | 'unit_price'
    | 'degressive_rate'
    | 'taxes';

export type ExtraResynchronizableField =
    | 'taxes';

//
// - Récupération
//

export type BookingListFilters = {
    period?: Period,
    search?: string,
    category?: Category['id'] | typeof UNCATEGORIZED,
    park?: Park['id'],
    endingToday?: boolean,
    returnInventoryTodo?: boolean,
    archived?: boolean,
    notConfirmed?: boolean,
};

type GetAllParamsPaginated = BookingListFilters & SortableParams & PaginationParams & { paginated?: true };
type GetAllInPeriodParams = { paginated: false, period: Period };

// ------------------------------------------------------
// -
// -    Fonctions
// -
// ------------------------------------------------------

async function all(params: GetAllInPeriodParams): Promise<BookingExcerpt[]>;
async function all(params?: GetAllParamsPaginated): Promise<PaginatedData<BookingExcerpt[]>>;
async function all({ period, ...params }: GetAllParamsPaginated | GetAllInPeriodParams = {}): Promise<unknown> {
    const normalizedParams = { paginated: true, ...params, ...period?.toQueryParams('period') };
    const response = await requester.get('/bookings', { params: normalizedParams });

    return normalizedParams.paginated
        ? withPaginationEnvelope(BookingExcerptSchema).parse(response.data)
        : BookingExcerptSchema.array().parse(response.data);
}

const oneSummary = async (entity: BookingEntity, id: Booking['id']): Promise<BookingSummary> => {
    const response = await requester.get(`/bookings/${entity}/${id}/summary`);
    return BookingSummarySchema.parse(response.data);
};

const one = async (entity: BookingEntity, id: Booking['id']): Promise<Booking> => {
    const response = await requester.get(`/bookings/${entity}/${id}`);
    return BookingSchema.parse(response.data);
};

const updateMaterials = async (entity: BookingEntity, id: Booking['id'], materials: MaterialQuantity[]): Promise<Booking> => {
    const response = await requester.put(`/bookings/${entity}/${id}/materials`, materials);
    return BookingSchema.parse(response.data);
};

const updateBilling = async (entity: BookingEntity, id: Booking['id'], data: BillingData): Promise<Booking> => {
    const response = await requester.put(`/bookings/${entity}/${id}/billing`, data);
    return BookingSchema.parse(response.data);
};

const resynchronizeMaterial = async (
    entity: BookingEntity,
    id: Booking['id'],
    materialId: BookingMaterial['id'],
    selection: MaterialResynchronizableField[],
): Promise<BookingMaterial> => {
    const response = await requester.put(`/bookings/${entity}/${id}/materials/${materialId}/resynchronize`, selection);
    return BookingMaterialSchema.parse(response.data);
};

const resynchronizeExtra = async (
    entity: BookingEntity,
    id: Booking['id'],
    extraId: BookingExtra['id'],
    selection: ExtraResynchronizableField[],
): Promise<BookingExtra> => {
    const response = await requester.put(`/bookings/${entity}/${id}/extras/${extraId}/resynchronize`, selection);
    return BookingExtraSchema.parse(response.data);
};

export default {
    all,
    one,
    oneSummary,
    updateMaterials,
    updateBilling,
    resynchronizeMaterial,
    resynchronizeExtra,
};
