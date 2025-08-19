<template>
  <button class="btn podpislon-custom-btn" :class="`btn-${type}`" :style="customStyle" @click="$emit('click')" :data-type="type">{{ title }}</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PButton',
  props: {
    title: String,
    type: String,
    customStyle: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['click']
});
</script>

<style scoped>
    .btn.podpislon-custom-btn{
        background: #ffa800 !important;
        background-color: #ffa800 !important;
        background-image: none !important;
        border: none !important;
        border-radius: 4px !important;
        color: #fff !important;
        width: 100% !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        font-family: "Inter", sans-serif !important;
        text-align: center !important;
        display: block !important;
        box-sizing: border-box !important;
        padding: 11px !important;
        height: auto !important;
        line-height: normal !important;
        text-decoration: none !important;
        user-select: none !important;
        vertical-align: middle !important;
        transition: background-color 0.2s ease !important;
    }
    
    .btn.podpislon-custom-btn:hover{
        background: #ffcb00 !important;
        background-color: #ffcb00 !important;
        background-image: none !important;
    }
    
    .btn.podpislon-custom-btn.btn-grey{
      background: #5a5f69 !important;
      background-color: #5a5f69 !important;
      background-image: none !important;
    }
    
    .btn.podpislon-custom-btn.btn-grey:hover{
      background: #4a4f59 !important;
      background-color: #4a4f59 !important;
      background-image: none !important;
    }
</style>

<style>
/* Глобальные стили для принудительного переопределения серой кнопки */
.btn.podpislon-custom-btn.btn-grey {
    background: #5a5f69 !important;
    background-color: #5a5f69 !important;
    background-image: none !important;
}

.btn.podpislon-custom-btn.btn-grey:hover {
    background: #4a4f59 !important;
    background-color: #4a4f59 !important;
    background-image: none !important;
}
</style>