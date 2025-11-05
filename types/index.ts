import { Models } from "appwrite";

export interface Settings extends Models.Document {
    logoUrl: string;
    companyName: string;
    address: string;
    phone: string;
    email: string;
}

export interface Hotel extends Models.Document {
    name: string;
    type: 'Hotel' | 'Homestay' | 'Resort';
    starRating?: number;
}

export interface Activity extends Models.Document {
    name: string;
}

export interface Destination extends Models.Document {
    name: string;
    activityIds: string[];
}

export interface PriceSegment extends Models.Document {
    name: string; // BUDGET, STANDARD, ...
}

export interface ItineraryTemplate {
    title: string;
    description: string;
    destinationIds: string[];
    priceSegmentIds: string[];
}

export interface Quotation extends Models.Document {
    itineraryId: string;
    priceSegmentId: string;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
}
