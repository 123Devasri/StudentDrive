import os
import json
import re
import numpy as np

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

EMBEDDING_DIM = 384

class LocalVectorStore:
    def __init__(self, storage_dir: str = None):
        if storage_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            storage_dir = os.path.join(base_dir, 'data', 'vector_store')
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self.vectors_file = os.path.join(self.storage_dir, 'vectors.npy')
        self.metadata_file = os.path.join(self.storage_dir, 'metadata.json')
        self.faiss_file = os.path.join(self.storage_dir, 'faiss.index')

        self.vectors = np.empty((0, EMBEDDING_DIM), dtype=np.float32)
        self.metadata = []
        self.faiss_index = None
        self._load()

    def _load(self):
        if os.path.exists(self.vectors_file) and os.path.exists(self.metadata_file):
            try:
                self.vectors = np.load(self.vectors_file).astype(np.float32)
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"Warning loading vector store, initializing new: {e}")
                self.vectors = np.empty((0, EMBEDDING_DIM), dtype=np.float32)
                self.metadata = []
        else:
            self.vectors = np.empty((0, EMBEDDING_DIM), dtype=np.float32)
            self.metadata = []

        self._rebuild_faiss()

    def _rebuild_faiss(self):
        if HAS_FAISS:
            self.faiss_index = faiss.IndexFlatIP(EMBEDDING_DIM)
            if len(self.vectors) > 0:
                self.faiss_index.add(self.vectors)
        else:
            self.faiss_index = None

    def save(self):
        np.save(self.vectors_file, self.vectors)
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        self._rebuild_faiss()

    def add_chunks(self, chunks: list, embeddings: np.ndarray):
        if not chunks or len(chunks) == 0:
            return
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings length mismatch")

        # First remove any existing chunks for this resource to prevent duplicates
        resource_id = chunks[0]['resource_id']
        user_id = chunks[0]['user_id']
        self.delete_resource(user_id, resource_id, save_after=False)

        # Normalize embeddings for cosine similarity (Inner Product)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized_embeddings = (embeddings / norms).astype(np.float32)

        if len(self.vectors) == 0:
            self.vectors = normalized_embeddings
        else:
            self.vectors = np.vstack([self.vectors, normalized_embeddings])

        self.metadata.extend(chunks)
        self.save()

    def delete_resource(self, user_id: int, resource_id: int, save_after: bool = True):
        keep_indices = []
        new_metadata = []
        for idx, item in enumerate(self.metadata):
            if item.get('user_id') == user_id and item.get('resource_id') == resource_id:
                continue
            keep_indices.append(idx)
            new_metadata.append(item)

        if len(keep_indices) == len(self.metadata):
            return  # Nothing changed

        if len(keep_indices) == 0:
            self.vectors = np.empty((0, EMBEDDING_DIM), dtype=np.float32)
            self.metadata = []
        else:
            self.vectors = self.vectors[keep_indices]
            self.metadata = new_metadata

        if save_after:
            self.save()

    def _compute_keyword_score(self, query: str, text: str) -> float:
        if not query or not text:
            return 0.0
        query_terms = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 2]
        if not query_terms:
            return 0.0

        text_lower = text.lower()
        matches = 0
        for term in query_terms:
            if term in text_lower:
                matches += 1

        phrase_bonus = 0.5 if query.lower().strip() in text_lower else 0.0
        score = (matches / len(query_terms)) + phrase_bonus
        return min(score, 1.0)

    def search(self, user_id: int, subject_id: int, unit_id: int, query_vector: np.ndarray, query_text: str = "", top_k: int = 5, min_score: float = None) -> list:
        if min_score is None:
            min_score = float(os.getenv('RAG_MIN_SCORE', '0.15'))

        if len(self.vectors) == 0 or len(self.metadata) == 0:
            return []

        # Normalize query vector
        q_norm = np.linalg.norm(query_vector)
        if q_norm == 0:
            q_norm = 1.0
        norm_q = (query_vector / q_norm).astype(np.float32)

        # FAISS search vs NumPy matrix dot product
        if HAS_FAISS and self.faiss_index is not None and self.faiss_index.ntotal == len(self.vectors):
            scores = np.dot(self.vectors, norm_q.T).flatten()
        else:
            scores = np.dot(self.vectors, norm_q.T).flatten()

        candidate_indices = []
        for idx, item in enumerate(self.metadata):
            # Strict unit scoping
            if (item.get('user_id') == user_id and 
                item.get('subject_id') == subject_id and 
                item.get('unit_id') == unit_id):

                vec_score = float(scores[idx])
                kw_score = self._compute_keyword_score(query_text, item.get('text', ''))

                # Hybrid score weighting: 70% vector + 30% keyword match
                hybrid_score = (0.7 * vec_score) + (0.3 * kw_score)

                if hybrid_score >= min_score:
                    candidate_indices.append((hybrid_score, vec_score, kw_score, idx))

        # Sort descending by hybrid score
        candidate_indices.sort(key=lambda x: x[0], reverse=True)

        results = []
        for hybrid_score, vec_score, kw_score, idx in candidate_indices[:top_k]:
            item = self.metadata[idx]
            results.append({
                'chunk_id': item.get('chunk_id'),
                'resource_id': item.get('resource_id'),
                'resource_name': item.get('resource_name'),
                'subject_id': item.get('subject_id'),
                'folder_id': item.get('folder_id'),
                'unit_id': item.get('unit_id'),
                'user_id': item.get('user_id'),
                'page': item.get('page'),
                'page_number': item.get('page_number'),
                'slide_number': item.get('slide_number'),
                'text': item.get('text'),
                'score': round(hybrid_score, 4),
                'vector_score': round(vec_score, 4),
                'keyword_score': round(kw_score, 4),
            })

        return results
