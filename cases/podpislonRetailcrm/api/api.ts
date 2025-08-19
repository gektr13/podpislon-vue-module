import { ClientDoc } from '../interfaces/interface';
import { state } from '../store/state';

let API_BASE_URL = 'https://devvvi.ru';
let useHttps = true;

export default {
    async getApiKeys(account_id: string) {
        try {
            const formData = new FormData();
            formData.append('account_id', account_id);

            const response = await fetch(`${API_BASE_URL}/get-key`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error: any) {
            if ((error.message.includes('CERT_COMMON_NAME_INVALID') ||
                 error.message.includes('ERR_CERT') ||
                 error.message.includes('SSL')) && useHttps) {
                
                try {
                    const formData = new FormData();
                    formData.append('account_id', account_id);
                    
                    const response = await fetch(`${API_BASE_URL}/get-key`, {
                        method: 'POST',
                        body: formData
                    });
                    return await response.json();
                } catch (httpError: any) {
                    return {
                        status: false, 
                        error: 'Не удалось подключиться к серверу ни по HTTPS, ни по HTTP',
                        type: 'connection_error'
                    };
                }
            }
            
            return { status: false, error: error.message };
        }
    },

    async saveApiKey(account_id: string, api_key: string, retailcrm_api_key: string) {
        try {
            const formData = new FormData();
            formData.append('account_id', account_id);
            formData.append('api_key_podpislon', api_key);
            formData.append('api_key_retail_crm', retailcrm_api_key);

            const response = await fetch(`${API_BASE_URL}/install`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    status: false, 
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    details: errorText
                };
            }

            const result = await response.json();
            return result;
        } catch (error: any) {
            return {
                status: false, 
                error: error.message,
                type: 'network_error'
            };
        }
    },

    async getClientFiles(order_id: string): Promise<{status: boolean, files: ClientDoc[], error?: string}> {
        try {
            const formData = new FormData();
            formData.append('account_id', state.accountId || '');
            formData.append('order_id', order_id);

            const response = await fetch(`${API_BASE_URL}/get-client-files`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error: any) {
            return { status: false, files: [], error: error.message };
        }
    },

    async downloadFileById(fileId: number): Promise<{status: boolean, file: string, error?: string}> {
        try {
            const formData = new FormData();
            formData.append('account_id', state.accountId || '');
            formData.append('file_id', fileId.toString());

            const response = await fetch(`${API_BASE_URL}/download-file-by-id`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error: any) {
            return { status: false, file: '', error: error.message };
        }
    }
}