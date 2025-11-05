import { useEffect, useState } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Hotel } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HotelsList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isNewHotel, setIsNewHotel] = useState(true);
    const [open, setOpen] = useState(false);
    const [newHotel, setNewHotel] = useState<Omit<Hotel, "$id">>({
        name: '',
        type: 'Homestay',
        starRating: undefined,
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const col = '682a291600390adfbf80'; //hotels

    const load = async () => {
        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, col);
        setHotels(res.documents as Hotel[]);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (hotel: Omit<Hotel, "$id">) => {
        if (isNewHotel) {
            await databases.createDocument(APPWRITE_DATABASE_ID, col, APPWRITE_ID.unique(), hotel);
        } else {
            await databases.updateDocument(APPWRITE_DATABASE_ID, col, editingId!, hotel);
        }

        setOpen(false);
        resetForm();
        load();
    };

    const resetForm = () => {
        setNewHotel({
            name: '',
            type: 'Hotel',
            starRating: undefined,
        });
        setEditingId(null);
        setIsNewHotel(true);
    };

    const openNewHotelDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleEdit = async (id: string) => {
        const hotelToEdit = hotels.find(h => h.$id === id);
        if (hotelToEdit) {
            setNewHotel({
                name: hotelToEdit.name,
                type: hotelToEdit.type,
                starRating: hotelToEdit.starRating,
            });
            setEditingId(id);
            setIsNewHotel(false);
            setOpen(true);
        }
    };

    const handleDelete = async (id: string, type: string) => {
        if (!confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) return;
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, col, id);
            await load();
        } catch (error) {
            console.error("Error deleting hotel:", error);
        }
    };

    return (
        <div className="container mx-auto py-4">
            <DataTable
                columns={columns(handleEdit, handleDelete)}
                data={hotels}
                onAddNew={openNewHotelDialog}
            />

            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isNewHotel ? 'Add New Hotel' : 'Edit Hotel'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newHotel.name}
                                onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type
                            </Label>
                            <Select
                                value={newHotel.type}
                                onValueChange={(value) => setNewHotel({ ...newHotel, type: value as Hotel['type'] })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Homestay">Homestay</SelectItem>
                                    <SelectItem value="Hotel">Hotel</SelectItem>
                                    <SelectItem value="Resort">Resort</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="starRating" className="text-right">
                                Star Rating
                            </Label>
                            <Input
                                id="starRating"
                                type="number"
                                min={1}
                                max={5}
                                value={newHotel.starRating || ''}
                                onChange={(e) => setNewHotel({
                                    ...newHotel,
                                    starRating: e.target.value ? Number(e.target.value) : undefined
                                })}
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setOpen(false);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleCreate(newHotel)}
                            disabled={!newHotel.name || !newHotel.type}
                        >
                            {isNewHotel ? 'Save' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

