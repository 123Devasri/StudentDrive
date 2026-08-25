import numpy as np
from sentence_transformers import SentenceTransformer

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        # Load lightweight SentenceTransformer model locally
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def embed_texts(texts: list) -> np.ndarray:
    """
    Embeds a list of texts and returns L2-normalized numpy array of shape (N, 384).
    """
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.astype(np.float32)

def embed_query(query: str) -> np.ndarray:
    """
    Embeds a single query text and returns normalized numpy array of shape (1, 384).
    """
    model = get_embedding_model()
    embedding = model.encode([query], convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False)
    return embedding.astype(np.float32)
