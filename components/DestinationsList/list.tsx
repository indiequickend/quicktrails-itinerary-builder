import { useEffect, useState } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Destination, Activity } from '@/types';
import { createColumns } from "./columns";
import { DataTable } from "./DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from "@/components/ui/multi-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Query } from 'appwrite'; // Import Query from appwrite

// Define the activity option type for better type safety
interface ActivityOption {
    label: string;
    value: string;
}

export default function DestinationsList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    // Add activityOptions as a state variable
    const [activityOptions, setActivityOptions] = useState<ActivityOption[]>([]);
    const [isNewDestination, setIsNewDestination] = useState(true);
    const [open, setOpen] = useState(false);
    const [newDest, setNewDest] = useState<Omit<Destination, "$id">>({
        name: '',
        description: '', // Add description field with default empty string
        activityIds: [],
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const colD = '682a29f4002ba23bf3fe'; // destinations
    const colA = '682a299f0013be805f72'; // activities

    const load = async () => {
        try {
            const [dRes, aRes] = await Promise.all([
                // Use query to exclude description field when listing all destinations
                databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    colD,
                    // Add a query parameter to select only needed fields
                    [
                        Query.select(['$id', 'name', 'activityIds']),
                        Query.limit(500),
                        Query.orderDesc('$createdAt'),
                    ]
                ),
                databases.listDocuments(APPWRITE_DATABASE_ID, colA),
            ]);
            setDestinations(dRes.documents as Destination[]);
            setActivities(aRes.documents as Activity[]);
        } catch (error) {
            console.error("Error loading destinations and activities:", error);
        }
    };

    useEffect(() => { load(); }, []);

    // Update activityOptions whenever activities change
    useEffect(() => {
        // Transform activities for multi-select
        const options = activities.map(activity => ({
            label: activity.name,
            value: activity.$id || '',
        }));
        setActivityOptions(options);

        // Debug output
        console.log("Activity options updated:", options);
    }, [activities]);

    // Add a function to fetch a single destination with description
    const fetchDestinationDetails = async (id: string) => {
        try {
            const destDoc = await databases.getDocument(
                APPWRITE_DATABASE_ID,
                colD,
                id
            );

            return destDoc as Destination;
        } catch (error) {
            console.error(`Error fetching destination ${id}:`, error);
            return null;
        }
    };

    const handleCreate = async (destination: Omit<Destination, "$id">) => {
        try {
            if (isNewDestination) {
                await databases.createDocument(APPWRITE_DATABASE_ID, colD, APPWRITE_ID.unique(), destination);
            } else {
                await databases.updateDocument(APPWRITE_DATABASE_ID, colD, editingId!, destination);
            }

            setOpen(false);
            resetForm();
            load();
        } catch (error) {
            console.error("Error saving destination:", error);
        }
    };

    const resetForm = () => {
        setNewDest({
            name: '',
            description: '', // Reset description field
            activityIds: [],
        });
        setEditingId(null);
        setIsNewDestination(true);
    };

    const openNewDestinationDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleEdit = async (id: string) => {
        try {
            setIsLoading(true); // Start loading state
            setOpen(true); // Open dialog immediately to show loading

            // Fetch the full destination with description
            const destToEdit = await fetchDestinationDetails(id);

            if (destToEdit) {
                setNewDest({
                    name: destToEdit.name,
                    description: destToEdit.description || '', // Now we have the description
                    activityIds: destToEdit.activityIds || [],
                });
                setEditingId(id);
                setIsNewDestination(false);
            } else {
                // If we couldn't fetch details, close the dialog
                setOpen(false);
            }
        } catch (error) {
            console.error("Error editing destination:", error);
            setOpen(false); // Close dialog on error
        } finally {
            setIsLoading(false); // End loading state
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this destination?')) return;
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, colD, id);
            await load();
        } catch (error) {
            console.error("Error deleting destination:", error);
        }
    };

    // Create columns with the edit and delete handlers
    const columns = createColumns(handleEdit, activities, handleDelete);

    return (
        <div className="container mx-auto py-4">

            <DataTable
                columns={columns}
                data={destinations}
                onAddNew={openNewDestinationDialog}
            />

            {open && (
                <Dialog open={open} onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) resetForm();
                }}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{isNewDestination ? 'Add New Destination' : 'Edit Destination'}</DialogTitle>
                        </DialogHeader>

                        {isLoading ? (
                            <div className="py-8 flex justify-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newDest.name}
                                        onChange={(e) => setNewDest({ ...newDest, name: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>

                                {/* Description with Rich Text Editor */}
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="description" className="text-right pt-2">
                                        Description
                                    </Label>
                                    <div className="col-span-3">
                                        <RichTextEditor
                                            content={newDest.description}
                                            onChange={(html) => {
                                                setNewDest({ ...newDest, description: html });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="activities" className="text-right">
                                        Activities
                                    </Label>
                                    <div className="col-span-3">
                                        {activityOptions.length > 0 ? (
                                            <MultiSelect
                                                options={activityOptions}
                                                defaultValue={newDest.activityIds}
                                                onValueChange={(values) => {
                                                    setNewDest({
                                                        ...newDest,
                                                        activityIds: values
                                                    });
                                                }}
                                                placeholder="Select activities"
                                            />
                                        ) : (
                                            <div className="text-sm text-muted-foreground p-2 border rounded-md">
                                                Loading activities...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setOpen(false);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleCreate(newDest)}
                                disabled={!newDest.name || isLoading}
                            >
                                {isNewDestination ? 'Save' : 'Update'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}