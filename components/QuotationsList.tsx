import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Quotation, ItineraryTemplate, PriceSegment } from '@/types';

export default function QuotationsList() {
    const { databases, APPWRITE_DATABASE_ID } = useAppwrite();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [itinerariesMap, setItinerariesMap] = useState<Record<string, string>>({});
    const [segmentsMap, setSegmentsMap] = useState<Record<string, string>>({});

    useEffect(() => {
        async function load() {
            // Fetch all quotations, itineraries, and price segments in parallel
            const [qRes, iRes, pRes] = await Promise.all([
                databases.listDocuments(APPWRITE_DATABASE_ID, '682a2c4f0020c6f6ca3a'), // quotations
                databases.listDocuments(APPWRITE_DATABASE_ID, '682a2acc002334b9bd78'), //itineraries
                databases.listDocuments(APPWRITE_DATABASE_ID, '682a2aad001626a3c90a'), // pricesegments
            ]);

            setQuotations(qRes.documents as Quotation[]);

            const itineraries = iRes.documents as ItineraryTemplate[];
            setItinerariesMap(
                Object.fromEntries(itineraries.map(i => [i.$id!, i.title]))
            );

            const segments = pRes.documents as PriceSegment[];
            setSegmentsMap(
                Object.fromEntries(segments.map(s => [s.$id!, s.name]))
            );
        }

        load();
    }, [databases]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Quotations</h2>
            <Link
                href="/quotations/new"
                className="inline-block mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
                + New Quotation
            </Link>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow rounded">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Itinerary</th>
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-left">Dates</th>
                            <th className="px-4 py-2 text-left">Adults</th>
                            <th className="px-4 py-2 text-left">Children (ages)</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotations.map(q => (
                            <tr key={q.$id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{q.$id}</td>
                                <td className="px-4 py-2">
                                    {itinerariesMap[q.itineraryId] ?? q.itineraryId}
                                </td>
                                <td className="px-4 py-2">
                                    {segmentsMap[q.priceSegmentId] ?? q.priceSegmentId}
                                </td>
                                <td className="px-4 py-2">
                                    {q.startDate} – {q.endDate}
                                </td>
                                <td className="px-4 py-2">{q.adults}</td>
                                <td className="px-4 py-2">
                                    {q.children.map(c => c.age).join(', ') || '–'}
                                </td>
                                <td className="px-4 py-2 space-x-2">
                                    <Link
                                        href={`/quotations/${q.$id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View / PDF
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {quotations.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                                    No quotations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
