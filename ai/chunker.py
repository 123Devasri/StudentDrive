import re

def split_text_into_chunks(text: str, chunk_size: int = 600, overlap: int = 120) -> list:
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
                current_chunk = [paragraph]
                current_len = p_len
            else:
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


def process_document_pages(pages: list, user_id: int, subject_id: int, unit_id: int, resource_id: int, resource_name: str, folder_id: int = None) -> list:
    """
    Takes extracted pages and returns a list of chunk dicts with complete metadata.
    """
    all_chunks = []
    chunk_index = 0

    for page_info in pages:
        page_num = page_info.get('page', 1)
        page_number = page_info.get('page_number')
        slide_number = page_info.get('slide_number')
        text = page_info.get('text', '')
        page_chunks = split_text_into_chunks(text)

        for chunk_text in page_chunks:
            if not chunk_text.strip():
                continue
            all_chunks.append({
                'chunk_id': f"{resource_id}_{chunk_index}",
                'resource_id': resource_id,
                'resource_name': resource_name,
                'user_id': user_id,
                'subject_id': subject_id,
                'folder_id': folder_id,
                'unit_id': unit_id,
                'page': page_num,
                'page_number': page_number,
                'slide_number': slide_number,
                'chunk_index': chunk_index,
                'text': chunk_text.strip()
            })
            chunk_index += 1

    return all_chunks
