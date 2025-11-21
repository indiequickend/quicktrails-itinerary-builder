'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const ItineraryEditor = dynamic(() => import('@/components/ItineraryEditor'), { ssr: false });

export default function NewItineraryPage() {
    return <ItineraryEditor mode="new" />;
}
export async function getServerSideProps() { return { props: {} }; }