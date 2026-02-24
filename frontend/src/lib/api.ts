import { useAuth } from '@clerk/nextjs';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { Show, ShowStatus } from '@/types/show';

/**
 * Hook customizado para realizar chamadas à API do Manager Show.
 * Injeta automaticamente o Bearer Token do Clerk no Header de Authorization.
 */
export const useApi = () => {
    const { getToken } = useAuth();

    // URL base apontando para o nosso backend FastAPI
    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    });

    // Interceptor para injetar o token JWT de forma assíncrona
    api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Erro ao recuperar token do Clerk:", error);
        }
        return config;
    });

    /**
     * Atualiza o status de um show específico.
     */
    const updateShowStatus = async (id: string, status: ShowStatus) => {
        return api.patch(`/client/shows/${id}`, { status });
    };

    /**
     * Simula a viabilidade financeira de um show.
     */
    const simulateShow = async (data: { location_city: string; location_uf: string; base_price: number; client_type: string }) => {
        return api.post('/client/shows/simulate', data);
    };

    /**
     * Cria um novo show.
     */
    const createShow = async (data: Partial<Show>) => {
        return api.post('/client/shows', data);
    };

    /**
     * Faz o upload de um contrato assinado.
     */
    const uploadContract = async (showId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/client/contracts/${showId}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    };

    return { api, updateShowStatus, simulateShow, createShow, uploadContract };
};
