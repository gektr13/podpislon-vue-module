<template>
  <ShadowBlock style="margin-bottom: 16px;" v-if="company">
    <div class="company-block">
        <portfel-icon />
        <div class="title">{{ company.title }}</div>
    </div>
  </ShadowBlock>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import PortfelIcon from "../icons/PortfelIcon.vue";
import ShadowBlock from "./ShadowBlock.vue";
import { CompanyInfo } from "../../interfaces/company";
export default defineComponent({
  name: "CompanyBlock",
  components: { ShadowBlock, PortfelIcon },
  props: {
      company: {
          type: Object as PropType<CompanyInfo>
      }
  }
});
</script>

<style>
.company-block {
  display: flex;
}
</style>