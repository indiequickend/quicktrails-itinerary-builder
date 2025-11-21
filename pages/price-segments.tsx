'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const PriceSegmentsForm = dynamic(() => import('@/components/PriceSegmentsForm'), { ssr: false });

export default function PriceSegmentsPage() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Price Segments</h2>
            <div className="rounded border bg-white p-4">
                <PriceSegmentsForm />
            </div>
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }