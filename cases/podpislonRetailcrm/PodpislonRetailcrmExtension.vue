<template>
    <UiToolbarButton @click="handleOpenModal">
        Подпислон
    </UiToolbarButton>

    <UiModalWindow v-model:opened="opened" v-cloak>
        <template #title>
            <div class="modal-header">
                <span>Подпислон</span>
                <button 
                    @click="handleSettingsClick" 
                    class="settings-button"
                    title="Настройки"
                >
                    ⚙️
                </button>
            </div>
        </template>

        <!-- Контейнер для всех экранов -->
        <div v-if="opened && !isClosing" class="modal-content">
            <!-- Экран загрузки -->
            <div v-if="!isConnectionChecked" class="loading-container">
                <div class="loading-spinner">⏳</div>
                <p>Проверка подключения...</p>
            </div>

            <!-- Экран без подключения -->
            <div v-else-if="currentScreen === 'no-connection'" class="no-connection-container">
                <div class="no-connection-content">
                    <div class="no-connection-icon">⚠️</div>
                    <h3>Подключение не настроено</h3>
                    <p>Для работы с модулем Подпислон необходимо настроить API-ключ в настройках.</p>
                    <button 
                        @click="handleSettingsRedirectClick" 
                        class="settings-redirect-button"
                    >
                        Перейти в настройки
                    </button>
                </div>
            </div>

            <!-- Первый экран с кнопкой "Подписать документ" -->
            <div v-else-if="currentScreen === 'main'" class="sign-document-container">
                                <button 
                    @click="handleSignDocument"
                    class="podpislon-button"
                >
                    Подписать документ
                </button>

                <!-- Список документов -->
                <div v-if="hasPhone && loadRes" class="doc-list">
                    <doc-preview-component />
                </div>
            </div>

            <!-- Второй экран с формой добавления документов -->
            <div v-else-if="currentScreen === 'form'" class="form-container">
                <GoBack @go-back="handleGoBack" />
                <CompanyBlock :company="company" />
                <section class="content-section">
                    <h2>Добавление документов</h2>
                    <CStep1 v-model="DocForm_.files" />
                    <CSignatore v-if="DocForm_.files?.length" v-model="DocForm_.contact" />
                    <COptions v-if="DocForm_.files?.length" :form="DocForm_" @update="handleAgreementUpdate" @updateProp="updateDocFormProp" />
                </section>
                <section v-if="DocForm_.files?.length" class="button-section">
                    <PButton title="Подписать и отправить" @click="handleSendClick" />
                </section>
            </div>
        </div>
    </UiModalWindow>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, watch, computed } from 'vue';
import type { DocForm } from './interfaces/interface';
import type { CompanyInfo } from './interfaces/company';
import CStep1 from './components/blocks/wizard/CStep1.vue';
import CSignatore from './components/blocks/wizard/CSignatore.vue';
import COptions from './components/blocks/wizard/COptions.vue';
import PButton from './components/ui/PButton.vue';
import GoBack from './components/general/GoBack.vue';
import CompanyBlock from './components/blocks/CompanyBlock.vue';
import DocPreviewComponent from './components/blocks/DocPreviewComponent.vue';
import slon from './api/slon';
import api from './api/api';

import { state } from './store/state';
import { UiToolbarButton, UiModalWindow } from '@retailcrm/embed-ui-v1-components/remote'
// retailCRM hooks
import { useOrderCardContext, useField } from '@retailcrm/embed-ui';
import './styles.css';
import { useSettingsContext } from '@retailcrm/embed-ui'

export default defineComponent({
    name: 'PodpislonRetailcrmExtension',
    components: {
        UiToolbarButton,
        UiModalWindow,
        GoBack,
        CStep1,
        CSignatore,
        COptions,
        PButton,
        CompanyBlock,
        DocPreviewComponent,
    },
    setup() {
        const settings: any = useSettingsContext();
        
        let retailcrmApiKey = null;
        
        // Проверяем глобальные переменные RetailCRM
        if ((window as any).CRM && (window as any).CRM.apiKey) {
            retailcrmApiKey = (window as any).CRM.apiKey;
        }
        
        if ((window as any).retailcrm && (window as any).retailcrm.apiKey) {
            retailcrmApiKey = (window as any).retailcrm.apiKey;
        }
        
        // Проверяем контекст настроек на наличие API ключа
        if (!retailcrmApiKey && settings) {
            if (settings.schema) {
                try {
                    const schema = settings.schema();
                    
                    if (schema && typeof schema === 'object') {
                        const schemaKeys = Object.keys(schema);
                        for (const key of schemaKeys) {
                            if (key.includes('api') || key.includes('key') || key.includes('token') || key.includes('auth')) {
                                try {
                                    const value = settings.get ? settings.get(key) : null;
                                    if (value) {
                                        retailcrmApiKey = value;
                                        break;
                                    }
                                } catch (error: any) {
                                    // Поле не существует, это нормально
                                }
                            }
                        }
                    }
                } catch (error: any) {
                    // Schema error
                }
            }
        }
        
        // Проверяем URL параметры на наличие API ключа
        if (!retailcrmApiKey) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlHash = window.location.hash;
            
            const possibleApiKeyParams = ['apiKey', 'api_key', 'key', 'token', 'auth', 'authorization', 'retailcrm_api_key'];
            
            for (const param of possibleApiKeyParams) {
                const value = urlParams.get(param);
                if (value) {
                    retailcrmApiKey = value;
                    break;
                }
            }
            
            // Проверяем hash
            if (!retailcrmApiKey && urlHash) {
                const hashParams = new URLSearchParams(urlHash.substring(1));
                for (const param of possibleApiKeyParams) {
                    const value = hashParams.get(param);
                    if (value) {
                        retailcrmApiKey = value;
                        break;
                    }
                }
            }
        }
        
        const retailcrmApiKeyRef = ref(retailcrmApiKey);
        
        const opened = ref(false);
        const currentScreen = ref('main'); // 'main' | 'form' | 'no-connection'
        const loadRes = ref<boolean>(false);
        const isConnectionChecked = ref<boolean>(false);
        const hasConnection = ref<boolean>(false);
        const isClosing = ref<boolean>(false);
        
        // retailCRM: получаем контекст заказа и клиента
        const order = useOrderCardContext();
        const firstName = useField(order, 'customer.firstName');
        const lastName = useField(order, 'customer.lastName');
        const patronymic = useField(order, 'customer.patronymic');
        const phone = useField(order, 'customer.phone');
        const email = useField(order, 'customer.email');
        
        // Пытаемся получить ID заказа через useField
        let orderIdField;
        try {
            orderIdField = useField(order, 'id');
        } catch (error) {
            // Пробуем другие возможные поля
            try {
                orderIdField = useField(order, 'number');
            } catch (error2) {
                // Поле не найдено
            }
        }
        

        
        const company = ref<CompanyInfo | undefined>(undefined);
        const OptionsComponent = ref<typeof COptions>();

        const DocForm_: DocForm = reactive({
            files: [],
            contact: {
                name: '',
                last_name: '',
                second_name: '',
                phone: '',
            },
            agreement: 'N',
            send_late: 0,
        });

        // Функция для обновления данных клиента
        const updateClientData = () => {
            DocForm_.contact.name = firstName.value || '';
            DocForm_.contact.last_name = lastName.value || '';
            DocForm_.contact.second_name = patronymic.value || '';
            DocForm_.contact.phone = phone.value || '';
            
            // Устанавливаем данные в state
            if (firstName.value || lastName.value || patronymic.value || phone.value) {
                state.setClient({
                    firstname: firstName.value || '',
                    surname: lastName.value || '',
                    patronymic: patronymic.value || '',
                    phone: phone.value || '',
                    email: email.value || '',
                    id: state.customerId
                });
            }
        };

        // Следим за изменениями данных клиента
        watch([firstName, lastName, patronymic, phone, email], () => {
            updateClientData();
        }, { immediate: true });
        
        // Следим за изменениями ID заказа
        if (orderIdField) {
            watch(orderIdField, (newOrderId) => {
                if (newOrderId) {
                    state.orderId = typeof newOrderId === 'number' ? newOrderId : parseInt(newOrderId.toString());
                }
            }, { immediate: true });
        }

        // Функция для загрузки API ключа из сервера
        const loadApiKey = async (): Promise<boolean> => {
            try {
                // Получаем account_id из URL или других источников
                const urlParams = new URLSearchParams(window.location.search);
                let accountId = urlParams.get('account_id') || urlParams.get('accountId');
                
                // Если account_id нет в URL, пытаемся получить из document.referrer
                if (!accountId && document.referrer) {
                    try {
                        const referrerUrl = new URL(document.referrer);
                        const domainParts = referrerUrl.hostname.split('.');
                        accountId = domainParts[0]; // Берем первую часть домена как account_id
                    } catch (error) {
                        // Failed to extract account_id
                    }
                }
                
                if (!accountId) {
                    return false;
                }
                
                // Используем метод getApiKeys из api.ts для получения API ключа
                const result = await api.getApiKeys(accountId);
                
                if (result.status && result.apiKey) {
                    state.apiKey = result.apiKey;
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            }
        };

        // Функция для проверки подключения
        const checkConnection = async (): Promise<boolean> => {
            try {
                if (!state.apiKey || !state.apiKey.length) {
                    return false;
                }
                
                // Используем slon.getInfo() для проверки подключения с полученным API ключом
                const cData = await slon.getInfo();
                
                if (cData?.status) {
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            }
        };

        // Следим за изменением состояния модального окна
        watch(opened, async (newValue, oldValue) => {
            // Обрабатываем только реальные изменения
            if (newValue === oldValue) {
                return;
            }
            
            if (newValue) {
                // При открытии модального окна проверяем подключение
                isConnectionChecked.value = false;
                
                try {
                    // Сначала загружаем API ключ из сервера
                    const apiKeyLoaded = await loadApiKey();
                    
                    if (apiKeyLoaded) {
                        // Если API ключ загружен, проверяем подключение
                        hasConnection.value = await checkConnection();
                        
                        if (hasConnection.value) {
                            // Если подключение есть, показываем основной экран
                            currentScreen.value = 'main';
                            
                            // Устанавливаем loadRes в true для отображения списка документов
                            loadRes.value = true;
                            
                            // Загружаем информацию о компании
                            try {
                                const cData = await slon.getInfo();
                                
                                if (cData.status) {
                                    state.companyInfo = {
                                        id: parseInt(cData.company.inn || '0') || 0,
                                        title: cData.company.name || '',
                                        sign_left: +cData.signings,
                                        inn: cData.company.inn,
                                        name: cData.company.name,
                                    };
                                    company.value = {
                                        id: state.companyInfo.id,
                                        title: state.companyInfo.title,
                                        sign_left: state.companyInfo.sign_left
                                    };
                                }
                            } catch (error) {
                                // Error loading company info
                            }
                        } else {
                            // Если подключения нет, показываем экран без подключения
                            currentScreen.value = 'no-connection';
                        }
                    } else {
                        // Если API ключ не загружен, показываем экран без подключения
                        hasConnection.value = false;
                        currentScreen.value = 'no-connection';
                    }
                } catch (error) {
                    hasConnection.value = false;
                    currentScreen.value = 'no-connection';
                } finally {
                    isConnectionChecked.value = true;
                }
            } else if (oldValue) {
                // Сбрасываем состояние только при закрытии модального окна (было открыто, стало закрыто)
                
                // Устанавливаем флаг закрытия для предотвращения рендеринга
                isClosing.value = true;
                
                // Сбрасываем состояние немедленно
                forceResetOnClose();
                
                // Сбрасываем флаг закрытия через небольшую задержку
                setTimeout(() => {
                    isClosing.value = false;
                }, 100);
            }
        });

        // Следим за изменением состояния showDocumentForm
        watch(currentScreen, (newValue, oldValue) => {
            // Здесь может происходить ошибка
        });



        // Функция для принудительного сброса состояния при закрытии
        const forceResetOnClose = () => {
            try {
                // Принудительно сбрасываем все состояния синхронно
                currentScreen.value = 'main';
                isConnectionChecked.value = false;
                hasConnection.value = false;
                loadRes.value = false;
                
                // Очищаем форму
                DocForm_.files = [];
                DocForm_.contact = {
                    name: '',
                    last_name: '',
                    second_name: '',
                    phone: '',
                };
                DocForm_.agreement = 'N';
                DocForm_.send_late = 0;
            } catch (error) {
                // Error in force reset
            }
        };

        onMounted(async () => {
            order.initialize();
            
            // Получаем account_id из URL или других источников
            const urlParams = new URLSearchParams(window.location.search);
            const urlHashParams = new URLSearchParams(window.location.hash.substring(1));
            
            const urlAccountId = urlParams.get('account_id') || urlParams.get('accountId') || 
                                urlHashParams.get('account_id') || urlHashParams.get('accountId');
            
            if (urlAccountId) {
                state.accountId = urlAccountId;
            }
            
            // Если account_id не найден в URL, пытаемся получить из других источников
            if (!state.accountId) {
                // Проверяем глобальные переменные RetailCRM
                if ((window as any).CRM && (window as any).CRM.accountId) {
                    state.accountId = (window as any).CRM.accountId;
                }
                if ((window as any).retailcrm && (window as any).retailcrm.accountId) {
                    state.accountId = (window as any).retailcrm.accountId;
                }
                
                // Пытаемся извлечь account_id из document.referrer (как в loadApiKey)
                if (!state.accountId && document.referrer) {
                    try {
                        const referrerUrl = new URL(document.referrer);
                        const domainParts = referrerUrl.hostname.split('.');
                        state.accountId = domainParts[0]; // Берем первую часть домена как account_id
                    } catch (error) {
                        // Failed to extract account_id
                    }
                }
                
                // Пытаемся извлечь account_id из текущего домена
                if (!state.accountId) {
                    try {
                        const domain = window.location.hostname;
                        const domainParts = domain.split('.');
                        if (domainParts.length > 0 && domainParts[0] !== 'localhost') {
                            state.accountId = domainParts[0];
                        }
                    } catch (error) {
                        // Failed to extract account_id
                    }
                }
            }
        });



        // Вычисляемое свойство для проверки наличия телефона
        const hasPhone = computed(() => !!state.client?.phone || !!DocForm_.contact.phone);

        // Методы
        const handleSignDocument = () => {
            try {
                currentScreen.value = 'form';
            } catch (error) {
                // Error in handleSignDocument
            }
        };

        const handleGoBack = () => {
            try {
                currentScreen.value = 'main';
            } catch (error) {
                // Error in handleGoBack
            }
        };





        const validate = (): boolean => {
            try {
                let res = true;
                if (
                    !DocForm_.contact.name.length ||
                    !DocForm_.contact.last_name.length ||
                    !DocForm_.contact.phone.length ||
                    DocForm_.agreement !== 'Y'
                ) {
                    res = false;
                }
                return res;
            } catch (error) {
                return false;
            }
        };

        const send = async () => {
            try {
                if (!validate()) {
                    return;
                }
            
                const data = new FormData();
                data.append('name', DocForm_.contact.name);
                data.append('last_name', DocForm_.contact.last_name);
                data.append('second_name', DocForm_.contact.second_name ?? '');
                data.append('phone', DocForm_.contact.phone);
                data.append('agreement', DocForm_.agreement);
                
                if (DocForm_.files?.length) {
                    for (const file of DocForm_.files) {
                        if (file instanceof File) {
                            if (file.size === 0) {
                                alert('Ошибка: файл пустой - ' + file.name);
                                return;
                            }
                            data.append('file[]', file);
                        } else if (file instanceof Blob) {
                            if (file.size === 0) {
                                alert('Ошибка: файл пустой');
                                return;
                            }
                            data.append('file[]', file, 'document.pdf');
                        } else if ('id' in file && 'name' in file) {
                            try {
                                const fileData = await api.downloadFileById(file.id);
                                
                                if (fileData.status && fileData.file) {
                                    const byteCharacters = atob(fileData.file);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                                    
                                    data.append('file[]', blob, file.name || 'document.pdf');
                                } else {
                                    alert(`Ошибка скачивания файла ${file.name}: ${fileData.error}`);
                                    return;
                                }
                            } catch (error) {
                                alert(`Ошибка при скачивании файла ${file.name}`);
                                return;
                            }
                        }
                    }
                }
                
                let fileCount = 0;
                for (const [key, value] of data.entries()) {
                    if (key === 'file[]') fileCount++;
                }
                
                // Отладочная информация для FormData
                let hasFiles = false;
                for (const [key, value] of data.entries()) {
                    if (value instanceof File) {
                        hasFiles = true;
                    }
                }
                
                if (!hasFiles) {
                    alert('Ошибка: файлы не найдены в запросе');
                    return;
                }
                
                const res = await slon.addDocument(data);
                
                // Проверяем, что это действительно успешный ответ
                if (res.status && res.status !== 500 && res.status !== 400 && res.status !== 401 && res.status !== 403) {
                    // Закрываем модалку и сбрасываем форму
                    opened.value = false;
                } else {
                    // Не закрываем модальное окно при ошибке
                    if (res.status === 500) {
                        alert('Ошибка сервера Подпислон: ' + (res.message || 'Внутренняя ошибка сервера'));
                    } else if (res.status === 401) {
                        alert('Ошибка авторизации: проверьте API ключ');
                    } else {
                        alert('Документ не был отправлен: ' + (res.message || 'Неизвестная ошибка'));
                    }
                }
            } catch (error) {
                alert('Произошла ошибка при отправке документа: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
            }
        };

        const openSettings = async () => {
            let accountId = '';
            const domain = window.location.hostname;
            
            try {
                // Метод 1: Получаем домен RetailCRM из document.referrer
                let retailcrmDomain = null;
                if (document.referrer) {
                    try {
                        const referrerUrl = new URL(document.referrer);
                        retailcrmDomain = referrerUrl.origin;
                    } catch (error) {
                        // Failed to parse referrer URL
                    }
                }
                
                const urlParams = new URLSearchParams(window.location.search);
                
                const urlAccountId = urlParams.get('account_id') || urlParams.get('accountId');

                if (urlAccountId) {
                    accountId = urlAccountId;
                }

                if (!accountId && retailcrmDomain) {
                    try {
                        const domainParts = retailcrmDomain.replace('https://', '').replace('http://', '').split('.');
                        if (domainParts.length > 0) {
                            accountId = domainParts[0]; // Берем первую часть домена
                        }
                    } catch (error) {
                        // Failed to extract accountId from domain
                    }
                }
                
            } catch (error) {
                // Error getting RetailCRM identification data
            }
            


            let settingsUrl = `/settings?account_id=${encodeURIComponent(accountId)}&domain=${encodeURIComponent(domain)}`;

            window.open(settingsUrl, '_blank');
        };

        const updateDocFormProp = (prop: any) => {
            Object.assign(DocForm_, prop);
        };

        const handleAgreementUpdate = (value: boolean) => {
            DocForm_.agreement = value ? 'Y' : 'N';
        };

        const handleSendClick = (event?: any) => {
            // Prevent the event object from being passed through
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            send();
        };

        const handleOpenModal = (event?: any) => {
            // Prevent the event object from being passed through
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            
            opened.value = true;
        };

        const handleSettingsClick = (event?: any) => {
            // Prevent the event object from being passed through
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            openSettings();
        };

        const handleSettingsRedirectClick = (event?: any) => {
            // Prevent the event object from being passed through
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            openSettings();
        };

        return { 
            opened, 
            currentScreen, 
            company, 
            DocForm_, 
            OptionsComponent,
            loadRes,
            hasPhone,
            isConnectionChecked,
            hasConnection,
            isClosing,
            handleSignDocument,
            handleGoBack,
            validate,
            send,
            openSettings,
            loadApiKey,
            forceResetOnClose,
            updateDocFormProp,
            handleAgreementUpdate,
            handleSendClick,
            handleOpenModal,
            handleSettingsClick,
            handleSettingsRedirectClick,
        };
    },
});
</script>

<style>
/* CSS переменные для embed-модуля */
:root {
  --podpislon-orange: #ffa800;
  --podpislon-orange-hover: #ffcb00;
  --podpislon-white: #fff;
}

/* Скрываем элементы до полной загрузки Vue */
[v-cloak] {
  display: none !important;
}

/* Принудительные стили для кнопки Подписать документ */
.podpislon-button {
    background-color: var(--podpislon-orange) !important;
    color: var(--podpislon-white) !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 11px !important;
    width: 100% !important;
    cursor: pointer !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: background-color 0.2s ease !important;
}

.podpislon-button:hover {
    background-color: var(--podpislon-orange-hover) !important;
}

.sign-document-container .btn,
.form-container .btn {
    background-color: var(--podpislon-orange) !important;
    color: var(--podpislon-white) !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 11px !important;
    width: 100% !important;
    cursor: pointer !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: background-color 0.2s ease !important;
}

.sign-document-container .btn:hover,
.form-container .btn:hover {
    background-color: var(--podpislon-orange-hover) !important;
}

/* Стили для модального окна */
.modal-content {
    width: 100%;
    min-height: 200px;
    padding: 20px;
    max-width: 500px;
    font-size: 14px;
    margin: 0 auto;
}

.form-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

/* Стили для первого экрана */
.sign-document-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    width: 100%;
}

/* Стили для экрана загрузки */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    gap: 16px;
}

.loading-spinner {
    font-size: 24px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Стили для экрана без подключения */
.no-connection-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    width: 100%;
}

.no-connection-content {
    text-align: center;
    max-width: 400px;
    padding: 20px;
}

.no-connection-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.no-connection-content h3 {
    color: #2b3134;
    margin-bottom: 12px;
    font-size: 18px;
}

.no-connection-content p {
    color: #71757f;
    margin-bottom: 24px;
    line-height: 1.5;
}

.settings-redirect-button {
    background-color: var(--podpislon-orange) !important;
    color: var(--podpislon-white) !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 12px 24px !important;
    cursor: pointer !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: background-color 0.2s ease !important;
}

.settings-redirect-button:hover {
    background-color: var(--podpislon-orange-hover) !important;
}

/* Стили для списка документов */
.doc-list {
    width: 100%;
    margin-top: 16px;
}

/* Стили для заголовка */
.header-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.header-section .go-back-btn {
    cursor: pointer;
}

.header-section .shadow-block {
    flex: 1;
}

/* Стили для контента */
.content-section {
    margin-bottom: 24px;
}

.content-section h2 {
    margin-bottom: 16px;
}

/* Стили для заголовка модального окна */
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.settings-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.settings-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

/* Стили для заглушки опций */
.options-placeholder {
    padding: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 16px 0;
    background-color: #f9f9f9;
}

.options-placeholder p {
    margin: 0 0 12px 0;
    color: #666;
    font-size: 14px;
}

.options-placeholder label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
}

.options-placeholder input[type="checkbox"] {
    margin: 0;
}
</style>