<template>
    <button 
        class="simple-btn" 
        :class="[`btn-${variant || 'primary'}`, { disabled }]"
        :disabled="disabled"
        @click="handleClick"
        type="button"
    >
        {{ title }}
    </button>
</template>

<script setup lang="ts">
import { watch } from 'vue';

interface Props {
    title: string;
    variant?: string;
    disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    disabled: false
});

const emit = defineEmits<{
    click: [event: Event];
}>();

const handleClick = (event: Event) => {
    if (!props.disabled) {
        emit('click', event);
    }
};
</script>

<style scoped>
.simple-btn {
    background-color: #ffa800;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    padding: 11px;
    transition: background-color 0.2s ease;
    width: 100%;
}

.simple-btn:hover:not(.disabled) {
    background-color: #ffcb00;
}

.simple-btn.disabled,
.simple-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
}

.simple-btn.btn-grey {
    background-color: #71757f;
}

.simple-btn.btn-grey:hover:not(.disabled) {
    background-color: #5a5f69;
}
</style> 