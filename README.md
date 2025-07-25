# 🧠 Visual Image Tagging Service

A robust Node.js + Python hybrid service for analyzing and tagging images using OpenAI's CLIP model. The system supports batch image uploads, validation, caching of tag results, session tracking, and extensibility for model configuration and distributed scaling.

---

## 🚀 Features

* 🔍 **Image Tagging** via OpenAI's CLIP vision-language model
* 💾 **File-based caching** to avoid redundant analysis
* 🛡️ **Validation** for file size, type, and image count
* 📁 **Session-aware image uploads and retrieval**
* ⚡ **In-memory batch processing queue** for efficient asynchronous image analysis
* 📦 **Python Bridge Integration** using child processes
* 🗂️ **Modular structure** for validators, services, middleware, and routes
* 📊 **Batch processing** and session tracking
* 📁 **EJS view support** for frontend visualization

---

## 🛠️ Tech Stack

* **Backend**: Node.js + Express
* **ML Model**: Python (Hugging Face Transformers – CLIP)
* **Image Processing**: Pillow, Torch, Transformers
* **Caching**: JSON file-based with session-aware keys
* **Frontend**: EJS templating
* **Middleware**: Cookie/session tracking, CORS, HTTPS enforcement

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/Ojooh/visual-tagging-prototype.git
cd visual-tagging-prototype

# Install Node.js dependencies
npm install

# Create Python virtual environment and install ML dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start server
npm run dev
```

> Ensure Python is installed and available on the system path.

---

## 🌐 API Usage

### 1. Upload Images

**Endpoint:** `POST /api/image-tagger/upload`

* Upload multiple images linked to your session (via cookies)
* Validates file size, type, and image count

**Response:**

```json
{
  "status": true,
  "msg": "images_uploaded",
  "data": [
    {
      "image_id": "abc123",
      "file_path": "/local_uploads/image_file_uploads/sessionId/abc123.jpg"
    }
  ]
}
```

---

### 2. Get Session Images

**Endpoint:** `GET /api/image-tagger/session-images`

* Returns all images and cached tags linked to your session

**Response:**

```json
{
  "status": true,
  "msg": "session_images_fetched",
  "data": [
    {
      "image_id": "abc123",
      "file_path": "/local_uploads/image_file_uploads/sessionId/abc123.jpg",
      "tags": [
        { "label": "cat", "score": 0.91 },
        { "label": "indoor", "score": 0.85 }
      ]
    }
  ]
}
```

---

### 3. Analyze Images by IDs

**Endpoint:** `POST /api/image-tagger/analyze-by-ids`

* Submit image IDs to get cached tag results immediately
* Triggers asynchronous batch processing for uncached images in background
* Returns `true` if background processing started successfully

**Response:**

```json
{
  "status": true,
  "msg": "analysis_queued",
  "data": true
}
```

---

## 🧱 Project Structure

```
📦 visual-tagging-prototype.git
 ┣ 📂bin/                # Startup script
 ┣ 📂controllers/        # Route handlers (image_tagger_controller.js, client_view_controller.js)
 ┣ 📂database/           # Cached image tags storage (JSON files)
 ┣ 📂enums/              # Constants
 ┣ 📂local_uploads/      # Uploaded images, session-separated folders
 ┣ 📂logs/               # Logs
 ┣ 📂middle_wares/       # Middleware (cookies, cors, response handlers)
 ┣ 📂modules/            # Core logic
 ┃ ┣ 📂image_tagger/     # Validator, manager, service, in-memory queue
 ┃ ┣ 📂python_image_tagger_analyzer/ # Python bridge and ML scripts
 ┣ 📂routes/             # API and view routers
 ┣ 📂utils/              # Helpers and utilities
 ┣ 📜app.js              # App entry
 ┗ 📜package.json
```

---

## ⚙️ System Design & Scaling Recommendations

### Current Design Highlights

* **Session-aware image management:** Users upload images linked to sessions, allowing isolated access and analysis.
* **In-memory batch queue:** Incoming image analysis requests are queued and processed in short batches asynchronously, reducing Python bridge overhead and redundant analysis.
* **File-based caching:** Tags are cached per image path and session ID for fast retrieval.

### Proposed Scaling Architecture

```plaintext
+-----------------------+
|      Frontend UI      |
+----------+------------+
           |
           v
+-----------------------+
|      Node.js API      |  <-- Handles session, validation, caching
+----------+------------+
           |
           v
+-----------------------+      +------------------+
|   In-Memory Queue     | ---> |  Python ML Model  |  <-- Decoupled microservice (Flask/FastAPI)
| (Batch processing)    |      +------------------+
+----------+------------+
           |
           v
+-----------------------+
|  Cache Storage (JSON, Redis, etc.)  |
+-----------------------+
```

### Future Enhancements

* Replace Python bridge child processes with a dedicated Python microservice for scalable and low-latency model inference.
* Use Redis or other persistent queue systems (e.g., BullMQ, RabbitMQ) for distributed job management.
* Implement cache expiry and invalidation strategies.
* Add dynamic label support and user-specific configurations.
* Add robust authentication and security hardening.
* Integrate detailed logging and error monitoring (e.g., Sentry).

---

## 🧰 Additional Recommendations

* ✅ **Security**:

  * Sanitize uploaded file names to avoid directory traversal attacks.
  * Add file size limits to prevent abuse.

* ✅ **Logging**:

  * Use structured logs with timestamps and session IDs.
  * Implement rotating log system (e.g., `winston-daily-rotate-file`).

* ✅ **Unit & Integration Tests**:

  * Tests for validation, caching, Python bridge integration, and API correctness.

* ✅ **Error Monitoring**:

  * Integrate with tools like Sentry or LogRocket.

---

## 📜 License

MIT – © David Matt-Ojo

---

## 🤝 Contributing

PRs and feedback are welcome. Please open issues for bugs or feature suggestions.
