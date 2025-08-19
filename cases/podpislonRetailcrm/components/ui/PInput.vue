<template>
    <div class="cinput-container" 
        :class="{active: modelValue || focused, error: !status}" 
        @click="handleClick">
        <div class="cinput-title">{{ placeholder }}</div>   
        <input class="input" ref="tInput" 
            @focus="focused=true" 
            @blur="focused=false"
            type="text" @input="updateVal"
            :value="modelValue"
            :required="required"
            >
    </div>
    <div class="hint" :class="{error: !status}" v-if="hint?.length && !status">{{ hint }}</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
name: 'PInput',
props: {
    modelValue: String,
    placeholder: String,
    required: Boolean,
    hint: String,
    status: Boolean
},
emits:['update:modelValue'],
setup(props, { emit }){
    const tInput = ref<HTMLElement>();
    const focused = ref<boolean>(false);

    const handleClick = () => {
        // Безопасный вызов focus() с проверкой
        if (tInput?.value && typeof tInput.value.focus === 'function') {
            tInput.value.focus();
        }
    };

    const updateVal = (e: Event) => {
        if(e.target instanceof HTMLInputElement) {
            emit('update:modelValue', e.target.value);
        }
    };

    return {tInput, focused, handleClick, updateVal}
}
});
</script>

<style scoped>
.cinput-container {
    border-radius: 6px;
    border: 1px solid var(--lines-color);
    padding: 16px;
    position: relative;
    cursor: text;
    height: 56px;
    box-sizing: border-box;
    overflow: hidden;
    margin-bottom: 16px;
    background: #fff;
    transition: all 0.2s ease;
}

.cinput-container:hover {
    border-color: var(--main-color);
}

.cinput-container.active {
    padding-top: 8px;
    border-color: var(--main-color);
    box-shadow: 0 0 0 3px rgba(255, 168, 0, 0.1);
}

.cinput-container.error {
    border-color: var(--accent-danger);
    background-color: #FEDFE0;
}

.cinput-title {
    color: var(--primary-dark);
    font-size: 14px;
    transition: all 0.2s ease;
    position: absolute;
    top: 16px;
    left: 16px;
}

.cinput-container.active .cinput-title {
    font-size: 12px;
    top: 8px;
    color: var(--main-color);
}

.input {
    border: none;
    outline: none;
    width: 100%;
    background-color: transparent;
    font-size: 14px;
    color: var(--primary-black);
    margin-top: 8px;
}

.input::placeholder {
    color: var(--primary-dark);
}

.hint {
    color: var(--accent-danger);
    font-size: 12px;
    padding-left: 16px;
    margin-top: -12px;
    margin-bottom: 16px;
}
</style>