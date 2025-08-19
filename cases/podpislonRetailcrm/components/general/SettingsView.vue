<template>
  <div class="settings-view">
    <header class="settings-header">
      <h2>Настройки Подпислон</h2>
      <p>Настройте интеграцию с сервисом электронной подписи</p>
    </header>

    <!-- Информация о компании -->
    <section v-if="company?.title" class="company-info">
      <CompanyBlock :company="company" />
      <p class="sign-text">
        Остаток подписей: <span class="sign-count">{{ signings }}</span>
      </p>
    </section>

    <!-- Статус подключения -->
    <section v-if="showStatus" class="status-section">
      <div class="success-block">
        <span class="status-icon">✓</span>
        API-ключ успешно подключен
      </div>
    </section>

    <!-- Форма настройки -->
    <section class="settings-form">
      <div class="form-group">
        <label for="apiKey">API-ключ Подпислон</label>
        <SimpleInput 
          v-model="apiKey" 
          placeholder="Введите ваш API-ключ Подпислон"
          type="text"
          required
        />
        <small class="form-help">
          API-ключ можно получить в личном кабинете <a href="https://podpislon.ru" target="_blank">podpislon.ru</a>
        </small>
      </div>

      <div class="form-group">
        <label for="retailcrmApiKey">API-ключ RetailCRM</label>
        <SimpleInput 
          v-model="retailcrmApiKey" 
          placeholder="Введите ваш API-ключ RetailCRM"
          type="text"
          required
        />
        <small class="form-help">
          API-ключ RetailCRM можно получить в настройках вашего аккаунта RetailCRM
        </small>
      </div>
      
      <div class="form-actions">
        <SimpleButton 
          title="Сохранить" 
          @click="save" 
          :disabled="!apiKey.trim() || !retailcrmApiKey.trim() || isLoading"
        />
      </div>
    </section>

    <!-- Ссылка на регистрацию -->
    <section class="registration-section">
      <p>
        Нет аккаунта в Подпислон? 
        <a 
          href="https://podpislon.ru/signup?utm_source=retailcrm&utm_medium=market" 
          target="_blank"
          class="registration-link"
        >
          Зарегистрируйтесь
        </a>
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import SimpleButton from '../ui/SimpleButton.vue';
import SimpleInput from '../ui/SimpleInput.vue';
import CompanyBlock from '../blocks/CompanyBlock.vue';
import SAPI from '../../api/slon';
import api from '../../api/api';
import { state } from '../../store/state';
import type { CompanyInfo } from '../../interfaces/company';

export default defineComponent({
  name: 'SettingsView',
  components: { SimpleInput, SimpleButton, CompanyBlock },
  setup() {
    const apiKey = ref('');
    const retailcrmApiKey = ref('');
    const company = ref<CompanyInfo | undefined>(undefined);
    const signings = ref<number | string>('—');
    const isKeyAdded = ref<boolean>(false);
    const isLoading = ref<boolean>(false);
    const showStatus = ref<boolean>(false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('account_id');

    onMounted(async () => {
      if (accountId) {
        await loadSettings();
      }
    });

    const loadSettings = async () => {
        if (!accountId) {
            return;
        }
        
        try {
            isLoading.value = true;
            
            const data = await api.getApiKeys(accountId);
            
            if (data.status && data.apiKey) {
                state.apiKey = data.apiKey;
                isKeyAdded.value = true;
                await getData();
            }
        } catch (error) {
            console.error('Ошибка при загрузке настроек:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getData = async () => {
        try {
            const cData = await SAPI.getInfo();
            
            if (!cData?.status) {
                return;
            }
            
            company.value = {
                id: parseInt(cData.company?.inn || '0') || 0,
                title: cData.company?.name || '',
                sign_left: +cData.signings || 0,
                inn: cData.company?.inn,
                name: cData.company?.name,
            };
            signings.value = cData.signings;
        } catch (error) {
            console.error('Ошибка в getData():', error);
        }
    };

    const save = async () => {
      if (!apiKey.value?.trim() || !retailcrmApiKey.value?.trim() || !accountId) return;

      isLoading.value = true;
      showStatus.value = false;
      
      try {
        state.apiKey = apiKey.value;
        const connectionTest = await SAPI.getInfo();
        
        if (!connectionTest?.status) {
          const errorMessage = (connectionTest as any)?.error;
          if (errorMessage && (errorMessage.includes('502') || errorMessage.includes('Connection failed') || errorMessage.includes('Network error'))) {
            alert('Проблема с подключением к серверу. Попробуйте позже или обратитесь к администратору.');
          } else {
            alert('Не удалось проверить подключение. Проверьте API-ключ.');
          }
          return;
        }
        
        const saveResponse = await api.saveApiKey(accountId, apiKey.value, retailcrmApiKey.value);
        
        if (saveResponse.status) {
          isKeyAdded.value = true;
          await getData();
          showStatus.value = true;
          alert('API-ключи успешно сохранены и подключение проверено!');
          
          apiKey.value = '';
          retailcrmApiKey.value = '';
        }
      } catch (error) {
        alert('Ошибка сохранения API-ключей');
      } finally {
        isLoading.value = false;
      }
    };

    return { 
      apiKey, 
      retailcrmApiKey,
      company, 
      signings, 
      isKeyAdded, 
      isLoading,
      showStatus,
      save
    };
  },
});
</script>

<style>
.settings-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.settings-header {
  text-align: center;
  margin-bottom: 30px;
}

.settings-header h2 {
  color: #2b3134;
  margin-bottom: 8px;
}

.settings-header p {
  color: #71757f;
  margin: 0;
}

.company-info {
  margin-bottom: 24px;
}

.sign-text { 
  font-size: 12px; 
  color: var(--primary-dark); 
  margin-bottom: 16px; 
}

.sign-count { 
  color: var(--primary-black); 
  font-size: 14px; 
  font-weight: 500; 
}

.status-section {
  margin-bottom: 24px;
}

.success-block { 
  margin-bottom: 16px; 
  color: #4CAF50; 
  border: 1px solid #4CAF50; 
  border-radius: 6px; 
  padding: 12px; 
  background-color: #f4fff5; 
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-weight: bold;
}

.settings-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2b3134;
  font-weight: 500;
}

.form-help {
  display: block;
  margin-top: 6px;
  color: #71757f;
  font-size: 12px;
}

.form-help a {
  color: var(--main-color);
  text-decoration: none;
}

.form-help a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.registration-section {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 16px;
}

.registration-section p {
  margin: 0;
  color: #71757f;
}

.registration-link {
  color: var(--main-color);
  text-decoration: none;
  font-weight: 500;
}

.registration-link:hover {
  text-decoration: underline;
}
</style> 