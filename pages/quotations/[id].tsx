'use client';
import { useRouter } from 'next/router';
import PDFGenerator from '@/components/PDFGenerator';

export default function QuotationView() {
    const { id } = useRouter().query as { id: string };
    return (
        <div>
            <h1 className="text-2xl mb-4">Quotation #{id}</h1>
            <PDFGenerator quotationId={id} />
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }