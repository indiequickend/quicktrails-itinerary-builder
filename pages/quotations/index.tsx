'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Quotation } from '@/types';

export default function QuotationsPage() {
    const { databases, APPWRITE_DATABASE_ID } = useAppwrite();
    const [quotes, setQuotes] = useState<Quotation[]>([]);

    useEffect(() => {
        (async () => {
            const res = await databases.listDocuments(APPWRITE_DATABASE_ID, '682a2c4f0020c6f6ca3a');
            setQuotes(res.documents as Quotation[]);
        })();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Quotations</h1>
            <Link
                href="/quotations/new"
                className="px-3 py-1 bg-green-600 text-white rounded mb-4 inline-block"
            >
                New Quotation
            </Link>

            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Itinerary</th>
                        <th>Dates</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {quotes.map(q => (
                        <tr key={q.$id}>
                            <td>{q.$id}</td>
                            <td>{q.itineraryId}</td>
                            <td>
                                {q.startDate} – {q.endDate}
                            </td>
                            <td>
                                <Link href={`/quotations/${q.$id}`} className="text-blue-600 hover:underline">
                                    View / Download
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }