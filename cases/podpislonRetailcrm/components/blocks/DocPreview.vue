<template>
  <shadow-block class="mb16 sb-doc_preview">
    <div class="doc_preview-container">
      <div class="doc-title">{{ doc?.name }}</div>
      <div class="download-btn" @click="download"><DownloadIcon /></div>
      <div class="contact">{{ doc?.contact?.name }}</div>
      <div class="status" :class="status_class">{{ doc?.status_text }}</div>
      <div class="date">{{ doc?.date_create }}</div>
    </div>
  </shadow-block>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import ShadowBlock from "./ShadowBlock.vue";
import { Document } from "../../interfaces/document";
import DownloadIcon from "../icons/DownloadIcon.vue";
import slon from "../../api/slon";
import { state } from "../../store/state";

export default defineComponent({
  name: "DocPreview",
  components: { ShadowBlock, DownloadIcon },
  props: {
    doc: { type: Object as PropType<Document> },
  },
  setup(props) {
    const status_class = ref<string>("");

    if (props.doc) {
      if (+props.doc?.status === 30) {
        status_class.value = "success";
      } else if (+props.doc?.status === 40) {
        status_class.value = "cancelled";
      }
    }

    const download = async () => {
      if (!props.doc?.id) {
        alert('Ошибка: ID документа не найден');
        return;
      }
      
      const data = new FormData();
      data.append('id', ''+props.doc?.id);
      
      try {
        const res = await slon.loadFile(data);

        if(!res.status){ 
          alert('Ошибка при загрузке файла');
          return;  
        }
        
        const base64 = res.result || res.file || res.data;
        if (!base64) {
          alert('Ответ без файла');
          return;
        }

        // base64 -> Blob -> objectURL
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const filename = props.doc?.name ? (props.doc?.name.endsWith('.pdf') ? props.doc?.name : `${props.doc?.name}.pdf`) : 'document.pdf';
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        alert('Ошибка при загрузке файла: ' + error);
      }
    };

    return {
      status_class,
      download,
    };
  }
});
</script>

<style>
.doc_preview-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  cursor: pointer;
}
.sb-doc_preview {
  border: 1px solid transparent;
}
.sb-doc_preview:hover {
  border-color: #e0e3eb;
}
.sb-doc_preview:hover .download-btn svg path {
  fill: black !important;
}
.doc_preview-container .doc-title {
  margin-left: 0;
  margin-bottom: 8px;
  font-size: 12px;
  max-width: calc(100% - 20px);
}
.contact {
  width: 100%;
  font-weight: 500;
  font-size: 12px;
  margin-bottom: 8px;
}
.date {
  color: var(--primary-dark);
  font-size: 11px;
  font-weight: 500;
}
.status {
  padding: 3px 13px;
  border-radius: 12px;
  background-color: var(--main-accent);
  color: #fff;
  font-size: 11px;
}
.status.success {
  background-color: var(--accent-positive);
}
.status.cancelled {
  background-color: var(--accent-danger);
}

.download-btn {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.download-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>