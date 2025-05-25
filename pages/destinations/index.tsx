import ActivitiesList from '@/components/ActivitiesList';
import DestinationsList from '@/components/DestinationsList';

export default function DestinationsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Destinations & Activities</h1>
            <ActivitiesList />
            <DestinationsList />
        </div>
    );
}
