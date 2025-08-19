<template>
    <ShadowBlock>
        <div class="doc" v-for="(doc, idx) in docs" :key="`cdoc_${doc.id}`" @click="handleToggle(idx, $event)">
            <CheckBoxComp v-model="doc.checked"/>
            <div class="doc-title">{{ doc.name }}</div>
        </div>
        <div class="btns">
            <PButton title="Сохранить" @click="handleSave"/>
            <PButton title="Отмена" type="grey" @click="handleResume"/>
        </div>
    </ShadowBlock>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue'
import ShadowBlock from '../blocks/ShadowBlock.vue';
import CheckBox from '../ui/CheckBox.vue';
import type { ClientDoc } from '../../interfaces/interface';
import PButton from '../ui/PButton.vue';

export default defineComponent({
    name: 'DocsList',
    components: {
        ShadowBlock,
        CheckBoxComp: CheckBox,
        PButton
    },
    props:{
        docs: Array as PropType<Array<ClientDoc>>
    },
    emits:['checkDoc', 'save', 'resume'],
    setup(props, { emit }) {
        const toggle = (idx: number) => {
            emit('checkDoc', idx)
        }
        
        const handleToggle = (idx: number, event?: any) => {

            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            toggle(idx);
        }
        
        const handleSave = () => {
            emit('save')
        }
        
        const handleResume = () => {
            emit('resume')
        }
        
        return {
            toggle,
            handleToggle,
            handleSave,
            handleResume
        }
    }
})
</script>

<style>
.doc{
    display: flex;
    cursor: pointer;
    margin-bottom: 16px;
}
</style>

<style scoped>
.btns{
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
}
.btns .btn{
    flex: 1 !important;
    width: auto !important;
}
</style>

<style>
.btns .btn.podpislon-custom-btn {
    width: auto !important;
    flex: 1 !important;
    display: inline-block !important;
}

.btns {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    gap: 12px !important;
}

.btns .btn {
    flex: 1 !important;
    width: auto !important;
    display: inline-block !important;
}
</style>