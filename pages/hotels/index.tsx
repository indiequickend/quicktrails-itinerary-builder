'use client';
import HotelsList from '@/components/HotelsList/list';

export default function HotelsPage() {
    return (
        <div>
            <h1 className="text-xl font-bold mb-4">Hotels / Homestays / Resorts</h1>
            <HotelsList />
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }