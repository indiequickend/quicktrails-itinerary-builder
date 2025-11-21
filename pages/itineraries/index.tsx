'use client';
import ItinerariesList from '@/components/ItinerariesList';

export default function ItinerariesPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Itineraries</h1>
            <ItinerariesList />
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }