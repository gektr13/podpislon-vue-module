<template>
    <div class="switcher-block" :class="{checked: modelValue}" @click="$emit('update:modelValue', !modelValue)">
        <div class="switcher">
            <div class="switcher-round"></div>
        </div>
        <label>{{ label }}</label>
    </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: 'PSwitcher',
  props: {
    modelValue: Boolean,
    label: String
  },
  emits: ['update:modelValue']
})
</script>

<style>
.switcher-block {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    margin-bottom: 16px;
}

.switcher {
    width: 44px;
    height: 24px;
    background-color: var(--lines-color);
    border-radius: 12px;
    position: relative;
    transition: background-color 0.2s ease;
}

.switcher-round {
    background-color: #fff;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switcher-block.checked .switcher {
    background-color: var(--main-color);
}

.switcher-block.checked .switcher-round {
    transform: translateX(20px);
}

.switcher-block label {
    color: var(--primary-black);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

.switcher-block:hover .switcher {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>