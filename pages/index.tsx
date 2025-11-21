'use client';
import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Itinerary Builder Dashboard</h1>
            <p>Welcome! Use the menu on the left to manage your app.</p>
            <div className="flex flex-wrap gap-4">
                {[
                    { label: 'Settings', href: '/settings' },
                    { label: 'Hotels', href: '/hotels' },
                    { label: 'Activities', href: '/activities' },
                    { label: 'Destinations', href: '/destinations' },
                    { label: 'Itineraries', href: '/itineraries' },
                    { label: 'Quotations', href: '/quotations' },
                ].map(({ label, href }) => (
                    <Link
                        key={href}
                        href={href}
                        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
export async function getServerSideProps() { return { props: {} }; }