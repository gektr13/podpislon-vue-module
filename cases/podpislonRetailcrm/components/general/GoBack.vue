<template>
    <ArrowIcon @click="handleGoBack" class="go-back_btn"/>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import ArrowIcon from '../icons/ArrowIcon.vue'

export default defineComponent({
    name: 'GoBack',
    components: {ArrowIcon},
    emits: ['go-back'],
    setup(props, { emit }) {
        const handleGoBack = (event?: any) => {
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            emit('go-back');
        };

        return {
            handleGoBack
        };
    }
})
</script>

<style>
.go-back_btn{
    cursor: pointer;
    margin-bottom: 16px;
    display: block;
    transition: all 0.2s ease;
}

.go-back_btn:hover {
    opacity: 0.7;
    transform: scale(1.1);
}
</style>