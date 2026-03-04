import { useAuth } from '@clerk/nextjs';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { useMemo } from 'react';

export const useAdminApi = () => {
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
                // Retaguarda nunca precisa usar impersonateId no header de si mesma.
            } catch (error) {
                console.error("[useAdminApi] Erro ao recuperar token do Clerk:", error);
            }
            return config;
        });

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error(`[useAdminApi] Erro na resposta de ${error.config?.url}:`, error.message);
                return Promise.reject(error);
            }
        );

        return instance;
    }, [getToken]);

    const getAdminStats = async () => api.get('/retaguarda/dashboard/stats');
    const getAdminGrowthChart = async () => api.get('/retaguarda/dashboard/charts/growth');
    const getAdminTenants = async () => api.get('/retaguarda/tenants');
    const createAdminTenant = async (data: any) => api.post('/retaguarda/tenants', data);
    const updateAdminTenant = async (id: string, data: any) => api.patch(`/retaguarda/tenants/${id}`, data);
    const getAdminTenant = async (id: string) => api.get(`/retaguarda/tenants/${id}`);
    const suspendAdminTenant = async (id: string) => api.patch(`/retaguarda/tenants/${id}/suspend`);
    const updateAdminTenantFeatures = async (id: string, data: any) => api.patch(`/retaguarda/tenants/${id}/features`, data);
    const impersonateAdminTenant = async (id: string) => api.post(`/retaguarda/tenants/${id}/impersonate`);

    // Antigo endpoint colidindo de Lead (CRM do SaaS admin)
    const getAdminLeads = async () => api.get('/retaguarda/crm/leads');

    const getFinanceDashboard = async () => api.get('/retaguarda/finance/dashboard');
    const getAdminBundles = async () => api.get('/retaguarda/plans/bundles');
    const createAdminBundle = async (data: any) => api.post('/retaguarda/plans/bundles', data);
    const updateAdminBundle = async (id: string, data: any) => api.patch(`/retaguarda/plans/bundles/${id}`, data);
    const deleteAdminBundle = async (id: string) => api.delete(`/retaguarda/plans/bundles/${id}`);

    const getAdminAddons = async () => api.get('/retaguarda/plans/addons');
    const createAdminAddon = async (data: any) => api.post('/retaguarda/plans/addons', data);
    const updateAdminAddon = async (id: string, data: any) => api.patch(`/retaguarda/plans/addons/${id}`, data);
    const deleteAdminAddon = async (id: string) => api.delete(`/retaguarda/plans/addons/${id}`);

    const getAdminTickets = async () => api.get('/retaguarda/tickets');
    const getWhatsAppQR = async () => api.get('/retaguarda/settings/whatsapp/qrcode');
    const createWhatsAppInstance = async () => api.post('/retaguarda/settings/whatsapp/instance');
    const logoutWhatsApp = async () => api.post('/retaguarda/settings/whatsapp/logout');
    const getAdminAuditLogs = async () => api.get('/retaguarda/audit');

    return {
        api,
        getAdminStats,
        getAdminGrowthChart,
        getAdminTenants,
        createAdminTenant,
        updateAdminTenant,
        getAdminTenant,
        suspendAdminTenant,
        updateAdminTenantFeatures,
        impersonateAdminTenant,
        getAdminLeads,
        getFinanceDashboard,
        getAdminBundles,
        createAdminBundle,
        updateAdminBundle,
        deleteAdminBundle,
        getAdminAddons,
        createAdminAddon,
        updateAdminAddon,
        deleteAdminAddon,
        getAdminTickets,
        getWhatsAppQR,
        createWhatsAppInstance,
        logoutWhatsApp,
        getAdminAuditLogs
    };
};
