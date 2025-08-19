<template>
    <div class="simple-input-container" 
        :class="{active: modelValue || focused, error: !status}" 
        @click="handleClick">
        <div class="simple-input-title">{{ placeholder }}</div>   
        <input class="simple-input" ref="tInput" 
            @focus="focused=true" 
            @blur="focused=false"
            :type="type || 'text'" 
            @input="updateVal"
            v-model="inputValue"
            :required="required"
            >
    </div>
    <div class="simple-hint" :class="{error: !status}" v-if="hint?.length && !status">{{ hint }}</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
    modelValue?: string;
    placeholder?: string;
    required?: boolean;
    hint?: string;
    status?: boolean;
    type?: string;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    status: true,
    type: 'text'
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const tInput = ref<HTMLElement>();
const focused = ref<boolean>(false);
const inputValue = ref(props.modelValue);

// Синхронизируем inputValue с modelValue
watch(() => props.modelValue, (newValue) => {
    inputValue.value = newValue;
});

const handleClick = () => {
    // Безопасный вызов focus() с проверкой
    if (tInput?.value && typeof tInput.value.focus === 'function') {
        tInput.value.focus();
    }
};

const updateVal = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if(target) {
        inputValue.value = target.value;
        emit('update:modelValue', target.value);
    }
};
</script>

<style scoped>
.simple-input-container {
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    padding: 16px;
    position: relative;
    cursor: text;
    min-height: 56px;
    box-sizing: border-box;
    overflow: visible;
    margin-bottom: 16px;
    background: #fff;
    transition: all 0.2s ease;
}

.simple-input-container:hover {
    border-color: #ffa800;
}

.simple-input-container.active {
    border-color: #ffa800;
    box-shadow: 0 0 0 3px rgba(255, 168, 0, 0.1);
}

.simple-input-container.error {
    border-color: #dc3545;
    background-color: #FEDFE0;
}

.simple-input-title {
    color: #71757f;
    font-size: 14px;
    transition: all 0.2s ease;
    margin-bottom: 8px;
    display: block;
}

.simple-input-container.active .simple-input-title {
    font-size: 12px;
    color: #ffa800;
}

.simple-input {
    border: none;
    outline: none;
    width: 100%;
    background-color: transparent;
    font-size: 14px;
    color: #2b3134;
    padding: 0;
    margin: 0;
}

.simple-input::placeholder {
    color: #71757f;
}

.simple-hint {
    color: #dc3545;
    font-size: 12px;
    margin-bottom: 16px;
    margin-top: -12px;
    padding-left: 16px;
}
</style> 