<template>
    <div>
        <doc-preview v-for="doc in docs.docs" :key="`doc_${doc.id}`" :doc="doc"/>
    </div>
</template>

<script lang="ts">
import slon from '../../api/slon'
import {defineComponent, onMounted, reactive, computed} from 'vue'
import DocPreview from './DocPreview.vue';
import { Document } from '../../interfaces/document';
import { state } from '../../store/state';

export default defineComponent({
    name: 'DocPreviewComponent',
    components:{
        DocPreview
    },
    setup(){
        const docs = reactive<{docs: Document[]}>({docs: []});
        
        // Получаем телефон из state
        const clientPhone = computed(() => state.client?.phone || '');
        
        onMounted(async()=>{
            if (clientPhone.value) {
                try {
                    const response = await slon.getDocs({phone: clientPhone.value});
                    
                    // Проверяем различные форматы ответа
                    if (response && Array.isArray(response)) {
                        docs.docs = response;
                    } else if (response && response.status && Array.isArray(response.docs)) {
                        docs.docs = response.docs;
                    } else if (response && response.status && Array.isArray(response.data)) {
                        docs.docs = response.data;
                    } else {
                        docs.docs = [];
                    }
                } catch (error) {
                    docs.docs = [];
                }
            } else {
                docs.docs = [];
            }
        })

        return {docs};
    }
})
</script>

<style scoped>
.no-docs-message {
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
}

.no-docs-message p {
    margin: 0;
}
</style>