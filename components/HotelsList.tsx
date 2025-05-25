import { useEffect, useState, FormEvent } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Hotel } from '@/types';

export default function HotelsList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [newHotel, setNewHotel] = useState<Hotel>({
        name: '',
        type: 'Hotel',
        starRating: undefined,
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
    const col = '682a291600390adfbf80'; //hotels

    const load = async () => {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, col);
        setHotels(res.documents as Hotel[]);
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        await databases.createDocument(APPWRITE_DATABASE_ID, col, APPWRITE_ID.unique(), newHotel);
        setNewHotel({ name: '', type: 'Hotel', starRating: undefined });
        load();
    };

    const handleDelete = async (id: string) => {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, col, id);
        load();
    };

    const startEdit = (h: Hotel) => {
        setEditingId(h.$id!);
        setEditingHotel({ ...h });
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditingHotel(null);
    };
    const saveEdit = async () => {
        await databases.updateDocument(APPWRITE_DATABASE_ID, col, editingId!, editingHotel!);
        cancelEdit();
        load();
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Manage Hotels / Homestays / Resorts</h2>
            <form onSubmit={handleCreate} className="space-y-2 mb-4">
                <div>
                    <input
                        type="text"
                        placeholder="Name"
                        value={newHotel.name}
                        onChange={e => setNewHotel({ ...newHotel, name: e.target.value })}
                        className="border p-1 mr-2"
                        required
                    />
                    <select
                        value={newHotel.type}
                        onChange={e => setNewHotel({ ...newHotel, type: e.target.value as Hotel['type'] })}
                        className="border p-1 mr-2"
                    >
                        <option value="Hotel">Hotel</option>
                        <option value="Homestay">Homestay</option>
                        <option value="Resort">Resort</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Star Rating"
                        value={newHotel.starRating ?? ''}
                        onChange={e =>
                            setNewHotel({
                                ...newHotel,
                                starRating: e.target.value ? Number(e.target.value) : undefined,
                            })
                        }
                        className="border p-1 w-24"
                        min={1}
                        max={5}
                    />
                </div>
                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">
                    Add
                </button>
            </form>

            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Star</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {hotels.map(h => (
                        <tr key={h.$id}>
                            <td>
                                {editingId === h.$id ? (
                                    <input
                                        value={editingHotel?.name}
                                        onChange={e => setEditingHotel!({ ...editingHotel!, name: e.target.value })}
                                        className="border p-1"
                                    />
                                ) : (
                                    h.name
                                )}
                            </td>
                            <td>
                                {editingId === h.$id ? (
                                    <select
                                        value={editingHotel?.type}
                                        onChange={e => setEditingHotel!({ ...editingHotel!, type: e.target.value as Hotel['type'] })}
                                        className="border p-1"
                                    >
                                        <option value="Hotel">Hotel</option>
                                        <option value="Homestay">Homestay</option>
                                        <option value="Resort">Resort</option>
                                    </select>
                                ) : (
                                    h.type
                                )}
                            </td>
                            <td>
                                {editingId === h.$id ? (
                                    <input
                                        type="number"
                                        value={editingHotel?.starRating ?? ''}
                                        onChange={e =>
                                            setEditingHotel!({
                                                ...editingHotel!,
                                                starRating: e.target.value ? Number(e.target.value) : undefined,
                                            })
                                        }
                                        className="border p-1 w-16"
                                        min={1}
                                        max={5}
                                    />
                                ) : (
                                    h.starRating ?? '–'
                                )}
                            </td>
                            <td>
                                {editingId === h.$id ? (
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
                                        <button onClick={() => startEdit(h)} className="px-2 py-1 bg-yellow-500 text-white rounded mr-2">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(h.$id!)} className="px-2 py-1 bg-red-500 text-white rounded">
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
