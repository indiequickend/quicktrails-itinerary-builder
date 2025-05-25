import { useEffect, useState, FormEvent } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Destination, Activity } from '@/types';

export default function DestinationsList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [newDest, setNewDest] = useState<Destination>({ name: '', activityIds: [] });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingDest, setEditingDest] = useState<Destination | null>(null);
    const colD = '682a29f4002ba23bf3fe'; // destinations
    const colA = '682a299f0013be805f72'; // activities

    const load = async () => {
        const [dRes, aRes] = await Promise.all([
            databases.listDocuments(APPWRITE_DATABASE_ID, colD),
            databases.listDocuments(APPWRITE_DATABASE_ID, colA),
        ]);
        setDestinations(dRes.documents as Destination[]);
        setActivities(aRes.documents as Activity[]);
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        await databases.createDocument(APPWRITE_DATABASE_ID, colD, APPWRITE_ID.unique(), newDest);
        setNewDest({ name: '', activityIds: [] });
        load();
    };
    const handleDelete = async (id: string) => {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, colD, id);
        load();
    };
    const startEdit = (d: Destination) => {
        setEditingId(d.$id!);
        setEditingDest({ ...d });
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditingDest(null);
    };
    const saveEdit = async () => {
        await databases.updateDocument(APPWRITE_DATABASE_ID, colD, editingId!, editingDest!);
        cancelEdit();
        load();
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Manage Destinations / Site‑seeing</h2>
            <form onSubmit={handleCreate} className="space-y-2 mb-4">
                <div>
                    <input
                        value={newDest.name}
                        onChange={e => setNewDest({ ...newDest, name: e.target.value })}
                        placeholder="Destination / Site‑seeing"
                        className="border p-1 mr-2"
                        required
                    />
                    <select
                        multiple
                        value={newDest.activityIds}
                        onChange={e =>
                            setNewDest({
                                ...newDest,
                                activityIds: Array.from(e.target.selectedOptions).map(o => o.value),
                            })
                        }
                        className="border p-1"
                    >
                        {activities.map(a => (
                            <option key={a.$id} value={a.$id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded">
                    Add
                </button>
            </form>

            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Activities</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {destinations.map(d => (
                        <tr key={d.$id}>
                            <td>
                                {editingId === d.$id ? (
                                    <input
                                        value={editingDest?.name}
                                        onChange={e => setEditingDest!({ ...editingDest!, name: e.target.value })}
                                        className="border p-1"
                                    />
                                ) : (
                                    d.name
                                )}
                            </td>
                            <td>
                                {editingId === d.$id ? (
                                    <select
                                        multiple
                                        value={editingDest?.activityIds}
                                        onChange={e =>
                                            setEditingDest!({
                                                ...editingDest!,
                                                activityIds: Array.from(e.target.selectedOptions).map(o => o.value),
                                            })
                                        }
                                        className="border p-1"
                                    >
                                        {activities.map(a => (
                                            <option key={a.$id} value={a.$id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    d.activityIds
                                        .map(id => activities.find(a => a.$id === id)?.name)
                                        .filter(Boolean)
                                        .join(', ')
                                )}
                            </td>
                            <td>
                                {editingId === d.$id ? (
                                    <>
                                        <button onClick={saveEdit} className="px-2 py-1 bg-blue-500 text-white rounded mr-2">
                                            Save
                                        </button>
                                        <button onClick={cancelEdit} className="px-2 py-1 bg-gray-500 text-white rounded">
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEdit(d)} className="px-2 py-1 bg-yellow-500 text-white rounded mr-2">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(d.$id!)} className="px-2 py-1 bg-red-500 text-white rounded">
                                            Delete
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
