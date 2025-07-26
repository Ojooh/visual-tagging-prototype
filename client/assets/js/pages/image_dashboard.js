export default {
    name: 'Home',

    setup() {
		const { ref, onMounted, reactive } 	= Vue;
		const images 				= ref([]);
		const title 				= "Image Dashboard";
		const processing 			= reactive(new Set());
		const selected_images 		= reactive(new Set());
		const select_all 			= ref(false);
		const retry_counts 			= reactive({}); 
		const timers 				= reactive({});  
		const interval_ids 			= reactive({});
		const MAX_RETRIES 			= 3;
		const COUNTDOWN_TIME 		= 10;

		// Async function to fetch image data from backend
		const fetchImages = async () => {
			try {
				const res = await axios.get('/api/image-tagger/images');

				console.log({ images: res.data.data })

				if (res.data.status) { 
					images.value = res.data.data; 
					selected_images.clear();
					processing.clear();
					select_all.value = false;
				} 
				else {
					console.warn("Image fetch failed:", res.data.message || res.data);
				}
			} 
			catch (err) {
				console.error("Error fetching images:", err);
			}
		}

		// Navigate to Upload page
		const goToUpload = () => {
			window.history.pushState({}, '', '/upload');
			window.dispatchEvent(new PopStateEvent('popstate'));
		}

		const checkImageStatus = async (image_id) => {
			retry_counts[image_id] = retry_counts[image_id] || 0;

			if (timers[image_id] > 0) {
				timers[image_id]--;
				return;
			}

			clearInterval(interval_ids[image_id]);
			delete interval_ids[image_id];

			await fetchImages();
			const image = images.value.find(img => img.image_id === image_id);

			if (image && image.tags && image.tags.length > 0) {
				processing.delete(image_id);
				delete timers[image_id];
				delete retry_counts[image_id];
			} 
			else {
				retry_counts[image_id]++;
				if (retry_counts[image_id] >= MAX_RETRIES) {
					processing.delete(image_id);
					delete timers[image_id];
					delete retry_counts[image_id];
				} 
				else { startCountdown(image_id); }
      		}
		}

		// Helper: start countdown for an image
		const startCountdown = (image_id) => {
			timers[image_id] = COUNTDOWN_TIME;

			// Prevent multiple intervals
			if (interval_ids[image_id]) clearInterval(interval_ids[image_id]);

			interval_ids[image_id] = setInterval(() => { checkImageStatus(image_id); }, 1000);
		};


		// Accepts array of url_paths to analyze
		const analyzeImages = async (image_ids) => {
			try {
				image_ids.forEach(id => {
					processing.add(id);
					startCountdown(id);
				});
				
				await axios.post('/api/image-tagger/analyze', { image_ids });

				// Remove from processing and selected sets
				image_ids.forEach(id => { selected_images.delete(id); });

				select_all.value = false;
			} 
			catch (error) {
				console.error("Analyze failed", error);
				image_ids.forEach(id => processing.delete(id));
			}
		};

		// Analyze single image
		const analyzeSingle = (img) => { analyzeImages([img?.image_id]); };

		// Handle select all toggle
		const toggleSelectAll = () => {
			if (select_all?.value) {
				images.value.forEach(img => {
					if (!img.tags || img.tags.length === 0) {
						selected_images.add(img?.image_id);
					}
				});
			} 
			else { selected_images.clear(); }
		};

		// Handle individual checkbox toggle
		const toggleSelectImage = (id) => {
			if (selected_images.has(id)) { selected_images.delete(id); }

			else { selected_images.add(id); }

			// Update select_all if all untagged selected
			const untagged_ids 		= images.value.filter(img => !img.tags || img.tags.length === 0).map(i => i.image_id);
			select_all.value 		= untagged_ids.length > 0 && untagged_ids.every(id => selected_images.has(id));
		};

		// Analyze selected images in bulk
		const analyzeSelected = () => {
			if (selected_images.size === 0) { return };
			analyzeImages(Array.from(selected_images));
		};

		// Fetch images when component mounts
		onMounted(() => { fetchImages(); });

      	return { 
			title, images, goToUpload, analyzeSingle, selected_images, toggleSelectImage, select_all, 
			toggleSelectAll, analyzeSelected, processing, timers
		};
    },

    template: `
    	<div>
			<h1>📸 {{ title }}</h1>
			<button @click="goToUpload">Upload Images</button>

			<div v-if="images.length === 0">
				<p>No images found for this session.</p>
			</div>

			<div v-else>
				<div style="margin: 1rem 0;">
				<label>
					<input type="checkbox" v-model="select_all" @change="toggleSelectAll" />
					Select All Untagged Images
				</label>

				<button :disabled="selected_images.size === 0" @click="analyzeSelected" style="margin-left: 1rem;">
					Analyze Selected ({{ selected_images.size }})
				</button>
				</div>

				<div class="image-grid">
					<div class="image-card" v-for="img in images" :key="img.image_idimage_id">
						<img :src="img.url_path" alt="Image" />
						
						<div class="tags" v-if="img.tags && img.tags.length > 0">
							<span class="tag" v-for="tag in img.tags" :key="tag.label">
								{{ tag.label }} ({{ tag.score.toFixed(2) }})
							</span>
						</div>

						<div v-else class="no-tags">
							<label>
								<input type="checkbox" :value="img.image_id" v-model="selected_images" @change="toggleSelectImage(img.image_id)" />
								Select
							</label>
							<button
								:disabled="processing.has(img.image_id)"
								@click="analyzeSingle(img)"
							>
								<span v-if="processing.has(img.image_id)">
									Processing... ({{ timers[img.image_id] || 10 }}s)
								</span>

								<span v-else>Analyze</span>
							</button>
            			</div>
          			</div>
        		</div>
      		</div>
    	</div>
  	`,
};
