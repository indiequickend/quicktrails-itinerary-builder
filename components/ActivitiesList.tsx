import { useEffect, useState, FormEvent } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Activity } from '@/types';

export default function ActivitiesList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const col = '682a299f0013be805f72'; // activities

    const load = async () => {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, col);
        setActivities(res.documents as Activity[]);
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
    const startEdit = (a: Activity) => {
        setEditingId(a.$id!);
        setEditingName(a.name);
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
        <div>
            <h2 className="text-xl font-semibold mb-2">Manage Activities</h2>
            <form onSubmit={handleCreate} className="mb-4">
                <input
                    placeholder="Activity name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="border p-1 mr-2"
                    required
                />
                <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded">
                    Add
                </button>
            </form>
            <ul>
                {activities.map(a => (
                    <li key={a.$id} className="flex items-center mb-1">
                        {editingId === a.$id ? (
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
                                <span className="flex-1">{a.name}</span>
                                <button onClick={() => startEdit(a)} className="px-2 py-1 bg-yellow-500 text-white rounded mr-2">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(a.$id!)} className="px-2 py-1 bg-red-500 text-white rounded">
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
