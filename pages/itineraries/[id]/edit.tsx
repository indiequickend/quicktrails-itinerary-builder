'use client';
import React from 'react';
import { useRouter } from 'next/router';
import ItineraryEditor from '@/components/ItineraryEditor';

export default function EditItineraryPage() {
    const router = useRouter();
    const { id } = router.query;
    if (typeof id !== 'string') return null;
    return <ItineraryEditor itineraryId={id} />;
}
export async function getServerSideProps() { return { props: {} }; }