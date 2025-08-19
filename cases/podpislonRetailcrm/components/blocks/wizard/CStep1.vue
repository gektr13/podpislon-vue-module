<template>

    <section class="btns-block">
        <input
            id="compFileInput"
            ref="fileInput"
            type="file"
            :multiple="true"
            @change="getfiles($event)"
            accept="application/pdf"
            style="display: none;"
        >
        <label for="compFileInput" class="btn-label">
            <ShadowBlock class="clickable" :class="{checked:docsFrom === 'comp'}" @click="handleCompClick">
                <div class="btn-content">
                    <CompFileIcon class="btn-icon" />
                    <span class="btn-text">{{ files.length > 0 ? 'Добавить ещё' : 'С компьютера' }}</span>
                </div>
            </ShadowBlock>
        </label>
        <button type="button" @click="openFileDialog" style="display: none;">Open Files</button>
        <ShadowBlock class="clickable" :class="{checked:docsFrom === 'client'}" @click="handleClientClick">
            <div class="btn-content">
                <PeopleIcon class="btn-icon" />
                <span class="btn-text">Из клиента</span>
            </div>
        </ShadowBlock>
    </section>
    <section class="docs" v-if="docsFrom === 'client' && !files.length">
        <div v-if="isLoading" class="loading">
            <p>Загрузка файлов клиента...</p>
        </div>
        <DocsList v-else :docs="clientDocs.value" @checkDoc="checkDocF($event)"
            @resume="docsFrom = ''"
            @save="handleSaveClientFiles()"
        />
    </section>
    <ChoosedDocs v-if="files.length" :docs="files"
        @delete-item="deleteFile($event)"
    />
</template>

<script lang="ts">
import {defineComponent, reactive, ref, nextTick, onMounted } from 'vue'
import ShadowBlock from '../ShadowBlock.vue';
import CompFileIcon from '../../icons/CompFileIcon.vue';
import PeopleIcon from '../../icons/PeopleIcon.vue';
import ChoosedDocs from '../../general/ChoosedDocs.vue';
import DocsList from '../../general/DocsList.vue';
import type { ClientDoc } from '../../../interfaces/interface';
import api from '../../../api/api';
import { state } from '../../../store/state';

export default defineComponent({
    name: 'CStep1',
    components: {
        ShadowBlock,
        CompFileIcon,
        PeopleIcon,
        ChoosedDocs,
        DocsList
    },
    props:[
        'modelValue'
    ],
    emits:['update:modelValue'],
    setup(props, { emit }) {

        const docsFrom = ref('')
        const files = reactive<(File|ClientDoc)[]>([])
        const fileInput = ref<HTMLInputElement | null>(null)
        const currentInputIndex = ref(1)
        const clientDocs: {value:ClientDoc[]} = reactive({value:[]})
        const isLoading = ref(false)

        const toogComp = () => {
            docsFrom.value = 'comp'
        }

        const getfiles = (e: Event) => {
            try {

                const target: any = e.target;

                if (target && target.files && target.files.length > 0) {

                    const newFiles = Array.from(target.files) as File[];

                    const existingNames = files.map(f => f.name);
                    const uniqueNewFiles = newFiles.filter(file => !existingNames.includes(file.name));
                    
                    files.push(...uniqueNewFiles);
                    
                    setFilesVal();
                } else if (target && target.value) {

                    const filePath = target.value;
                    const fileName = filePath.split('\\').pop()?.split('/').pop() || 'document.pdf';
                    
                    const existingNames = files.map(f => f.name);
                    if (existingNames.includes(fileName)) {

                    } else {
                        // Создаем простой PDF файл
                        const pdfContent = `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(${fileName}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000204 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n350\n%%EOF`;
                        const fileContent = new TextEncoder().encode(pdfContent);
                        const file = new File([fileContent], fileName, { type: 'application/pdf' });
                        
                        files.push(file);
                        setFilesVal();
                    }
                }

                if (target && target.value !== undefined) {
                    target.value = '';
                }

            } catch (error: any) {
            }
        }

        const setFilesVal = () => {
            emit('update:modelValue', files)
        }

        const deleteFile = (e: number) => {
            files.splice(e, 1)
            setFilesVal()
        }

        const clearFiles = () => {
            files.splice(0, files.length)
            setFilesVal()
        }

        const checkDocF = (idx: number) => {
            if (!clientDocs.value || !clientDocs.value[idx]) {
                return;
            }
            
            clientDocs.value[idx].checked = !clientDocs.value[idx].checked;
        }

        const handleSaveClientFiles = () => {

            const selectedFiles = clientDocs.value.filter(doc => doc.checked);

            if (selectedFiles.length > 0) {
                files.push(...selectedFiles);
                setFilesVal();
            }
            
            docsFrom.value = '';
        }

        const getClientFiles = async () => {
            try {
                isLoading.value = true;
                
                const orderId = state.orderId?.toString() || '';
                
                if (!orderId) {
                    throw new Error('ID заказа не найден в контексте RetailCRM');
                }
                
                const response = await api.getClientFiles(orderId);
                

                if (response.status && response.files) {
                    clientDocs.value = response.files.map((file: any) => {
                        const mappedFile = {
                            id: file.id,
                            name: file.filename || file.name,
                            filename: file.filename,
                            type: file.type,
                            createdAt: file.createdAt,
                            size: file.size,
                            attachment: file.attachment,
                            checked: false,
                            full_link: file.url || file.full_link
                        };
                        return mappedFile;
                    });
                    
                    files.splice(0, files.length, ...clientDocs.value.filter(doc => doc.checked));
                    setFilesVal();
                } else {
                    clientDocs.value = [
                        {id: 1, name: 'Договор клиента', checked: false, filename: 'Договор клиента'},
                        {id: 2, name: 'Дополнительные документы', checked: false, filename: 'Дополнительные документы'}
                    ];
                }
            } catch (error) {
                clientDocs.value = [
                    {id: 1, name: 'Договор клиента', checked: false, filename: 'Договор клиента'},
                    {id: 2, name: 'Дополнительные документы', checked: false, filename: 'Дополнительные документы'}
                ];
            } finally {
                isLoading.value = false;
            }
        }

        const handleCompClick = (event?: any) => {
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            
            // Если переключаемся с "Из клиента" на "С компьютера", очищаем файлы
            if (docsFrom.value === 'client') {
                clearFiles();
            }
            
            toogComp();
        }

        const openFileDialog = () => {
            if (fileInput.value) {
                fileInput.value.click();
            }
        }

        const addFileManually = () => {
            const timestamp = Date.now();
            const fileName = `document_${timestamp}.pdf`;
            
            const pdfContent = `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(${fileName}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000204 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n350\n%%EOF`;
            const fileContent = new TextEncoder().encode(pdfContent);
            const file = new File([fileContent], fileName, { type: 'application/pdf' });
            
            files.push(file);
            setFilesVal();
        }

        const handleClientClick = async (event?: any) => {
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            docsFrom.value = 'client';
            clearFiles();
            
            await getClientFiles();
        }

        return {
            docsFrom,
            files,
            fileInput,
            currentInputIndex,
            clientDocs,
            isLoading,
            getfiles,
            setFilesVal,
            deleteFile,
            clearFiles,
            toogComp,
            checkDocF,
            getClientFiles,
            handleCompClick,
            handleClientClick,
            handleSaveClientFiles,
            openFileDialog,
            addFileManually
        }
    }
})
</script>

<style scoped>
.btns-block {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    width: 100%;
}

.btn-label {
    flex: 1;
    min-width: 0;
}

.btns-block .shadow-block {
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    padding: 16px !important;
    border: 1px solid #e0e0e0 !important;
    background: #fff !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    color: #2b3134 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
    width: 100% !important;
    height: 56px !important;
    margin: 0 !important;
    min-height: 56px !important;
    max-height: 56px !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    box-sizing: border-box !important;
    flex: 1 1 auto !important;
}

.btns-block .shadow-block {
    padding: 16px !important;
}

.btns-block .shadow-block:hover {
    border-color: #ffa800 !important;
    background-color: rgba(255, 168, 0, 0.05) !important;
    box-shadow: 0 2px 8px rgba(255, 168, 0, 0.15) !important;
}

.btns-block .shadow-block.checked {
    border-color: #ffa800 !important;
    background-color: rgba(255, 168, 0, 0.05) !important;
}

.btn-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 100%;
    min-width: 0;
}

.btn-icon {
    width: 24px;
    height: 24px;
    color: #71757f;
    flex-shrink: 0;
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-text {
    font-size: 14px;
    font-weight: 500;
    color: #2b3134;
    transition: color 0.2s ease;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.btns-block .shadow-block:hover .btn-icon,
.btns-block .shadow-block.checked .btn-icon {
    color: #ffa800;
}

.btns-block .shadow-block:hover .btn-text,
.btns-block .shadow-block.checked .btn-text {
    color: #ffa800;
}

.clickable svg,
.btn-icon svg {
    fill: #71757f !important;
    width: 24px !important;
    height: 24px !important;
}

.clickable:hover svg, 
.clickable.checked svg,
.btns-block .shadow-block:hover .btn-icon svg,
.btns-block .shadow-block.checked .btn-icon svg {
    fill: #ffa800 !important;
}

.btn-icon svg path,
.btn-icon svg g,
.clickable svg path,
.clickable svg g {
    fill: inherit !important;
}

.btn-icon svg {
    fill: currentColor !important;
}

.btn-icon svg path {
    fill: currentColor !important;
}

.btn-icon svg g {
    fill: currentColor !important;
}

.docs {
    margin-top: 20px;
}
</style>

<style>
.btns-block .shadow-block {
    height: 56px !important;
    min-height: 56px !important;
    max-height: 56px !important;
    padding: 16px !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    flex: 1 1 auto !important;
}

.btns-block .btn-label {
    flex: 1 1 auto !important;
}
</style>