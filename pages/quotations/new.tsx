'use client';
import QuotationForm from '@/components/QuotationForm';

export default function NewQuotationPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Create New Quotation</h1>
            <QuotationForm />
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }