export interface Settings {
    logoUrl: string;
    companyName: string;
    address: string;
    phone: string;
    email: string;
}

export interface Hotel {
    $id?: string;
    name: string;
    type: 'Hotel' | 'Homestay' | 'Resort';
    starRating?: number;
}

export interface Activity {
    $id?: string;
    name: string;
}

export interface Destination {
    $id?: string;
    name: string;
    activityIds: string[];
}

export interface PriceSegment {
    $id?: string;
    name: string; // BUDGET, STANDARD, ...
}

export interface ItineraryTemplate {
    $id?: string;
    title: string;
    description: string;
    destinationIds: string[];
    priceSegmentIds: string[];
}

export interface Quotation {
    $id?: string;
    itineraryId: string;
    priceSegmentId: string;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
}
