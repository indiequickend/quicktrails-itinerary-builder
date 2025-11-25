'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { ItineraryTemplate, Destination } from '@/types';
import { Button } from '@/components/ui/button';
import { Query } from 'appwrite';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ID } from 'appwrite';
import { useRouter } from 'next/router';

type ItineraryRow = ItineraryTemplate & { $id: string; days?: string[] };

export default function ItinerariesList() {
    const { databases, APPWRITE_DATABASE_ID } = useAppwrite();

    // Collections (same as in ItineraryEditor)
    const col = '682a2acc002334b9bd78'; // itineraries
    const colDayPlan = 'days'; // dayPlans
    const colDayItem = 'day_wise_items'; // dayItems
    const colDest = '682a29f4002ba23bf3fe'; // destinations
    const colSeg = '682a2aad001626a3c90a'; // price segments

    const [its, setIts] = useState<ItineraryRow[]>([]);
    const [dests, setDests] = useState<Destination[]>([]);
    const [segs, setSegs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const router = useRouter?.() || null; // if using next/router; add import if missing

    const relIds = (rel: any): string[] =>
        Array.isArray(rel) ? (rel.map((r) => (typeof r === 'string' ? r : r?.$id)).filter(Boolean) as string[]) : [];

    const loadAll = async () => {
        setLoading(true);
        try {
            const [itRes, dRes, sRes] = await Promise.all([
                databases.listDocuments(APPWRITE_DATABASE_ID, col, [Query.limit(500), Query.orderDesc('$createdAt')]),
                databases.listDocuments(APPWRITE_DATABASE_ID, colDest, [Query.limit(500)]),
                databases.listDocuments(APPWRITE_DATABASE_ID, colSeg),
            ]);
            setIts(itRes.documents as unknown as ItineraryRow[]);
            setDests(dRes.documents as Destination[]);
            setSegs(sRes.documents);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const deleteItineraryCascade = async (itineraryId: string) => {
        if (!confirm('Delete this itinerary and its day plans/items?')) return;

        try {
            // 1) load itinerary -> day plan ids
            const itDoc: any = await databases.getDocument(APPWRITE_DATABASE_ID, col, itineraryId);
            const dayPlanIds = relIds(itDoc.days);

            // 2) delete items then day plans
            if (dayPlanIds.length) {
                const plansRes = await databases.listDocuments(APPWRITE_DATABASE_ID, colDayPlan, [
                    Query.equal('$id', dayPlanIds),
                    Query.limit(500),
                ]);
                for (const p of plansRes.documents as any[]) {
                    const itemIds = relIds(p.items);
                    if (itemIds.length) {
                        const itemsRes = await databases.listDocuments(APPWRITE_DATABASE_ID, colDayItem, [
                            Query.equal('$id', itemIds),
                            Query.limit(1000),
                        ]);
                        for (const it of itemsRes.documents) {
                            try {
                                await databases.deleteDocument(APPWRITE_DATABASE_ID, colDayItem, it.$id);
                            } catch {
                                // ignore individual failures
                            }
                        }
                    }
                    try {
                        await databases.deleteDocument(APPWRITE_DATABASE_ID, colDayPlan, p.$id);
                    } catch {
                        // ignore
                    }
                }
            }

            // 3) delete itinerary
            await databases.deleteDocument(APPWRITE_DATABASE_ID, col, itineraryId);

            // 4) refresh
            await loadAll();
        } catch (e) {
            console.error('Delete failed', e);
            alert('Failed to delete itinerary. Please try again.');
        }
    };

    const createItinerary = async () => {
        if (!newTitle.trim() || creating) return;
        setCreating(true);
        try {
            const doc = await databases.createDocument(
                APPWRITE_DATABASE_ID,
                col,
                ID.unique(),
                { title: newTitle.trim() } // bare doc (other fields can be filled later)
            );
            setCreateOpen(false);
            setNewTitle('');
            // Navigate directly to edit page
            router && router.push(`/itineraries/${doc.$id}/edit`);
        } catch (e) {
            console.error('Create failed', e);
            alert('Failed to create itinerary');
        } finally {
            setCreating(false);
        }
    };

    const destName = (id: string) => dests.find((d) => d.$id === id)?.name || id;
    const segName = (id: string) => segs.find((s: any) => s.$id === id)?.name || id;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <div className="flex gap-2">
                    <Link href="/price-segments">
                        <Button variant="outline">Manage Price Segments</Button>
                    </Link>
                    <Button onClick={() => setCreateOpen(true)}>Create Itinerary</Button>
                </div>
            </div>

            {/* Creation Dialog */}
            <Dialog open={createOpen} onOpenChange={(o) => !creating && setCreateOpen(o)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Itinerary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                autoFocus
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Enter itinerary title"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                            Cancel
                        </Button>
                        <Button onClick={createItinerary} disabled={!newTitle.trim() || creating}>
                            {creating ? 'Creating…' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="rounded border bg-white">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-sm text-gray-700">
                            <th className="p-2 font-medium">Title</th>
                            <th className="p-2 font-medium">Destinations</th>
                            <th className="p-2 font-medium">Price Segments</th>
                            <th className="p-2 font-medium">Days</th>
                            <th className="p-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="p-3 text-sm text-gray-500" colSpan={5}>
                                    Loading…
                                </td>
                            </tr>
                        ) : its.length === 0 ? (
                            <tr>
                                <td className="p-3 text-sm text-gray-500" colSpan={5}>
                                    No itineraries found.
                                </td>
                            </tr>
                        ) : (
                            its.map((it) => (
                                <tr key={it.$id} className="border-t">
                                    <td className="p-2">{it.title}</td>
                                    <td className="p-2">
                                        {(it.destinationIds || []).map(destName).join(', ')}
                                    </td>
                                    <td className="p-2">
                                        {(it.priceSegmentIds || []).map(segName).join(', ')}
                                    </td>
                                    <td className="p-2">{(it.days || []).length}</td>
                                    <td className="p-2">
                                        <div className="flex gap-2">
                                            <Link href={`/itineraries/${it.$id}/edit`}>
                                                <Button variant="secondary">Edit</Button>
                                            </Link>
                                            <Button
                                                variant="destructive"
                                                onClick={() => deleteItineraryCascade(it.$id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
