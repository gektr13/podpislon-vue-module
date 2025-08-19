import { Keyable } from '../interfaces/keyable';
import { state } from '../store/state';
import { CompanyInfo } from '../interfaces/company';

const API_BASE_URL = 'https://podpislon.ru/integration';

export default {
    sendRequest(url: string, method = 'GET', data: Keyable | FormData | null = null) {
        const requestHeaders: HeadersInit = new Headers();
        requestHeaders.set('X-API-KEY', state.apiKey ?? '');

        const params = <Keyable>{
            method,
            headers: requestHeaders,
        }
        if (data) {
            params.body = data instanceof FormData ? data : new URLSearchParams(data)
        }
        return fetch(`${API_BASE_URL}/${url}`, params)
            .then(res => {
                if (!res.ok && res.status === 401) {
                    alert('Не корректный api-ключ')
                    return { status: false };
                }

                return res.json()
            })
    },
    getInfo(): Promise<{ status: boolean, signings: string, company: CompanyInfo }> {
        return this.sendRequest('get-info')
    },
    getDocs(filter: Keyable) {
        const fd = new FormData;
        for (const key in filter) {
            fd.append(`filter[${key}]`, filter[key])
        }
        return this.sendRequest('', 'POST', fd);
    },
    addDocument(body: FormData) {
        return this.sendRequest('add-document', 'PUT', body);
    },
    loadFile(body: FormData){
        return this.sendRequest('get-file', 'POST', body);
    }
} 