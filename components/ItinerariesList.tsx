import { useEffect, useState, FormEvent } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { ItineraryTemplate } from '@/types';
import PriceSegmentsForm from '@/components/PriceSegmentsForm';

export default function ItinerariesList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [its, setIts] = useState<ItineraryTemplate[]>([]);
    const [dests, setDests] = useState<any[]>([]);
    const [segs, setSegs] = useState<any[]>([]);
    const [newIt, setNewIt] = useState<ItineraryTemplate>({
        title: '',
        description: '',
        destinationIds: [],
        priceSegmentIds: [],
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingIt, setEditingIt] = useState<ItineraryTemplate | null>(null);
    const col = '682a2acc002334b9bd78'; //itineraries

    const loadAll = async () => {
        const [iRes, dRes, sRes] = await Promise.all([
            databases.listDocuments(APPWRITE_DATABASE_ID, col),
            databases.listDocuments(APPWRITE_DATABASE_ID, '682a29f4002ba23bf3fe'), // destinations
            databases.listDocuments(APPWRITE_DATABASE_ID, '682a2aad001626a3c90a'), //pricesegments
        ]);
        setIts(iRes.documents as ItineraryTemplate[]);
        setDests(dRes.documents);
        setSegs(sRes.documents);
    };
    useEffect(() => { loadAll(); }, []);

    const reloadIts = async () => {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, col);
        setIts(res.documents as ItineraryTemplate[]);
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        await databases.createDocument(APPWRITE_DATABASE_ID, col, APPWRITE_ID.unique(), newIt);
        setNewIt({ title: '', description: '', destinationIds: [], priceSegmentIds: [] });
        reloadIts();
    };
    const handleDelete = async (id: string) => {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, col, id);
        reloadIts();
    };
    const startEdit = (it: ItineraryTemplate) => {
        setEditingId(it.$id!);
        setEditingIt({ ...it });
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditingIt(null);
    };
    const saveEdit = async () => {
        await databases.updateDocument(APPWRITE_DATABASE_ID, col, editingId!, editingIt!);
        cancelEdit();
        reloadIts();
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Manage Itinerary Templates</h2>
            <PriceSegmentsForm />

            <form onSubmit={handleCreate} className="space-y-3 mb-6">
                <div>
                    <input
                        placeholder="Title"
                        value={newIt.title}
                        onChange={e => setNewIt({ ...newIt, title: e.target.value })}
                        className="border p-1 mr-2"
                        required
                    />
                    <input
                        placeholder="Description"
                        value={newIt.description}
                        onChange={e => setNewIt({ ...newIt, description: e.target.value })}
                        className="border p-1"
                        required
                    />
                </div>
                <div>
                    <select
                        multiple
                        value={newIt.destinationIds}
                        onChange={e =>
                            setNewIt({
                                ...newIt,
                                destinationIds: Array.from(e.target.selectedOptions).map(o => o.value),
                            })
                        }
                        className="border p-1 mr-2"
                    >
                        {dests.map(d => (
                            <option key={d.$id} value={d.$id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                    <select
                        multiple
                        value={newIt.priceSegmentIds}
                        onChange={e =>
                            setNewIt({
                                ...newIt,
                                priceSegmentIds: Array.from(e.target.selectedOptions).map(o => o.value),
                            })
                        }
                        className="border p-1"
                    >
                        {segs.map(s => (
                            <option key={s.$id} value={s.$id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">
                    Add Itinerary
                </button>
            </form>

            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Destinations</th>
                        <th>Segments</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {its.map(it => (
                        <tr key={it.$id}>
                            <td>
                                {editingId === it.$id ? (
                                    <input
                                        value={editingIt!.title}
                                        onChange={e => setEditingIt!({ ...editingIt!, title: e.target.value })}
                                        className="border p-1"
                                    />
                                ) : (
                                    it.title
                                )}
                            </td>
                            <td>
                                {editingId === it.$id ? (
                                    <input
                                        value={editingIt!.description}
                                        onChange={e => setEditingIt!({ ...editingIt!, description: e.target.value })}
                                        className="border p-1"
                                    />
                                ) : (
                                    it.description
                                )}
                            </td>
                            <td>
                                {editingId === it.$id ? (
                                    <select
                                        multiple
                                        value={editingIt!.destinationIds}
                                        onChange={e =>
                                            setEditingIt!({
                                                ...editingIt!,
                                                destinationIds: Array.from(e.target.selectedOptions).map(o => o.value),
                                            })
                                        }
                                        className="border p-1"
                                    >
                                        {dests.map(d => (
                                            <option key={d.$id} value={d.$id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    it.destinationIds.map(id => dests.find(d => d.$id === id)?.name).join(', ')
                                )}
                            </td>
                            <td>
                                {editingId === it.$id ? (
                                    <select
                                        multiple
                                        value={editingIt!.priceSegmentIds}
                                        onChange={e =>
                                            setEditingIt!({
                                                ...editingIt!,
                                                priceSegmentIds: Array.from(e.target.selectedOptions).map(o => o.value),
                                            })
                                        }
                                        className="border p-1"
                                    >
                                        {segs.map(s => (
                                            <option key={s.$id} value={s.$id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    it.priceSegmentIds.map(id => segs.find(s => s.$id === id)?.name).join(', ')
                                )}
                            </td>
                            <td>
                                {editingId === it.$id ? (
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
                                        <button onClick={() => startEdit(it)} className="px-2 py-1 bg-yellow-500 text-white rounded mr-2">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(it.$id!)} className="px-2 py-1 bg-red-500 text-white rounded">
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
