import sys
import json
import argparse
from document_processor import extract_text_from_file
from chunker import process_document_pages
from embeddings import embed_texts, embed_query
from vector_store import LocalVectorStore

def cmd_process(args):
    try:
        pages = extract_text_from_file(args.file_path)
        folder_id = int(args.folder_id) if args.folder_id and args.folder_id != 'null' else None
        chunks = process_document_pages(
            pages=pages,
            user_id=int(args.user_id),
            subject_id=int(args.subject_id),
            unit_id=int(args.unit_id),
            resource_id=int(args.resource_id),
            resource_name=args.resource_name,
            folder_id=folder_id
        )
        if not chunks:
            print(json.dumps({'success': True, 'chunks_count': 0, 'chunks': [], 'message': 'No text extracted'}))
            return

        texts = [c['text'] for c in chunks]
        embeddings = embed_texts(texts)
        store = LocalVectorStore()
        store.add_chunks(chunks, embeddings)

        print(json.dumps({
            'success': True,
            'chunks_count': len(chunks),
            'chunks': chunks,
            'resource_id': args.resource_id,
            'resource_name': args.resource_name,
            'unit_id': args.unit_id
        }))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

def cmd_search(args):
    try:
        query_vec = embed_query(args.query)
        store = LocalVectorStore()
        top_k = int(args.top_k) if args.top_k else 5
        results = store.search(
            user_id=int(args.user_id),
            subject_id=int(args.subject_id),
            unit_id=int(args.unit_id),
            query_vector=query_vec,
            query_text=args.query,
            top_k=top_k
        )
        print(json.dumps({'success': True, 'results': results}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

def cmd_delete(args):
    try:
        store = LocalVectorStore()
        store.delete_resource(user_id=int(args.user_id), resource_id=int(args.resource_id))
        print(json.dumps({'success': True, 'message': 'Resource vectors deleted'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="StudentDrive Local RAG Service")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # process command
    p_proc = subparsers.add_parser("process")
    p_proc.add_argument("--user-id", required=True)
    p_proc.add_argument("--subject-id", required=True)
    p_proc.add_argument("--unit-id", required=True)
    p_proc.add_argument("--resource-id", required=True)
    p_proc.add_argument("--resource-name", required=True)
    p_proc.add_argument("--file-path", required=True)
    p_proc.add_argument("--folder-id", default=None)

    # search command
    p_search = subparsers.add_parser("search")
    p_search.add_argument("--user-id", required=True)
    p_search.add_argument("--subject-id", required=True)
    p_search.add_argument("--unit-id", required=True)
    p_search.add_argument("--query", required=True)
    p_search.add_argument("--top-k", default=5)

    # delete command
    p_del = subparsers.add_parser("delete")
    p_del.add_argument("--user-id", required=True)
    p_del.add_argument("--resource-id", required=True)

    args = parser.parse_args()

    if args.command == "process":
        cmd_process(args)
    elif args.command == "search":
        cmd_search(args)
    elif args.command == "delete":
        cmd_delete(args)

if __name__ == "__main__":
    main()
