import { PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Quotation, Settings, Hotel, Destination, Activity, ItineraryTemplate, PriceSegment } from '@/types';

export default function PDFGenerator({ quotationId }: { quotationId: string }) {
    const { databases, storage, APPWRITE_DATABASE_ID } = useAppwrite();
    const [data, setData] = useState<{
        quote: Quotation;
        settings: Settings;
        itinerary: ItineraryTemplate;
        priceSegment: PriceSegment;
    } | null>(null);

    useEffect(() => {
        (async () => {
            const quote = await databases.getDocument(APPWRITE_DATABASE_ID, '682a2c4f0020c6f6ca3a', quotationId) as Quotation;
            const settings = await databases.getDocument(APPWRITE_DATABASE_ID, '682a28440038cc7ba928', '682a40a9003c3a60b1bb') as Settings;
            const itinerary = await databases.getDocument(APPWRITE_DATABASE_ID, '682a2acc002334b9bd78', quote.itineraryId) as ItineraryTemplate;
            const priceSegment = await databases.getDocument(APPWRITE_DATABASE_ID, '682a2aad001626a3c90a', quote.priceSegmentId) as PriceSegment;
            setData({ quote, settings, itinerary, priceSegment });
        })();
    }, [quotationId]);

    if (!data) return <p>Loading...</p>;

    const styles = StyleSheet.create({
        page: { padding: 24, fontSize: 12 },
        header: { flexDirection: 'row', marginBottom: 20 },
        logo: { width: 80, height: 80 },
        company: { marginLeft: 10 },
        section: { marginBottom: 12 }
    });

    const MyDoc = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    {data.settings.logoUrl && <Image src={data.settings.logoUrl} style={styles.logo} />}
                    <View style={styles.company}>
                        <Text>{data.settings.companyName}</Text>
                        <Text>{data.settings.address}</Text>
                        <Text>{data.settings.phone}</Text>
                        <Text>{data.settings.email}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text>Itinerary: {data.itinerary.title}</Text>
                    <Text>Category: {data.priceSegment.name}</Text>
                    <Text>
                        Dates: {data.quote.startDate} – {data.quote.endDate}
                    </Text>
                    <Text>Adults: {data.quote.adults}</Text>
                    <Text>Children: {data.quote.children.length}</Text>
                </View>
                {/* Render day-by-day itinerary, hotels, destinations, activities… */}
            </Page>
        </Document>
    );

    return (
        <PDFDownloadLink document={<MyDoc />} fileName={`Quotation_${quotationId}.pdf`}>
            {({ loading }) => loading ? 'Preparing PDF…' : 'Download PDF'}
        </PDFDownloadLink>
    );
}
