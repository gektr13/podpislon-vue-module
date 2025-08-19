<template>
    <div class="checkbox" :class="{checked: modelValue}" @click="handleToggle" :title="'Checkbox state: ' + modelValue">
        <CheckedIcon v-if="modelValue" />
    </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue';
import CheckedIcon from '../icons/CheckedIcon.vue';
  
export default defineComponent({
    name: 'CheckBox',
    components:{CheckedIcon},
    props: {
      modelValue: Boolean,
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const toggle = () => {
            emit('update:modelValue', !props.modelValue)
        }
        
        const handleToggle = (event?: any) => {
            // Prevent the event object from being passed through
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            toggle();
        }
        
        return { toggle, handleToggle }
    }
});
</script>

<style scoped>
.checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.checkbox:hover {
    border-color: #007bff;
}

.checkbox.checked {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
}
</style>


