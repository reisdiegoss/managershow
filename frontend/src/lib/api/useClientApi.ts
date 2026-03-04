import { useAuth } from '@clerk/nextjs';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { useMemo } from 'react';
import { Show, ShowStatus } from '@/types/show';

export const useClientApi = () => {
    const { getToken } = useAuth();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
            timeout: 10000,
        });

        instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
            try {
                const token = await getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                // Injeção do God Mode (suporte avançado pelo admin) operando nas rotas do cliente
                if (typeof window !== 'undefined') {
                    const impersonateId = localStorage.getItem('impersonate_tenant_id');
                    if (impersonateId) {
                        config.headers['X-Impersonate-Tenant-Id'] = impersonateId;
                    }
                }
            } catch (error) {
                console.error("[useClientApi] Erro ao recuperar token do Clerk:", error);
            }
            return config;
        });

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error(`[useClientApi] Erro na resposta de ${error.config?.url}:`, error.message);
                return Promise.reject(error);
            }
        );

        return instance;
    }, [getToken]);

    const updateShowStatus = async (id: string, status: ShowStatus) => api.patch(`/client/shows/${id}`, { status });
    const simulateShow = async (data: { location_city: string; location_uf: string; base_price: number; client_type: string }) => api.post('/client/shows/simulate', data);
    const createShow = async (data: Partial<Show>) => api.post('/client/shows', data);

    const uploadContract = async (showId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/client/contracts/${showId}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    };

    const updateLeadStatus = async (id: string, status: string) => api.patch(`/client/leads/${id}`, { status });
    const convertLeadToShow = async (id: string) => api.post(`/client/leads/${id}/convert`);
    const addContractorNote = async (contractorId: string, content: string) => api.post(`/client/contractors/${contractorId}/notes`, { content });

    const uploadExecutionMedia = async (showId: string, files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return api.post(`/client/shows/${showId}/execution-media`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    };

    const getMe = async () => api.get('/client/me');
    const getBillingCatalog = async () => api.get('/client/billing/catalog');
    const buyBundle = async (bundleId: string) => api.post('/client/billing/buy-bundle', { id: bundleId });
    const buyAddon = async (addonId: string) => api.post('/client/billing/buy-addon', { id: addonId });

    return {
        api,
        updateShowStatus,
        simulateShow,
        createShow,
        uploadContract,
        updateLeadStatus,
        convertLeadToShow,
        addContractorNote,
        uploadExecutionMedia,
        getMe,
        getBillingCatalog,
        buyBundle,
        buyAddon
    };
};
