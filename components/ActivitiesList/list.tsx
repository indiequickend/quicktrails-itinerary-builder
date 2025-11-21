'use client';
import { useEffect, useState } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Activity } from '@/types';
import { createColumns } from "./columns";
import { DataTable } from "./DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Query } from 'appwrite'; // Import Query from appwrite

export default function ActivitiesList() {
    const { databases, APPWRITE_ID, APPWRITE_DATABASE_ID } = useAppwrite();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [open, setOpen] = useState(false);
    const [isNewActivity, setIsNewActivity] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [newActivity, setNewActivity] = useState<Omit<Activity, "$id">>({
        name: '',
        description: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const col = '682a299f0013be805f72'; // activities

    const load = async () => {
        try {
            // Use query to exclude description field when listing all activities
            const res = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                col,
                [
                    Query.select(['$id', 'name']), // Only fetch ID and name for list
                ]
            );
            setActivities(res.documents as Activity[]);
        } catch (error) {
            console.error("Error loading activities:", error);
        }
    };

    useEffect(() => { load(); }, []);

    // Add a function to fetch a single activity with description
    const fetchActivityDetails = async (id: string) => {
        try {
            const activityDoc = await databases.getDocument(
                APPWRITE_DATABASE_ID,
                col,
                id
            );

            return activityDoc as Activity;
        } catch (error) {
            console.error(`Error fetching activity ${id}:`, error);
            return null;
        }
    };

    const handleCreate = async () => {
        try {
            if (isNewActivity) {
                await databases.createDocument(APPWRITE_DATABASE_ID, col, APPWRITE_ID.unique(), newActivity);
            } else {
                await databases.updateDocument(APPWRITE_DATABASE_ID, col, editingId!, newActivity);
            }

            setOpen(false);
            resetForm();
            load();
        } catch (error) {
            console.error("Error saving activity:", error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, col, id);
            load();
        } catch (error) {
            console.error("Error deleting activity:", error);
        }
    };

    const resetForm = () => {
        setNewActivity({
            name: '',
            description: '',
        });
        setEditingId(null);
        setIsNewActivity(true);
    };

    const openNewActivityDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleEdit = async (id: string) => {
        try {
            setIsLoading(true); // Start loading state
            setOpen(true); // Open dialog immediately to show loading

            // Fetch the full activity with description
            const activityToEdit = await fetchActivityDetails(id);

            if (activityToEdit) {
                setNewActivity({
                    name: activityToEdit.name,
                    description: activityToEdit.description || '', // Now we have the description
                });
                setEditingId(id);
                setIsNewActivity(false);
            } else {
                // If we couldn't fetch details, close the dialog
                setOpen(false);
            }
        } catch (error) {
            console.error("Error editing activity:", error);
            setOpen(false); // Close dialog on error
        } finally {
            setIsLoading(false); // End loading state
        }
    };

    // Create columns with the handlers
    const columns = createColumns(handleEdit, handleDelete);

    return (
        <div className="container mx-auto py-4">
            <h2 className="text-xl font-semibold mb-4">Manage Activities</h2>

            <DataTable
                columns={columns}
                data={activities}
                onAddNew={openNewActivityDialog}
            />

            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
            }}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{isNewActivity ? 'Add New Activity' : 'Edit Activity'}</DialogTitle>
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
                                    value={newActivity.name}
                                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>

                            {/* Description with Rich Text Editor */}
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="description" className="text-right pt-2">
                                    Description
                                </Label>
                                <div className="col-span-3">
                                    <RichTextEditor
                                        content={newActivity.description}
                                        onChange={(html) => {
                                            setNewActivity({ ...newActivity, description: html });
                                        }}
                                    />
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
                            onClick={handleCreate}
                            disabled={!newActivity.name.trim() || isLoading}
                        >
                            {isNewActivity ? 'Save' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
