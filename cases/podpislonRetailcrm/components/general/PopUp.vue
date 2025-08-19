<template>
    <teleport to="body">
      <div v-if="modalOpen" class="modal-container">
        <div class="modal">
          <slot></slot>
            <button type="button" class="close-btn" @click="handleClose">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <rect x="1.36133" width="22.1161" height="1.92314" rx="0.961571" transform="rotate(45 1.36133 0)" fill="white"/>
                    <rect x="16.998" y="1.35974" width="22.1161" height="1.92314" rx="0.961571" transform="rotate(135 16.998 1.35974)" fill="white"/>
                </svg>
            </button>
        </div>
      </div>
    </teleport>
</template>

<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
    name: 'PopUp',
    props: {
        modalOpen: {
            required: true,
            type: Boolean,
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const handleClose = () => {
            emit('close');
        };

        return {
            handleClose
        };
    }
})
</script>

<style scoped>
.modal-container{
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.1);
}
.modal{
    padding: 15px;
    background-color: #fff;
    border-radius: 6px;
    margin: 0 auto;
    width: fit-content;
    top: 50%;
    position: relative;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
}
.close-btn{
    position: absolute;
    top: 20px;
    left: 0;
    transform: translateX(-100%);
    padding: 8px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    background-color: #a7a7a7;
    border: none;
    cursor: pointer;
}
</style>