import { useAuth } from '@clerk/nextjs';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { useMemo } from 'react';
import { Show, ShowStatus } from '@/types/show';

/**
 * Hook customizado para realizar chamadas à API do Manager Show.
 * Injeta automaticamente o Bearer Token do Clerk no Header de Authorization.
 */
export const useApi = () => {
    const { getToken } = useAuth();

    // Axios instanciado dentro de um useMemo para evitar disparos infinitos em useEffects dependentes de 'api'
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
            timeout: 10000,
        });

        instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
            console.log(`[useApi] Iniciando req para: ${config.url}`);
            try {
                const start = performance.now();
                const token = await getToken();
                console.log(`[useApi] getToken finalizado em ${Math.round(performance.now() - start)}ms. Token existe?`, !!token);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error("[useApi] Erro ao recuperar token do Clerk:", error);
            }
            return config;
        });

        instance.interceptors.response.use(
            (response) => {
                console.log(`[useApi] Resposta OK de ${response.config.url}:`, response.status);
                return response;
            },
            (error) => {
                console.error(`[useApi] Erro na resposta de ${error.config?.url}:`, error.message);
                return Promise.reject(error);
            }
        );

        return instance;
    }, [getToken]);

    const updateShowStatus = async (id: string, status: ShowStatus) => {
        return api.patch(`/client/shows/${id}`, { status });
    };

    const simulateShow = async (data: { location_city: string; location_uf: string; base_price: number; client_type: string }) => {
        return api.post('/client/shows/simulate', data);
    };

    const createShow = async (data: Partial<Show>) => {
        return api.post('/client/shows', data);
    };

    const uploadContract = async (showId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/client/contracts/${showId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    };

    const updateLeadStatus = async (id: string, status: string) => {
        return api.patch(`/client/leads/${id}`, { status });
    };

    const convertLeadToShow = async (id: string) => {
        return api.post(`/client/leads/${id}/convert`);
    };

    const addContractorNote = async (contractorId: string, content: string) => {
        return api.post(`/client/contractors/${contractorId}/notes`, { content });
    };

    /**
     * Retaguarda: KPIs Globais.
     */
    const getAdminStats = async () => {
        return api.get('/retaguarda/dashboard/stats');
    };

    /**
     * Retaguarda: Gráfico de Crescimento.
     */
    const getAdminGrowthChart = async () => {
        return api.get('/retaguarda/dashboard/charts/growth');
    };

    /**
     * Retaguarda: Lista de Tenants.
     */
    const getAdminTenants = async () => {
        return api.get('/retaguarda/tenants');
    };

    /**
     * Retaguarda: Atualizar Tenant.
     */
    const updateAdminTenant = async (id: string, data: any) => {
        return api.patch(`/retaguarda/tenants/${id}`, data);
    };

    /**
     * Retaguarda: Lista de Planos.
     */
    const getAdminPlans = async () => {
        return api.get('/retaguarda/plans');
    };

    /**
     * Retaguarda: Suporte Técnico.
     */
    const getAdminTickets = async () => {
        return api.get('/retaguarda/tickets');
    };

    const uploadExecutionMedia = async (showId: string, files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return api.post(`/client/shows/${showId}/execution-media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    };

    const getWhatsAppQR = async () => {
        return api.get('/retaguarda/settings/whatsapp/qrcode');
    };

    const createWhatsAppInstance = async () => {
        return api.post('/retaguarda/settings/whatsapp/instance');
    };

    const logoutWhatsApp = async () => {
        return api.post('/retaguarda/settings/whatsapp/logout');
    };

    return {
        api,
        updateShowStatus,
        simulateShow,
        createShow,
        uploadContract,
        updateLeadStatus,
        convertLeadToShow,
        addContractorNote,
        getAdminStats,
        getAdminGrowthChart,
        getAdminTenants,
        updateAdminTenant,
        getAdminPlans,
        getAdminTickets,
        uploadExecutionMedia,
        getWhatsAppQR,
        createWhatsAppInstance,
        logoutWhatsApp
    };
};
