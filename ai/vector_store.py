import os
import json
import numpy as np

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
        self.vectors = np.empty((0, EMBEDDING_DIM), dtype=np.float32)
        self.metadata = []
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

    def save(self):
        np.save(self.vectors_file, self.vectors)
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

    def add_chunks(self, chunks: list, embeddings: np.ndarray):
        if not chunks or len(chunks) == 0:
            return
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings length mismatch")

        # First remove any existing chunks for this resource to prevent duplicates
        resource_id = chunks[0]['resource_id']
        user_id = chunks[0]['user_id']
        self.delete_resource(user_id, resource_id, save_after=False)

        # Normalize embeddings for cosine similarity
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

    def search(self, user_id: int, subject_id: int, query_vector: np.ndarray, top_k: int = 5, min_score: float = 0.20) -> list:
        if len(self.vectors) == 0 or len(self.metadata) == 0:
            return []

        # Normalize query vector
        q_norm = np.linalg.norm(query_vector)
        if q_norm == 0:
            q_norm = 1.0
        norm_q = (query_vector / q_norm).astype(np.float32)

        # Cosine similarity via matrix multiplication
        scores = np.dot(self.vectors, norm_q.T).flatten()

        # Filter and rank by user_id and subject_id
        candidate_indices = []
        for idx, item in enumerate(self.metadata):
            if item.get('user_id') == user_id and item.get('subject_id') == subject_id:
                score = float(scores[idx])
                if score >= min_score:
                    candidate_indices.append((score, idx))

        # Sort descending by score
        candidate_indices.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, idx in candidate_indices[:top_k]:
            item = self.metadata[idx]
            results.append({
                'chunk_id': item.get('chunk_id'),
                'resource_id': item.get('resource_id'),
                'resource_name': item.get('resource_name'),
                'subject_id': item.get('subject_id'),
                'user_id': item.get('user_id'),
                'page': item.get('page'),
                'text': item.get('text'),
                'score': score
            })

        return results
