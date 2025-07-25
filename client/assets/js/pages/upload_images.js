export default {
    name: 'Upload',

    setup() {
        const { ref }           = Vue;
        const selected_files    = ref([]);
        const is_uploading      = ref(false);

        // Handle file selection
        const handleFiles = (files) => {
            selected_files.value = Array.from(files).filter(f => f.type.startsWith('image/'));
        }

        // File input trigger
        const openFileDialog = () => { document.getElementById('fileInput').click(); }

        // Drag & Drop Events
        const onDrop = (event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
        }

        const onDragOver = (event) => { event.preventDefault(); }

        // Upload to backend
        const uploadFiles = async () => {
            try {
                if (selected_files.value.length === 0) return;

                is_uploading.value = true;
        
                const form_data = new FormData();
                selected_files.value.forEach(file => form_data.append('images', file));

                const headers   = {'Content-Type': 'multipart/form-data' }
                const res       = await axios.post('/api/image-tagger/upload', form_data, { headers });

                if (res.data.status) {
                    // Redirect to Dashboard
                    window.history.pushState({}, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                } 
                else {
                    alert('Upload failed: ' + (res.data.data?.msg || 'Unknown error'));
                }
            } 
            catch (error) {
                console.error('Upload error:', error);
                alert(`An error occurred during upload [REASON]: ${error.response?.data?.msg }.`);
            } 
            finally { is_uploading.value = false; }
        }

        return { selected_files, is_uploading, handleFiles, openFileDialog, onDrop, onDragOver, uploadFiles, URL  };
    },

  template: `
    <div class="upload-container">
        <h1>🖼️ Upload Images</h1>

        <div class="drop-zone"
            @click="openFileDialog"
            @dragover="onDragOver"
            @drop="onDrop">
            <p>Drag & drop images here or click to select</p>
            <input type="file" id="fileInput" accept="image/*" multiple @change="e => handleFiles(e.target.files)" hidden />
        </div>

        <div class="preview-grid" v-if="selected_files.length > 0">
            <div class="preview-item" v-for="(file, index) in selected_files" :key="index">
            <img :src="URL.createObjectURL(file)" />
            <p>{{ file.name }}</p>
            </div>
        </div>

        <button :disabled="is_uploading || selected_files.length === 0" @click="uploadFiles">
            {{ is_uploading ? 'Uploading...' : 'Upload Images' }}
        </button>
    </div>
  `
};
