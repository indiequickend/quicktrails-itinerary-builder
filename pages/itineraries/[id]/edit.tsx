'use client';
import React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const ItineraryEditor = dynamic(() => import('@/components/ItineraryEditor'), { ssr: false });

export default function EditItineraryPage() {
    const router = useRouter();
    const { id } = router.query as { id?: string };

    if (!id) return null; // wait for router to be ready
    return <ItineraryEditor mode="edit" itineraryId={id} />;
}
export async function getServerSideProps() { return { props: {} }; }