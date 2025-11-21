'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { PriceSegment } from '@/types';

export default function PriceSegmentsForm() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [segs, setSegs] = useState<PriceSegment[]>([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const col = '682a2aad001626a3c90a';

    const load = async () => {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, col);
        setSegs(res.documents as PriceSegment[]);
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        await databases.createDocument(APPWRITE_DATABASE_ID, col, APPWRITE_ID.unique(), { name: newName });
        setNewName('');
        load();
    };
    const handleDelete = async (id: string) => {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, col, id);
        load();
    };
    const startEdit = (s: PriceSegment) => {
        setEditingId(s.$id!);
        setEditingName(s.name);
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };
    const saveEdit = async () => {
        await databases.updateDocument(APPWRITE_DATABASE_ID, col, editingId!, { name: editingName });
        cancelEdit();
        load();
    };

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Manage Price Segments</h2>
            <form onSubmit={handleCreate} className="mb-4">
                <input
                    placeholder="Segment name (e.g. BUDGET)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="border p-1 mr-2"
                    required
                />
                <button className="px-2 py-1 bg-green-600 text-white rounded">Add</button>
            </form>
            <ul>
                {segs.map(s => (
                    <li key={s.$id} className="flex items-center mb-1">
                        {editingId === s.$id ? (
                            <>
                                <input
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    className="border p-1 mr-2"
                                />
                                <button onClick={saveEdit} className="px-2 py-1 bg-blue-500 text-white rounded mr-2">
                                    Save
                                </button>
                                <button onClick={cancelEdit} className="px-2 py-1 bg-gray-500 text-white rounded">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="flex-1">{s.name}</span>
                                <button onClick={() => startEdit(s)} className="px-2 py-1 bg-yellow-500 text-white rounded mr-2">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(s.$id!)} className="px-2 py-1 bg-red-500 text-white rounded">
                                    Delete
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
