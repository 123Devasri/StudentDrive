export const syllabusUnits = [
  { name: 'Foundations', coverage: 100, topics: [{ name: 'Arrays', status: 'Covered', resources: ['Arrays.pptx'] }, { name: 'Linked Lists', status: 'Covered', resources: ['Unit 1 Notes.docx'] }, { name: 'Stacks', status: 'Covered', resources: ['Stacks.pdf'] }, { name: 'Queues', status: 'Covered', resources: ['Queues.pptx'] }] },
  { name: 'Trees', coverage: 72, topics: [{ name: 'Trees', status: 'Covered', resources: ['Trees_Unit2.pptx'] }, { name: 'BST', status: 'Covered', resources: ['BST.pdf'] }, { name: 'AVL', status: 'Covered', resources: ['AVL_Trees.pdf'] }, { name: 'Graphs', status: 'Partial', resources: ['Graphs.pptx', 'Unit2_Notes.pdf'] }] },
  { name: 'Graph Algorithms', coverage: 35, topics: [{ name: 'BFS', status: 'Not Covered', resources: [] }, { name: 'DFS', status: 'Not Covered', resources: [] }, { name: 'Shortest Path', status: 'Partial', resources: ['Graphs.pptx'] }] }
];

export const revisionItems = [{ name: 'Graph Algorithms', level: 'High', detail: '3 topics need attention' }, { name: 'Normalization', level: 'High', detail: 'DBMS · 55% gap' }, { name: 'Deadlocks', level: 'Medium', detail: 'OS · 68% gap' }];
export const chatMessages = [{ role: 'student', text: 'Explain AVL tree rotation.' }, { role: 'assistant', text: 'According to your uploaded AVL notes, a rotation is a local restructuring that keeps the binary search tree ordered while restoring balance. A left rotation moves a right child up; a right rotation moves a left child up.' }];
export const knowledgeGaps = [{ name: 'Graphs', value: 81 }, { name: 'Deadlocks', value: 68 }, { name: 'Normalization', value: 55 }];
export const quizQuestion = { question: 'Which data structure is commonly used for BFS?', options: ['Stack', 'Queue', 'Heap', 'Tree'], answer: 1 };
