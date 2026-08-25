import re

def split_text_into_chunks(text: str, chunk_size: int = 800, overlap: int = 150) -> list:
    """
    Splits text into chunks of roughly chunk_size characters with overlap,
    avoiding breaking sentences in the middle where possible.
    """
    if not text:
        return []

    # Split by paragraphs or sentences
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    if not paragraphs:
        paragraphs = [text.strip()]

    chunks = []
    current_chunk = []
    current_len = 0

    for paragraph in paragraphs:
        p_len = len(paragraph)
        if current_len + p_len <= chunk_size:
            current_chunk.append(paragraph)
            current_len += p_len + 1
        else:
            if current_chunk:
                combined = "\n\n".join(current_chunk).strip()
                if combined:
                    chunks.append(combined)
                # Keep last part for overlap
                current_chunk = [paragraph]
                current_len = p_len
            else:
                # Paragraph itself is longer than chunk_size, split by sentences
                sentences = re.split(r'(?<=[.?!])\s+', paragraph)
                for sentence in sentences:
                    s_len = len(sentence)
                    if current_len + s_len <= chunk_size:
                        current_chunk.append(sentence)
                        current_len += s_len + 1
                    else:
                        if current_chunk:
                            chunks.append(" ".join(current_chunk).strip())
                        current_chunk = [sentence]
                        current_len = s_len

    if current_chunk:
        combined = "\n\n".join(current_chunk).strip()
        if combined:
            chunks.append(combined)

    return chunks


def process_document_pages(pages: list, user_id: int, subject_id: int, resource_id: int, resource_name: str) -> list:
    """
    Takes extracted pages and returns a list of chunk dicts with complete metadata.
    """
    all_chunks = []
    chunk_index = 0

    for page_info in pages:
        page_num = page_info.get('page', 1)
        text = page_info.get('text', '')
        page_chunks = split_text_into_chunks(text)

        for chunk_text in page_chunks:
            if not chunk_text.strip():
                continue
            all_chunks.append({
                'chunk_id': f"{resource_id}_{page_num}_{chunk_index}",
                'resource_id': resource_id,
                'resource_name': resource_name,
                'subject_id': subject_id,
                'user_id': user_id,
                'page': page_num,
                'chunk_index': chunk_index,
                'text': chunk_text.strip()
            })
            chunk_index += 1

    return all_chunks
