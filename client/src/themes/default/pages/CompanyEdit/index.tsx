import './index.scss';
import { defineComponent } from '@vue/composition-api';
import apiCompanies from '@/stores/api/companies';
import parseInteger from '@/utils/parseInteger';
import axios from 'axios';
import HttpCode from 'status-code-enum';
import { ApiErrorCode } from '@/stores/api/@codes';
import Page from '@/themes/default/components/Page';
import CriticalError, { ErrorType } from '@/themes/default/components/CriticalError';
import Loading from '@/themes/default/components/Loading';
import Form from './components/Form';

import type { ComponentRef } from 'vue';
import type { Company, CompanyEdit as CompanyEditType } from '@/stores/api/companies';

type Data = {
    id: number | null,
    isFetched: boolean,
    isSaving: boolean,
    company: Company | null,
    criticalError: string | null,
    validationErrors: Record<string, string> | null,
};

/** Page d'edition d'une société bénéficiaire. */
const CompanyEdit = defineComponent({
    name: 'CompanyEdit',
    data(): Data {
        const id = parseInteger(this.$route.params.id);

        return {
            id,
            isFetched: id === null,
            isSaving: false,
            company: null,
            criticalError: null,
            validationErrors: null,
        };
    },
    computed: {
        isNew(): boolean {
            return this.id === null;
        },

        pageTitle(): string {
            const { $t: __, isNew, isFetched, company } = this;

            if (isNew) {
                return __('page.company.title-create');
            }

            return isFetched
                ? __('page.company.title-edit', { name: company!.legal_name })
                : __('page.company.title-edit-simple');
        },
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        // ------------------------------------------------------
        // -
        // -    Handlers
        // -
        // ------------------------------------------------------

        handleSubmit(data: CompanyEditType) {
            this.save(data);
        },

        handleCancel() {
            this.$router.back();
        },

        // ------------------------------------------------------
        // -
        // -    Méthodes internes
        // -
        // ------------------------------------------------------

        async fetchData() {
            if (this.isNew) {
                this.isFetched = true;
                return;
            }

            try {
                this.company = await apiCompanies.one(this.id!);
                this.isFetched = true;
            } catch (error) {
                if (!axios.isAxiosError(error)) {
                    // eslint-disable-next-line no-console
                    console.error(`Error occurred while retrieving company #${this.id!} data`, error);
                    this.criticalError = ErrorType.UNKNOWN;
                } else {
                    const { status = HttpCode.ServerErrorInternal } = error.response ?? {};
                    this.criticalError = status === HttpCode.ClientErrorNotFound
                        ? ErrorType.NOT_FOUND
                        : ErrorType.UNKNOWN;
                }
            }
        },

        async save(data: CompanyEditType) {
            if (this.isSaving) {
                return;
            }
            this.isSaving = true;
            const { $t: __ } = this;

            const doRequest = (): Promise<Company> => (
                !this.isNew
                    ? apiCompanies.update(this.id!, data)
                    : apiCompanies.create(data)
            );

            try {
                const company = await doRequest();
                if (!this.isNew) {
                    this.company = company;
                }

                this.validationErrors = null;

                // - Redirection...
                this.$toasted.success(__('page.company.saved'));
                this.$router.back();
            } catch (error) {
                if (!axios.isAxiosError(error)) {
                    // eslint-disable-next-line no-console
                    console.error(`Error occurred while saving the company`, error);
                    this.$toasted.error(__('errors.unexpected-while-saving'));
                } else {
                    const { code = ApiErrorCode.UNKNOWN, details = {} } = error.response?.data?.error ?? {};
                    if (code === ApiErrorCode.VALIDATION_FAILED) {
                        this.validationErrors = { ...details };
                        (this.$refs.page as ComponentRef<typeof Page>)?.scrollToTop();
                    } else {
                        this.$toasted.error(__('errors.unexpected-while-saving'));
                    }
                }
                this.isSaving = false;
            }
        },
    },
    render() {
        const {
            pageTitle,
            isSaving,
            isFetched,
            company,
            criticalError,
            validationErrors,
            handleSubmit,
            handleCancel,
        } = this;

        if (criticalError || !isFetched) {
            return (
                <Page name="company-edit" title={pageTitle} centered>
                    {criticalError ? <CriticalError type={criticalError} /> : <Loading />}
                </Page>
            );
        }

        return (
            <Page
                ref="page"
                name="company-edit"
                title={pageTitle}
                hasValidationError={!!validationErrors}
            >
                <div class="CompanyEdit">
                    <Form
                        savedData={company}
                        isSaving={isSaving}
                        errors={validationErrors}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                    />
                </div>
            </Page>
        );
    },
});

export default CompanyEdit;
