import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Quotation, ItineraryTemplate, PriceSegment } from '@/types';

export default function QuotationForm() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const router = useRouter();
    const [templates, setTemplates] = useState<ItineraryTemplate[]>([]);
    const [segs, setSegs] = useState<PriceSegment[]>([]);
    const [form, setForm] = useState<Omit<Quotation, '$id'>>({
        itineraryId: '',
        priceSegmentId: '',
        startDate: '',
        endDate: '',
        adults: 1,
        children: 0,
    });
    const [childCount, setChildCount] = useState(0);

    useEffect(() => {
        (async () => {
            const [tRes, sRes] = await Promise.all([
                databases.listDocuments(APPWRITE_DATABASE_ID, '682a2acc002334b9bd78'),
                databases.listDocuments(APPWRITE_DATABASE_ID, '682a2aad001626a3c90a'),
            ]);
            setTemplates(tRes.documents as ItineraryTemplate[]);
            setSegs(sRes.documents as PriceSegment[]);
        })();
    }, []);

    const handleChildCount = (e: React.ChangeEvent<HTMLInputElement>) => {
        const c = Number(e.target.value);
        setChildCount(c);
        setForm({ ...form });
    };
    const handleChildAge = (idx: number, age: number) => {

        setForm({ ...form });
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const res = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            '682a2c4f0020c6f6ca3a',
            APPWRITE_ID.unique(),
            form
        );
        router.push(`/quotations/${res.$id}`);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label>Itinerary:</label>
                <select
                    value={form.itineraryId}
                    onChange={e => setForm({ ...form, itineraryId: e.target.value })}
                    className="border p-1 ml-2"
                    required
                >
                    <option value="">Select…</option>
                    {templates.map(t => (
                        <option key={t.$id} value={t.$id}>
                            {t.title}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label>Price Category:</label>
                <select
                    value={form.priceSegmentId}
                    onChange={e => setForm({ ...form, priceSegmentId: e.target.value })}
                    className="border p-1 ml-2"
                    required
                >
                    <option value="">Select…</option>
                    {segs.map(s => (
                        <option key={s.$id} value={s.$id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label>Start Date:</label>
                <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="border p-1 ml-2"
                    required
                />
            </div>
            <div>
                <label>End Date:</label>
                <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="border p-1 ml-2"
                    required
                />
            </div>
            <div>
                <label>Adults:</label>
                <input
                    type="number"
                    min={1}
                    value={form.adults}
                    onChange={e => setForm({ ...form, adults: Number(e.target.value) })}
                    className="border p-1 ml-2"
                    required
                />
            </div>
            <div>
                <label>Children:</label>
                <input
                    type="number"
                    min={0}
                    value={childCount}
                    onChange={handleChildCount}
                    className="border p-1 ml-2"
                />
            </div>

            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Create Quotation
            </button>
        </form>
    );
}
