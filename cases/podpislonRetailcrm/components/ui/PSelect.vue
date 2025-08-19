<template>
    <div class="cselect-container" :class="{active: modelValue}" @click="handleToggleShow">
        <div class="cselect-title">{{ title }}</div>
        <div class="cselect-value">{{ selected }}</div>
        <ArrowDownIcon class="cselect-arrow"/>
        <div class="options-container" v-show="show">
          <div class="option" v-for="option in options" :key="`option_${option.id}`"
            @click="handleOptionClick(option.id)"
          >{{ option.title }}</div>
        </div>
    </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import ArrowDownIcon from '../icons/ArrowDownIcon.vue';
import type { SItem } from '../../interfaces/interface';

export default defineComponent({
  name: 'PSelect',
  components:{ArrowDownIcon},
  props:{
    title: String,
    modelValue: {
      type: Number,
      default: 0
    },
    options: Array as PropType<Array<SItem>>
  },
  emits: ['update:modelValue'],
  setup(props, { emit }){
    const show = ref<boolean>(false)
    const selected = computed(() => {
      if(props.modelValue <= 0 || !props.options?.length) return null;
      const selItem = props.options.find(item => item.id === props.modelValue)
      let title = selItem?.title ?? null
      if(title && title.length > 34){
        title = title.slice(0,33) + '...'
      }
      return title;
    })

    const handleOptionClick = (optionId: number) => {
      emit('update:modelValue', optionId);
    }

    const handleToggleShow = (event?: any) => {
      // Prevent the event object from being passed through
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      show.value = !show.value;
    }

    return {show, selected, handleOptionClick, handleToggleShow}
  },
  
});
</script>

<style>
.cselect-container{
    border-radius: 4px;
    border: 1px solid var(--lines-color);
    padding: 15px;
    position: relative;
    cursor: pointer;
    height: 50px;
    box-sizing: border-box;
}
.cselect-container.active{
  padding-top: 7px;
}
.cselect-title{
  color: var(--primary-dark);
  font-size: 14px;
  transition: font-size 0.5s;
}
.cselect-container.active .cselect-title{
  font-size: 11px;
}
.cselect-arrow{
  position: absolute;
  right: 15px;
  top: 50%;
}
.options-container{
  position: absolute;
  top: 100%;
  box-shadow: 0px 2px 24px 0px #001D6614;
  padding: 16px;
  width: calc(100% - 32px);
  left: 0;
  background-color: #fff;
}
.options-container .option{
  margin-bottom: 16px;
  font-size: 14px;
}
.options-container .option:hover{
  text-decoration: underline;
  color: var(--main-accent);
}
</style>