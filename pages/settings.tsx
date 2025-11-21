'use client';
import SettingsForm from '@/components/SettingsForm';

export default function SettingsPage() {
    return (
        <div>
            <SettingsForm />
        </div>
    );
}

export async function getServerSideProps() {
    return {
        props: {}
    };
}