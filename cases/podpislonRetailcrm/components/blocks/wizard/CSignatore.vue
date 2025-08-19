<template>
  <h2>Подписант</h2>
  <div class="input-block">
    <PInput
      @update:model-value="updateSign($event, 'name')"
      :modelValue="modelValue.name"
      placeholder="Имя"
      required
      :status="!!modelValue.name.length"
      hint="Поле обязательно для заполнения"
    />
  </div>
  <div class="input-block">
    <PInput
      required
      @update:model-value="updateSign($event, 'last_name')"
      :modelValue="modelValue.last_name"
      placeholder="Фамилия"
      :status="!!modelValue.last_name.length"
      hint="Поле обязательно для заполнения"
    />
  </div>
  <div class="input-block">
    <PInput
      @update:model-value="updateSign($event, 'second_name')"
      :modelValue="modelValue.second_name"
      placeholder="Отчество"
      :status="true"
    />
  </div>
  <div class="input-block">
    <PInput
      required
      @update:model-value="updateSign($event, 'phone')"
      :modelValue="modelValue.phone"
      placeholder="Телефон"
      :status="!!modelValue.phone.length"
      hint="Поле обязательно для заполнения"
    />
  </div>
</template>

<script lang="ts">
import PInput from "../../ui/PInput.vue";
import type { Signatory } from "../../../interfaces/interface";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "CSignatore",
  components: {
    PInput,
  },
  props: {
    modelValue: {
      type: Object as PropType<Signatory>,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  methods: {
    updateSign(e: string, prop: string) {
      this.$emit("update:modelValue", { ...this.modelValue, [prop]: e });
    },
  },
});
</script>

<style>
h2 {
  margin-bottom: 20px;
}
.input-block {
  margin-bottom: 16px;
}
</style>