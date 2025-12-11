'use client';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { ItineraryTemplate, Destination, Activity, Hotel } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Query, Permission, Role, ID } from 'appwrite';
import { useSettings } from '@/contexts/SettingsContext';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'path';

type DayItemType = 'Activity' | 'Stay';

interface DayItem {
    id: string;
    type: DayItemType;
    title: string;
    description?: string;
    refActivity?: string[];
    refHotel?: string[];
}
interface DayPlan {
    planId?: string;
    dayNumber: number;
    date?: string;
    title?: string;
    summary?: string;
    items: DayItem[];
}
type ItineraryDoc = ItineraryTemplate & {
    days?: DayPlan[];
    $id?: string;
    bannerUrl?: string;
    inclusionHtml?: string;
    exclusionHtml?: string;
    termsHtml?: string;
};

type Props = {
    itineraryId?: string;
};

interface DestinationOption {
    label: string;
    value: string;
}

interface SegmentOption {
    label: string;
    value: string;
}

export default function ItineraryEditor({ itineraryId }: Props) {
    const router = useRouter();
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const { settings } = useSettings();
    const previewRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    // Collections
    const col = '682a2acc002334b9bd78';
    const colDest = '682a29f4002ba23bf3fe';
    const colSeg = '682a2aad001626a3c90a';
    const colAct = '682a299f0013be805f72';
    const colHotel = '682a291600390adfbf80';
    const colDayPlan = 'days';
    const colDayItem = 'day_wise_items';

    const [dests, setDests] = useState<Destination[]>([]);
    const [destOptions, setDestOptions] = useState<DestinationOption[]>([]);
    const [segs, setSegs] = useState<any[]>([]);
    const [segOptions, setSegOptions] = useState<SegmentOption[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]);

    useEffect(() => {
        const options = dests.map(d => ({ label: d.name, value: d.$id }));
        setDestOptions(options);
    }, [dests]);

    useEffect(() => {
        const options = segs.map(s => ({ label: s.name, value: s.$id }));
        setSegOptions(options);
    }, [segs]);

    const [editorIt, setEditorIt] = useState<ItineraryDoc>({
        title: '',
        description: '',
        destinationIds: [],
        priceSegmentIds: [],
        days: [],
        bannerUrl: '',
        inclusionHtml: '',
        exclusionHtml: '',
        termsHtml: '',
    });
    const [originalGraph, setOriginalGraph] = useState<{ days: DayPlan[] }>({ days: [] });
    const [saving, setSaving] = useState(false);

    const [inclusionHtmlLocal, setInclusionHtmlLocal] = useState('');
    const [exclusionHtmlLocal, setExclusionHtmlLocal] = useState('');
    const [termsHtmlLocal, setTermsHtmlLocal] = useState('');
    const [editorHydrated, setEditorHydrated] = useState(false);
    const [priceLocal, setPriceLocal] = useState('');

    const [bannerOpen, setBannerOpen] = useState(false);
    const [bannerSearch, setBannerSearch] = useState('');
    const [bannerResults, setBannerResults] = useState<any[]>([]);
    const [bannerLoading, setBannerLoading] = useState(false);

    const quillModules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean'],
            ],
        }),
        []
    );
    const quillFormats = useMemo(
        () => ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'],
        []
    );

    useEffect(() => {
        if (!destOptions.length) return;
        setEditorIt(prev => ({
            ...prev,
            destinationIds: (prev.destinationIds || []).filter(id => destOptions.some(o => o.value === id))
        }));
    }, [destOptions]);

    useEffect(() => {
        if (editorHydrated) return;
        if (!editorIt.$id && itineraryId) return;
        setInclusionHtmlLocal(editorIt.inclusionHtml || '');
        setExclusionHtmlLocal(editorIt.exclusionHtml || '');
        setTermsHtmlLocal(editorIt.termsHtml || '');
        setEditorHydrated(true);
    }, [editorIt.$id, editorIt.inclusionHtml, editorIt.exclusionHtml, editorIt.termsHtml, editorHydrated, itineraryId]);

    useEffect(() => {
        setEditorHydrated(false);
    }, [itineraryId]);

    const searchPexels = async () => {
        if (!bannerSearch.trim()) return;
        setBannerLoading(true);
        setBannerResults([]);
        try {
            const key = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
            if (!key) {
                console.error('Missing NEXT_PUBLIC_PEXELS_API_KEY');
                setBannerLoading(false);
                return;
            }
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(bannerSearch.trim())}&orientation=landscape&per_page=24`, {
                headers: { Authorization: key }
            });
            const data = await res.json();
            setBannerResults(Array.isArray(data.photos) ? data.photos : []);
        } catch (e) {
            console.error('Pexels search failed', e);
        } finally {
            setBannerLoading(false);
        }
    };

    const selectBanner = (url: string) => {
        setEditorIt(prev => ({ ...prev, bannerUrl: url }));
        setBannerOpen(false);
    };

    const loadRefs = async () => {
        const [dRes, sRes, aRes, hRes] = await Promise.all([
            databases.listDocuments(APPWRITE_DATABASE_ID, colDest, [Query.limit(500), Query.orderDesc('$createdAt')]),
            databases.listDocuments(APPWRITE_DATABASE_ID, colSeg),
            databases.listDocuments(APPWRITE_DATABASE_ID, colAct, [Query.limit(500), Query.orderDesc('$createdAt')]),
            databases.listDocuments(APPWRITE_DATABASE_ID, colHotel, [Query.limit(500), Query.orderDesc('$createdAt')]),
        ]);
        setDests(dRes.documents as Destination[]);
        setSegs(sRes.documents);
        setActivities(aRes.documents as Activity[]);
        setHotels(hRes.documents as Hotel[]);
    };

    const relIds = (rel: any): string[] =>
        Array.isArray(rel) ? (rel.map((r) => (typeof r === 'string' ? r : r?.$id)).filter(Boolean) as string[]) : [];

    const toIdArray = (v: any): string[] => {
        if (!v) return [];
        if (Array.isArray(v)) {
            return v.map(x => (typeof x === 'string' ? x : (x && x.$id) || '')).filter(Boolean);
        }
        // legacy single value support
        if (typeof v === 'string') return [v];
        if (typeof v === 'object' && '$id' in v) return [v.$id];
        return [];
    };

    const fetchItineraryGraph = async (id: string) => {
        const itDoc: any = await databases.getDocument(APPWRITE_DATABASE_ID, col, id);
        const dayPlanIds = relIds(itDoc.days);

        let plans: any[] = [];
        if (dayPlanIds.length) {
            const plansRes = await databases.listDocuments(APPWRITE_DATABASE_ID, colDayPlan, [
                Query.equal('$id', dayPlanIds),
                Query.limit(200),
            ]);
            plans = (plansRes.documents as any[]).sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));
        }

        const itemsByPlanId: Record<string, any[]> = {};
        for (const p of plans) {
            const itemIds = relIds(p.items);
            if (!itemIds.length) {
                itemsByPlanId[p.$id] = [];
                continue;
            }
            const itemsRes = await databases.listDocuments(APPWRITE_DATABASE_ID, colDayItem, [
                Query.equal('$id', itemIds),
                Query.limit(500),
            ]);
            const docs = itemsRes.documents as any[];
            const byId: Record<string, any> = {};
            docs.forEach((d) => (byId[d.$id] = d));
            itemsByPlanId[p.$id] = itemIds.map((i) => byId[i]).filter(Boolean);
        }

        const toId = (v: any): string =>
            typeof v === 'string'
                ? v
                : v && typeof v === 'object' && ('$id' in v)
                    ? v.$id
                    : '';

        const days: DayPlan[] = plans.map((p) => ({
            planId: p.$id,
            dayNumber: p.dayNumber ?? 0,
            date: '',
            title: p.title || '',
            summary: p.summary || '',
            items: (itemsByPlanId[p.$id] || []).map((it) => ({
                id: it.$id,
                type: it.type,
                title: it.title || '',
                refActivity: toIdArray(it.refActivity ?? it.refActivityId),
                refHotel: toIdArray(it.refHotel ?? it.refHotelId),
                description: it.description || '',
            })),
        }));

        setEditorIt({
            $id: itDoc.$id,
            title: itDoc.title || '',
            description: itDoc.description || '',
            destinationIds: itDoc.destinationIds || [],
            priceSegmentIds: itDoc.priceSegmentIds || [],
            days,
            bannerUrl: itDoc.bannerUrl || '',
            inclusionHtml: itDoc.inclusionHtml ?? settings?.inclusionTemplateHtml ?? '',
            exclusionHtml: itDoc.exclusionHtml ?? settings?.exclusionTemplateHtml ?? '',
            termsHtml: itDoc.termsHtml ?? settings?.termsTemplateHtml ?? '',
        } as any);

        setOriginalGraph({ days: JSON.parse(JSON.stringify(days)) });
    };

    useEffect(() => {
        (async () => {
            await loadRefs();
            if (itineraryId) {
                await fetchItineraryGraph(itineraryId);
            }
        })().catch(console.error);
    }, [itineraryId]);

    useEffect(() => {
        if (!settings) return;
        // console.log('settings', settings);

        setEditorIt(prev => ({
            ...prev,
            inclusionHtml: prev.inclusionHtml?.trim() ? prev.inclusionHtml : (settings.inclusionTemplateHtml || ''),
            exclusionHtml: prev.exclusionHtml?.trim() ? prev.exclusionHtml : (settings.exclusionTemplateHtml || ''),
            termsHtml: prev.termsHtml?.trim() ? prev.termsHtml : (settings.termsTemplateHtml || ''),
        }));
    }, [settings]);

    const updateItineraryGraphPartial = async (id: string) => {
        const originalDayMap: Record<string, DayPlan> = {};
        originalGraph.days.forEach((d) => {
            if (d.planId) originalDayMap[d.planId] = d;
        });

        const currentDays = editorIt.days || [];
        const currentPlanIds = currentDays.filter((d) => d.planId).map((d) => d.planId!);
        const deletedPlanIds = Object.keys(originalDayMap).filter((pid) => !currentPlanIds.includes(pid));

        // const parent: any = await databases.getDocument(APPWRITE_DATABASE_ID, col, id);

        // delete removed day plans
        for (const planId of deletedPlanIds) {
            try {
                const planDoc: any = await databases.getDocument(APPWRITE_DATABASE_ID, colDayPlan, planId);
                const itemIds: string[] = Array.isArray(planDoc.items)
                    ? planDoc.items.map((x: any) => (typeof x === 'string' ? x : x.$id)).filter(Boolean)
                    : [];
                for (const itemId of itemIds) {
                    try {
                        await databases.deleteDocument(APPWRITE_DATABASE_ID, colDayItem, itemId);
                    } catch { }
                }
                await databases.deleteDocument(APPWRITE_DATABASE_ID, colDayPlan, planId);
            } catch { }
        }

        const finalDayPlanIds: string[] = [];

        for (let idx = 0; idx < currentDays.length; idx++) {
            const d = currentDays[idx];
            const isNewDay = !d.planId;
            let planId = d.planId;

            if (isNewDay) {
                console.log('[day:create] index', idx);
                const newPlan = await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    colDayPlan,
                    ID.unique(),
                    {
                        dayNumber: idx + 1,
                        // date: d.date || '',
                        title: d.title || '',
                        summary: d.summary || '',
                    },
                    [Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())]
                );
                planId = newPlan.$id;
                d.planId = planId;
            } else {
                const orig = originalDayMap[planId!];
                const dayChanged =
                    orig.dayNumber !== idx + 1 ||
                    // (orig.date || '') !== (d.date || '') ||
                    (orig.title || '') !== (d.title || '') ||
                    (orig.summary || '') !== (d.summary || '');
                if (dayChanged) {
                    await databases.updateDocument(APPWRITE_DATABASE_ID, colDayPlan, planId!, {
                        dayNumber: idx + 1,
                        // date: d.date || '',
                        title: d.title || '',
                        summary: d.summary || '',
                    });
                }
            }

            // items
            const origItems = (originalDayMap[planId!]?.items || []);
            const origItemMap: Record<string, DayItem> = {};
            origItems.forEach((it) => (origItemMap[it.id] = it));

            const currentItems = d.items || [];
            const currentItemIds = currentItems.map((it) => it.id);
            const deletedItemIds = Object.keys(origItemMap).filter((id2) => !currentItemIds.includes(id2));

            for (const delId of deletedItemIds) {
                if (!delId.startsWith('local-')) {
                    try {
                        await databases.deleteDocument(APPWRITE_DATABASE_ID, colDayItem, delId);
                    } catch { }
                }
            }



            const persistedItemIds: string[] = [];
            for (const it of currentItems) {
                const isNewItem = it.id.startsWith('local-');
                if (isNewItem) {
                    const created = await databases.createDocument(
                        APPWRITE_DATABASE_ID,
                        colDayItem,
                        ID.unique(),
                        {
                            type: it.type,
                            title: it.type === 'Activity' || it.type === 'Stay' ? null : it.title || null,
                            description: it.type === 'Activity' || it.type === 'Stay' ? null : it.description || null,
                            refActivity: it.type === 'Activity' ? (it.refActivity || []) : [],
                            refHotel: it.type === 'Stay' ? (it.refHotel || []) : [],
                        },
                        [Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())]
                    );
                    it.id = created.$id;
                    persistedItemIds.push(created.$id);

                } else {

                    const orig = origItemMap[it.id];
                    const changed =
                        !orig ||
                        orig.type !== it.type ||
                        (orig.title || '') !== (it.title || '') ||
                        (orig.description || '') !== (it.description || '') ||
                        JSON.stringify(orig.refActivity || []) !== JSON.stringify(it.refActivity || []) ||
                        JSON.stringify(orig.refHotel || []) !== JSON.stringify(it.refHotel || []);
                    if (changed) {
                        await databases.updateDocument(APPWRITE_DATABASE_ID, colDayItem, it.id, {
                            type: it.type,
                            title: it.type === 'Activity' || it.type === 'Stay' ? '' : it.title || '',
                            description: it.type === 'Activity' || it.type === 'Stay' ? '' : it.description || '',
                            refActivity: it.type === 'Activity' ? (it.refActivity || []) : [],
                            refHotel: it.type === 'Stay' ? (it.refHotel || []) : [],
                        });
                    }
                    persistedItemIds.push(it.id);
                }
            }

            const origItemIds = origItems.map((i) => i.id);
            const itemsChanged = isNewDay || JSON.stringify(origItemIds) !== JSON.stringify(persistedItemIds);
            if (itemsChanged) {
                await databases.updateDocument(APPWRITE_DATABASE_ID, colDayPlan, planId!, { items: persistedItemIds });
            }

            finalDayPlanIds.push(planId!);
        }

        // update itinerary.days only if needed
        const origDayIds = originalGraph.days.filter((d) => d.planId).map((d) => d.planId!);
        const daysChanged = JSON.stringify(origDayIds) !== JSON.stringify(finalDayPlanIds);
        if (daysChanged) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, col, id, { days: finalDayPlanIds });
        }

        setOriginalGraph({ days: JSON.parse(JSON.stringify(editorIt.days)) });
    };

    const save = async () => {
        if (saving || !editorIt.$id) return;
        if (!editorIt.title.trim()) return;
        setSaving(true);
        try {
            let id = itineraryId as string;

            const payload = {
                title: editorIt.title,
                description: editorIt.description,
                destinationIds: editorIt.destinationIds || [],
                priceSegmentIds: editorIt.priceSegmentIds || [],
                bannerUrl: editorIt.bannerUrl || '',
                inclusionHtml: editorIt.inclusionHtml || '',
                exclusionHtml: editorIt.exclusionHtml || '',
                termsHtml: editorIt.termsHtml || '',
            };
            await databases.updateDocument(APPWRITE_DATABASE_ID, col, id, payload);

            await updateItineraryGraphPartial(id);

            router.push('/itineraries');
        } catch (e) {
            console.error('Save failed', e);
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        router.back();
    };

    const segNames = useMemo(
        () => (editorIt.priceSegmentIds || []).map((id) => segs.find((s) => s.$id === id)?.name || id),
        [editorIt.priceSegmentIds, segs]
    );
    const destNames = useMemo(
        () => (editorIt.destinationIds || []).map((id) => dests.find((d) => d.$id === id)?.name || id),
        [editorIt.destinationIds, dests]
    );

    const htmlToPlainText = (input?: string): string => {
        if (!input) return '';
        let s = String(input);
        s = s
            .replace(/<\s*br\s*\/?>/gi, '\n')
            .replace(/<\/\s*p\s*>/gi, '\n')
            .replace(/<\/\s*li\s*>/gi, '\n')
            .replace(/<\/\s*div\s*>/gi, '\n');
        s = s.replace(/<[^>]+>/g, '');
        if (typeof window !== 'undefined') {
            const el = document.createElement('textarea');
            el.innerHTML = s;
            return el.value;
        }
        return s;
    };

    const updateDayField = (idx: number, field: keyof DayPlan, value: string) => {
        setEditorIt((prev) => {
            const days = [...(prev.days || [])];
            days[idx] = { ...days[idx], [field]: value };
            return { ...prev, days };
        });
    };

    const removeDay = (i: number) => {
        setEditorIt((prev) => {
            const days = [...(prev.days || [])];
            days.splice(i, 1);
            const renum = days.map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
            return { ...prev, days: renum };
        });
    };

    const addItem = (dayIdx: number) => {
        setEditorIt((prev) => {
            const days = [...(prev.days || [])];
            const items = [...(days[dayIdx].items || [])];
            items.push({
                id: 'local-' + crypto.randomUUID(),
                type: 'Activity',
                title: '',
                refActivity: [],
                refHotel: [],
                description: '',
            });
            days[dayIdx] = { ...days[dayIdx], items };
            return { ...prev, days };
        });
    };
    const removeItem = (dayIdx: number, itemId: string) => {
        setEditorIt((prev) => {
            const days = [...(prev.days || [])];
            days[dayIdx] = { ...days[dayIdx], items: days[dayIdx].items.filter((i) => i.id !== itemId) };
            return { ...prev, days };
        });
    };

    const addDay = () => {
        setEditorIt((prev) => ({
            ...prev,
            days: [
                ...(prev.days || []),
                { planId: undefined, dayNumber: (prev.days?.length || 0) + 1, title: '', summary: '', date: '', items: [] },
            ],
        }));
    };

    const updateItemField = <K extends keyof DayItem>(dayIdx: number, itemId: string, field: K, value: DayItem[K]) => {
        setEditorIt((prev) => {
            const days = [...(prev.days || [])];
            const items = [...(days[dayIdx].items || [])];
            const idx = items.findIndex((i) => i.id === itemId);
            if (idx !== -1) {
                items[idx] = { ...items[idx], [field]: value };
                if (field === 'type') {
                    if (value === 'Activity') {
                        items[idx].refHotel = [];
                        items[idx].title = '';
                        items[idx].description = '';
                    } else if (value === 'Stay') {
                        items[idx].refActivity = [];
                        items[idx].title = '';
                        items[idx].description = '';
                    } else {
                        items[idx].refActivity = [];
                        items[idx].refHotel = [];
                    }
                }
            }
            days[dayIdx] = { ...days[dayIdx], items };
            return { ...prev, days };
        });
    };

    const downloadPreviewPdf = async () => {
        if (!previewRef.current) return;
        setExporting(true);
        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            const original = previewRef.current;
            const fullWidth = original.clientWidth;
            const fullHeight = original.scrollHeight;

            // Clone full content once (we will crop per page)
            const clone = original.cloneNode(true) as HTMLElement;
            clone.style.width = `${fullWidth}px`;
            clone.style.height = `${fullHeight}px`;
            clone.style.overflow = 'visible';
            clone.style.backgroundColor = '#ffffff';

            // Normalize styles that can break capture
            clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
                const cs = getComputedStyle(el);
                if (cs.position === 'sticky') el.style.position = 'static';
                if (cs.transform && cs.transform !== 'none') el.style.transform = 'none';
                if (cs.filter && cs.filter !== 'none') el.style.filter = 'none';
                if (cs.backdropFilter && cs.backdropFilter !== 'none') el.style.backdropFilter = 'none';
                if (cs.overflow !== 'visible') el.style.overflow = 'visible';
            });

            // Ensure images don't taint the canvas
            clone.querySelectorAll('img').forEach((img) => {
                img.setAttribute('crossorigin', 'anonymous');
                const el = img as HTMLImageElement;
                el.loading = 'eager';
                el.decoding = 'sync';
            });

            // Wait for fonts
            // @ts-ignore
            if (document.fonts?.ready) await (document as any).fonts.ready;

            // Holder that crops each page segment
            const holder = document.createElement('div');
            holder.style.position = 'fixed';
            holder.style.top = '-100000px';
            holder.style.left = '-100000px';
            holder.style.width = `${fullWidth}px`;
            holder.style.height = `${fullHeight}px`; // temp; we set per page before capture
            holder.style.overflow = 'hidden';
            holder.style.backgroundColor = '#ffffff';

            // Stage wraps the clone so we can translate it
            const stage = document.createElement('div');
            stage.style.width = `${fullWidth}px`;
            stage.style.height = `${fullHeight}px`;
            stage.style.willChange = 'transform';
            stage.appendChild(clone);
            holder.appendChild(stage);
            document.body.appendChild(holder);

            // PDF metrics with 12.7mm margins on all sides
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            const margin = 12.7; // 12.7mm on all sides
            const usableW = pdfW - margin * 2;
            const usableH = pdfH - margin * 2;

            // Scale canvas to fit width inside margins
            const mmPerPx = usableW / fullWidth; // mm per pixel at target width
            const pagePxHeight = Math.floor(usableH / mmPerPx);

            // Build page slices at safe breakpoints (don't cut blocks)
            let blocks = Array.from(original.querySelectorAll('[data-export-block]')) as HTMLElement[];
            // Fallback: if no markers, treat whole content as a single block
            if (!blocks.length) blocks = [original];

            // Compute block tops/bottoms relative to the scroll container
            const rootRect = original.getBoundingClientRect();
            const blockRects = blocks
                .map((b) => {
                    const r = b.getBoundingClientRect();
                    const top = original.scrollTop + (r.top - rootRect.top); // relative to scroll container top
                    const height = b.offsetHeight || (r.height ?? 0);
                    return { top: Math.max(0, Math.floor(top)), bottom: Math.floor(top + height) };
                })
                .sort((a, b) => a.top - b.top);

            const slices: { y: number; h: number }[] = [];
            let pageStart = 0;
            let currentBottom = 0;

            const pushSlice = (start: number, height: number) => {
                const y = Math.max(0, Math.floor(start));
                const h = Math.max(1, Math.floor(height)) + 20;
                slices.push({ y, h });
            };
            const flushPage = () => {
                if (currentBottom > pageStart) pushSlice(pageStart, currentBottom - pageStart);
                pageStart = currentBottom;
            };

            for (let i = 0; i < blockRects.length; i++) {
                const { top, bottom } = blockRects[i];

                // If this block alone exceeds page height, chunk it
                if (bottom - top > pagePxHeight) {
                    // Flush current page before tall block
                    if (currentBottom > pageStart) flushPage();

                    let y = top;
                    while (y < bottom) {
                        const sliceH = Math.min(pagePxHeight, bottom - y);
                        pushSlice(y, sliceH);
                        y += sliceH;
                        pageStart = y;
                    }
                    currentBottom = pageStart;
                    continue;
                }

                // If this block doesn't fit in current page, flush and start new page at block top
                if (top - pageStart >= 0 && bottom - pageStart > pagePxHeight) {
                    flushPage();
                }
                // Extend current page bottom to include this block
                currentBottom = Math.max(currentBottom, bottom);
            }
            // Flush remaining content
            if (currentBottom > pageStart) flushPage();

            // Now capture each slice independently to avoid large-canvas limits
            for (let i = 0; i < slices.length; i++) {
                const slice = slices[i];

                // Adjust holder to slice size and translate stage to show the slice area
                holder.style.width = `${fullWidth}px`;
                holder.style.height = `${slice.h}px`;
                stage.style.transform = `translateY(-${slice.y}px)`;

                // Render only the visible portion (holder)
                const pageCanvas = await html2canvas(holder, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    allowTaint: false,
                    width: fullWidth,
                    height: slice.h,
                    // ignoreElements still needed
                    ignoreElements: (el) => (el as HTMLElement)?.classList?.contains('no-export'),
                });

                const imgData = pageCanvas.toDataURL('image/png');
                const imgHmm = slice.h * mmPerPx; // height in mm respecting margins

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, margin, usableW, Math.min(imgHmm, usableH), undefined, 'FAST');
            }

            // Cleanup
            document.body.removeChild(holder);

            pdf.save(`${(editorIt.title || 'itinerary').replace(/[\\/:*?"<>|]/g, '')}.pdf`);
        } catch (e) {
            console.error('PDF export failed', e);
            alert('Failed to generate PDF.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-80px)]">
            <div ref={previewRef} className="preview w-3/5 overflow-y-auto rounded bg-white">
                <div className="relative" data-export-block>
                    <div className='relative'>
                        <img
                            src={editorIt.bannerUrl || 'https://placehold.co/800x400?text=Loading...'}
                            alt="Itinerary header"
                            className="w-full object-cover rounded-t-xl"
                        />
                        <div className="absolute bottom-0 px-6 py-1 bg-black/70 w-full flex items-center justify-between">
                            <span className="text-white mt-2 mb-1">Ph: <strong className='tracking-wider'>{settings?.phone}</strong></span>
                            <img
                                src={settings?.logoUrl || '/images/logo.png'}
                                alt={settings?.companyName || 'Logo'}
                                className="h-10 w-auto"
                            />
                            <span className="text-white"><strong className='tracking-wider'>{settings?.email}</strong></span>
                        </div>
                    </div>
                    {/* <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm">
                        <img
                            src={settings?.logoUrl || '/images/logo.png'}
                            alt={settings?.companyName || 'Logo'}
                            className="h-10 w-auto"
                        />

                    </div> */}
                    <div className="absolute top-3 right-3 flex gap-2 no-export">
                        <Button size="sm" variant="outline" onClick={() => setBannerOpen(true)}>Change Banner</Button>
                        <Button size="sm" variant="secondary" onClick={downloadPreviewPdf} disabled={exporting}>
                            {exporting ? 'Generating…' : 'Download PDF'}
                        </Button>
                    </div>
                    <div className="p-4 mt-4">
                        <h1 className="text-3xl font-bold">{editorIt.title || ''}</h1>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {destNames.map((n) => (
                                <span key={n} className=" bg-orange-100 border px-2 py-1 rounded-full">
                                    <span className="text-green-700">●</span> <strong className='tracking-wide'>{n}</strong>
                                </span>
                            ))}
                        </div>
                        <div className="my-4 flex flex-wrap gap-2">

                            {segNames.map((n) => (
                                <span key={n} className="inline-block px-3 py-2 font-semibold rounded-full bg-gray-200 text-gray-700">
                                    <strong className='tracking-wide'>Pocket Pinch - </strong>{n}
                                </span>
                            ))}
                        </div>
                        {
                            priceLocal !== '' && (
                                <div className="my-4 flex flex-wrap gap-2">

                                    <span className="inline-block px-3 py-2 font-semibold rounded-full bg-orange-100 text-gray-700">
                                        <strong className='tracking-wide'>Price - </strong>{priceLocal}
                                    </span>

                                </div>

                            )
                        }

                        {editorIt.description && <p className="mt-3 text-gray-700" dangerouslySetInnerHTML={{ __html: editorIt.description }} />}
                    </div>
                </div>

                {/* Days */}
                <div className="p-4 space-y-4">
                    {(editorIt.days || []).map((d) => (
                        <div key={d.dayNumber} className="border rounded" data-export-block>
                            <div className="flex items-center gap-3 p-3 border-b">
                                <img src="/images/calendar.png" className="w-10 h-10 object-cover rounded" alt="" />
                                <div>
                                    <h2 className="font-semibold">Day {d.dayNumber}{d.date ? " (" + new Date(d.date).toDateString() + ")" : ""} - {d.title}</h2>
                                </div>
                            </div>
                            <div className="p-3">
                                {d.summary && <div className="mb-2 " dangerouslySetInnerHTML={{ __html: d.summary }} />}
                                <div className="space-y-2 mt-4">
                                    {(d.items || []).map((it) => {
                                        const activityObjs = it.type === 'Activity'
                                            ? (it.refActivity || []).map(aid => activities.find(a => a.$id === aid)).filter(Boolean)
                                            : [];
                                        const hotelObjs = it.type === 'Stay'
                                            ? (it.refHotel || []).map(hid => hotels.find(h => h.$id === hid)).filter(Boolean)
                                            : [];

                                        const label =
                                            it.type === 'Activity'
                                                ? (activityObjs.map(a => a?.name).filter(Boolean).join(', ') || 'Activity')
                                                : it.type === 'Stay'
                                                    ? (hotelObjs.map(h => h?.name).filter(Boolean).join(', ') || 'Stay')
                                                    : (it.title || it.type);

                                        const sub =
                                            it.type === 'Activity'
                                                ? activityObjs.map(a => a?.description || '').filter(Boolean).join('\n')
                                                : it.type === 'Stay'
                                                    ? hotelObjs.map(h => h?.description || '').filter(Boolean).join('\n')
                                                    : (it.description || '');

                                        let imageKey = ""
                                        if (it.type === 'Activity') {
                                            imageKey = 'sightseeing';
                                        } else if (it.type === 'Stay') {
                                            if (hotelObjs.length === 0) {
                                                imageKey = 'stay';
                                            } else {
                                                imageKey = hotelObjs[0]?.type.toLowerCase() || 'stay';
                                            }
                                        }

                                        return (
                                            <div key={it.id} className="flex items-start gap-3 mb-4">
                                                <img
                                                    src={`/images/${imageKey}.png`}
                                                    className="w-10 h-10 rounded object-cover"
                                                    alt={label}
                                                />
                                                <div>
                                                    <div className="font-medium font-semibold">{label}</div>
                                                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                                        {htmlToPlainText(sub)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex items-center justify-center my-4' data-export-block>
                    <img src="/images/divider.png" className="w-50 opacity-30 " alt="Divider" />
                </div>

                {/* Inclusions */}
                <div className="p-4 space-y-4" data-export-block>
                    <div className="border rounded">
                        <div className='flex items-center gap-3 p-3 border-b'>
                            <img src="/images/inclusions.png" className="w-10 h-10 object-cover rounded" alt="" />
                            <div>
                                <h2 className="font-semibold">Inclusions</h2>
                            </div>
                        </div>
                        <div className="p-3" dangerouslySetInnerHTML={{ __html: editorIt.inclusionHtml || '' }}>
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-center my-4' data-export-block>
                    <img src="/images/divider.png" className="w-50 opacity-30 " alt="Divider" />
                </div>

                {/* Exclusions */}
                <div className="p-4 space-y-4" data-export-block>
                    <div className="border rounded">
                        <div className='flex items-center gap-3 p-3 border-b'>
                            <img src="/images/exclusions.png" className="w-10 h-10 object-cover rounded" alt="" />
                            <div>
                                <h2 className="font-semibold">Exclusions</h2>
                            </div>
                        </div>
                        <div className="p-3 " dangerouslySetInnerHTML={{ __html: editorIt.exclusionHtml || '' }}>
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-center my-4' data-export-block>
                    <img src="/images/divider.png" className="w-50 opacity-30 " alt="Divider" />
                </div>

                {/* Terms & Conditions */}
                <div className="p-4 space-y-4" data-export-block>
                    <div className="border rounded">
                        <div className='flex items-center gap-3 p-3 border-b'>
                            <img src="/images/terms.png" className="w-10 h-10 object-cover rounded" alt="" />
                            <div>
                                <h2 className="font-semibold">Terms & Conditions</h2>
                            </div>
                        </div>
                        <div className="p-3" dangerouslySetInnerHTML={{ __html: editorIt.termsHtml || '' }}>
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-center my-4' data-export-block>
                    <img src="/images/end-divider.png" className="w-sm opacity-30 " alt="Divider" />
                </div>
            </div>

            <div className="w-2/5 overflow-y-auto border rounded bg-white p-4">
                <div className="sticky top-0 bg-white z-10 p-3 border rounded-lg flex gap-2 justify-end">
                    <Button variant="outline" onClick={cancel}>Cancel</Button>
                    <Button onClick={save} disabled={saving || !editorIt.title.trim()}>
                        Save
                    </Button>
                </div>

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label className="text-right">Title</Label>
                        <Input
                            className="col-span-3"
                            value={editorIt.title}
                            onChange={(e) => setEditorIt({ ...editorIt, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-3">
                        <Label className="text-right pt-2">Description <small><i>(Max 2000 Characters)</i></small></Label>
                        <div className="col-span-3">
                            {editorHydrated ? (
                                <ReactQuill
                                    theme="snow"
                                    modules={quillModules}
                                    formats={quillFormats}
                                    value={editorIt.description}
                                    onChange={(value) => setEditorIt({ ...editorIt, description: value })}
                                    placeholder='High-level itinerary overview'
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading editor…</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-3">
                        <Label className="text-right pt-2">Destinations</Label>
                        <div className="col-span-3">
                            {destOptions.length > 0 ? (
                                <MultiSelect
                                    options={destOptions}
                                    defaultValue={editorIt.destinationIds}
                                    onValueChange={(values) =>
                                        setEditorIt(prev => ({ ...prev, destinationIds: values }))
                                    }
                                    placeholder="Select destinations"
                                    maxCount={5}

                                />
                            ) : (
                                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                                    Loading destinations...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-3">
                        <Label className="text-right pt-2">Price Segments</Label>
                        <div>
                            <MultiSelect
                                options={segOptions}
                                defaultValue={editorIt.priceSegmentIds}
                                onValueChange={(values) =>
                                    setEditorIt(prev => ({ ...prev, priceSegmentIds: values }))
                                }
                                placeholder="Select"
                                single
                            />


                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label className="text-right">Price</Label>
                        <Input
                            className="col-span-3"
                            value={priceLocal}
                            onChange={(e) => setPriceLocal(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">Day-wise Plan</h3>
                            <Button type="button" onClick={addDay}>
                                Add Day
                            </Button>
                        </div>

                        {(editorIt.days || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground mt-2">No days added yet.</p>
                        ) : (
                            <div className="mt-3 space-y-4">
                                {editorIt.days!.map((day, dayIdx) => (
                                    <div key={dayIdx} className="border rounded p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">Day {day.dayNumber}</div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => addItem(dayIdx)}>Add Item</Button>
                                                <Button variant="destructive" onClick={() => removeDay(dayIdx)}>
                                                    Remove Day
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div className='md:col-span-3'>
                                                <Label className="text-sm">Title</Label>
                                                <Input value={day.title || ''} onChange={(e) => updateDayField(dayIdx, 'title', e.target.value)} />
                                            </div>

                                            <div className='md:col-span-3'>
                                                <Label className="text-sm">Date</Label>
                                                <Input type="date" value={day.date || ''} onChange={(e) => updateDayField(dayIdx, 'date', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-3">
                                                <Label className="text-sm">Summary <small><i>(Max 1000 Characters)</i></small></Label>
                                                <div>
                                                    {editorHydrated ? (
                                                        <ReactQuill
                                                            theme="snow"
                                                            modules={quillModules}
                                                            formats={quillFormats}
                                                            value={day.summary || ''}
                                                            onChange={(value) => updateDayField(dayIdx, 'summary', value)}
                                                            placeholder='Short summary of the day'
                                                        />
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground">Loading editor…</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {day.items.map((item) => (
                                                <div key={item.id} className="border rounded p-3">
                                                    <div className="grid gap-3 md:grid-cols-6">
                                                        <div className="md:col-span-3">
                                                            <Label className="text-sm">Type</Label>
                                                            <Select
                                                                value={item.type}
                                                                onValueChange={(value) =>
                                                                    updateItemField(dayIdx, item.id, 'type', value as DayItemType)
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectItem value="Activity">Activity</SelectItem>
                                                                        <SelectItem value="Stay">Stay</SelectItem>
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {(item.type !== 'Activity' && item.type !== 'Stay') && (
                                                            <div className="md:col-span-3">
                                                                <Label className="text-sm">Title</Label>
                                                                <Input
                                                                    value={item.title}
                                                                    onChange={(e) => updateItemField(dayIdx, item.id, 'title', e.target.value)}
                                                                    placeholder="Item title"
                                                                />
                                                            </div>
                                                        )}

                                                        {item.type === 'Activity' && (
                                                            <div className="md:col-span-3">
                                                                <Label className="text-sm">Link Activity</Label>
                                                                <MultiSelect
                                                                    options={activities.map(a => ({ label: a.name, value: a.$id }))}
                                                                    defaultValue={item.refActivity && item.refActivity?.length > 0 ? item.refActivity : []}
                                                                    onValueChange={(values) =>
                                                                        updateItemField(dayIdx, item.id, 'refActivity', values)
                                                                    }
                                                                    placeholder="Select"
                                                                    single
                                                                />
                                                                {/* <Select
                                                                    value={item.refActivity && item.refActivity?.length > 0 ? item.refActivity[0] : ''}
                                                                    onValueChange={(value) =>
                                                                        updateItemField(dayIdx, item.id, 'refActivity', [value])
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectGroup>
                                                                            {activities.map((a) => (
                                                                                <SelectItem key={a.$id} value={a.$id}>
                                                                                    {a.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectGroup>
                                                                    </SelectContent>
                                                                </Select> */}
                                                            </div>
                                                        )}

                                                        {item.type === 'Stay' && (
                                                            <div className="md:col-span-3">
                                                                <Label className="text-sm">Link Stays</Label>
                                                                <MultiSelect
                                                                    options={hotels.map(a => ({ label: a.name, value: a.$id }))}
                                                                    defaultValue={item.refHotel && item.refHotel?.length > 0 ? item.refHotel : []}
                                                                    onValueChange={(values) =>
                                                                        updateItemField(dayIdx, item.id, 'refHotel', values)
                                                                    }
                                                                    placeholder="Select"
                                                                    single
                                                                />
                                                                {/* <Select
                                                                    value={item.refHotel && item.refHotel?.length > 0 ? item.refHotel[0] : ''}
                                                                    onValueChange={(value) =>
                                                                        updateItemField(dayIdx, item.id, 'refHotel', [value])
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectGroup>
                                                                            {hotels.map((h) => (
                                                                                <SelectItem key={h.$id} value={h.$id}>
                                                                                    {h.name} {h.type ? `(${h.type})` : ''}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectGroup>
                                                                    </SelectContent>
                                                                </Select> */}
                                                            </div>
                                                        )}

                                                        {(item.type !== 'Activity' && item.type !== 'Stay') && (
                                                            <div className="md:col-span-6">
                                                                <Label className="text-sm">Notes</Label>
                                                                <div>
                                                                    {editorHydrated ? (
                                                                        <ReactQuill
                                                                            theme="snow"
                                                                            modules={quillModules}
                                                                            formats={quillFormats}
                                                                            value={item.description || ''}
                                                                            onChange={(e) => updateItemField(dayIdx, item.id, 'description', e)}
                                                                            placeholder='Details, instructions, etc.'
                                                                        />
                                                                    ) : (
                                                                        <div className="text-xs text-muted-foreground">Loading editor…</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="md:col-span-6 flex justify-end">
                                                            <Button variant="destructive" onClick={() => removeItem(dayIdx, item.id)}>
                                                                Remove Item
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-end mt-2">
                                            <div className="flex gap-2">
                                                <Button onClick={() => addItem(dayIdx)}>Add Item</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-end mt-2">
                            <Button type="button" onClick={addDay}>
                                Add Day
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Inclusions <small><i>(Max 1000 Characters)</i></small></h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditorIt(prev => ({ ...prev, inclusionHtml: settings?.inclusionTemplateHtml || '' }))}
                            >
                                Reset to template
                            </Button>
                        </div>
                        <div>
                            {editorHydrated ? (
                                <ReactQuill
                                    theme="snow"
                                    modules={quillModules}
                                    formats={quillFormats}
                                    value={inclusionHtmlLocal}
                                    onChange={setInclusionHtmlLocal}
                                    onBlur={() => setEditorIt(prev => ({ ...prev, inclusionHtml: inclusionHtmlLocal }))}
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading editor…</div>
                            )}
                        </div>
                    </div>

                    <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Exclusions <small><i>(Max 1000 Characters)</i></small></h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditorIt(prev => ({ ...prev, exclusionHtml: settings?.exclusionTemplateHtml || '' }))}
                            >
                                Reset to template
                            </Button>
                        </div>
                        <div>
                            {editorHydrated ? (
                                <ReactQuill
                                    theme="snow"
                                    modules={quillModules}
                                    formats={quillFormats}
                                    value={exclusionHtmlLocal}
                                    onChange={setExclusionHtmlLocal}
                                    onBlur={() => setEditorIt(prev => ({ ...prev, exclusionHtml: exclusionHtmlLocal }))}
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading editor…</div>
                            )}
                        </div>
                    </div>

                    <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Terms & Conditions <small><i>(Max 10000 Characters)</i></small></h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditorIt(prev => ({ ...prev, termsHtml: settings?.termsTemplateHtml || '' }))}
                            >
                                Reset to template
                            </Button>
                        </div>
                        <div>
                            {editorHydrated ? (
                                <ReactQuill
                                    theme="snow"
                                    modules={quillModules}
                                    formats={quillFormats}
                                    value={termsHtmlLocal}
                                    onChange={setTermsHtmlLocal}
                                    onBlur={() => setEditorIt(prev => ({ ...prev, termsHtml: termsHtmlLocal }))}
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading editor…</div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={cancel}>Cancel</Button>
                    <Button onClick={save} disabled={saving || !editorIt.title.trim()}>
                        Save
                    </Button>
                </DialogFooter>
            </div>

            <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Choose Banner Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Keyword (e.g. mountains, beach)"
                                value={bannerSearch}
                                onChange={(e) => setBannerSearch(e.target.value)}
                            />
                            <Button onClick={searchPexels} disabled={!bannerSearch.trim() || bannerLoading}>
                                {bannerLoading ? 'Searching…' : 'Search'}
                            </Button>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto border rounded p-2">
                            {bannerLoading && <div className="text-sm">Loading photos…</div>}
                            {!bannerLoading && bannerResults.length === 0 && <div className="text-sm text-muted-foreground">No results.</div>}
                            <div className="grid grid-cols-3 gap-3">
                                {bannerResults.map(p => {
                                    const src = p.src?.landscape || p.src?.large || p.src?.original;
                                    return (
                                        <div key={p.id} className="group relative">
                                            <img
                                                src={src}
                                                alt={p.alt || 'Photo'}
                                                className="h-28 w-full object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => selectBanner(src)}
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 text-white text-xs flex items-center justify-center rounded transition"
                                            >
                                                Use
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {editorIt.bannerUrl && (
                            <div className="text-xs">
                                Current: <a href={editorIt.bannerUrl} target="_blank" rel="noreferrer" className="underline">Open</a>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBannerOpen(false)}>Close</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setEditorIt(prev => ({ ...prev, bannerUrl: '' }));
                                setBannerOpen(false);
                            }}
                        >
                            Remove Banner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}