export const subjects = [
  { id: 1, name: 'Data Structures', shortName: 'DS', color: '#176b5b', topics: 18, coverage: 78, readiness: 72, examDate: '10 Sep 2026', status: 'On track' },
  { id: 2, name: 'Database Management', shortName: 'DB', color: '#d47b38', topics: 16, coverage: 65, readiness: 61, examDate: '14 Sep 2026', status: 'Needs attention' },
  { id: 3, name: 'Operating Systems', shortName: 'OS', color: '#5577a8', topics: 14, coverage: 91, readiness: 87, examDate: '18 Sep 2026', status: 'On track' },
  { id: 4, name: 'Computer Networks', shortName: 'CN', color: '#9a5577', topics: 12, coverage: 76, readiness: 70, examDate: '22 Sep 2026', status: 'On track' }
];

export const resources = [
  { id: 1, name: 'Graphs.pptx', type: 'PPT', subject: 'Data Structures', folder: 'Unit 2', uploaded: '2 hours ago', icon: 'bi-file-earmark-slides', color: '#d47b38' },
  { id: 2, name: 'DBMS_Unit3.pdf', type: 'PDF', subject: 'Database Management', folder: 'Unit 3', uploaded: 'Yesterday', icon: 'bi-file-earmark-pdf', color: '#b65353' },
  { id: 3, name: 'OS_Deadlocks.pdf', type: 'PDF', subject: 'Operating Systems', folder: 'Unit 4', uploaded: '2 days ago', icon: 'bi-file-earmark-pdf', color: '#b65353' },
  { id: 4, name: 'AVL_Trees.pdf', type: 'PDF', subject: 'Data Structures', folder: 'Unit 2', uploaded: '5 days ago', icon: 'bi-file-earmark-pdf', color: '#b65353' },
  { id: 5, name: 'Unit 1 Notes.docx', type: 'DOC', subject: 'Data Structures', folder: 'Unit 1', uploaded: '1 week ago', icon: 'bi-file-earmark-text', color: '#5577a8' }
];

export const syllabusUnits = [
  { name: 'Foundations', coverage: 100, topics: [{ name: 'Arrays', status: 'Covered', resources: ['Arrays.pptx'] }, { name: 'Linked Lists', status: 'Covered', resources: ['Unit 1 Notes.docx'] }, { name: 'Stacks', status: 'Covered', resources: ['Stacks.pdf'] }, { name: 'Queues', status: 'Covered', resources: ['Queues.pptx'] }] },
  { name: 'Trees', coverage: 72, topics: [{ name: 'Trees', status: 'Covered', resources: ['Trees_Unit2.pptx'] }, { name: 'BST', status: 'Covered', resources: ['BST.pdf'] }, { name: 'AVL', status: 'Covered', resources: ['AVL_Trees.pdf'] }, { name: 'Graphs', status: 'Partial', resources: ['Graphs.pptx', 'Unit2_Notes.pdf'] }] },
  { name: 'Graph Algorithms', coverage: 35, topics: [{ name: 'BFS', status: 'Not Covered', resources: [] }, { name: 'DFS', status: 'Not Covered', resources: [] }, { name: 'Shortest Path', status: 'Partial', resources: ['Graphs.pptx'] }] }
];

export const revisionItems = [{ name: 'Graph Algorithms', level: 'High', detail: '3 topics need attention' }, { name: 'Normalization', level: 'High', detail: 'DBMS · 55% gap' }, { name: 'Deadlocks', level: 'Medium', detail: 'OS · 68% gap' }];
export const chatMessages = [{ role: 'student', text: 'Explain AVL tree rotation.' }, { role: 'assistant', text: 'According to your uploaded AVL notes, a rotation is a local restructuring that keeps the binary search tree ordered while restoring balance. A left rotation moves a right child up; a right rotation moves a left child up.' }];
export const knowledgeGaps = [{ name: 'Graphs', value: 81 }, { name: 'Deadlocks', value: 68 }, { name: 'Normalization', value: 55 }];
export const quizQuestion = { question: 'Which data structure is commonly used for BFS?', options: ['Stack', 'Queue', 'Heap', 'Tree'], answer: 1 };
