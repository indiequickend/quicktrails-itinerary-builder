"use client"

import { Destination, Activity } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export const createColumns = (
    onEdit: (id: string) => void,
    activities: Activity[],
    onDelete?: (id: string) => void // <-- added onDelete
): ColumnDef<Destination>[] => [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "activityIds",
            header: "Activities",
            cell: ({ row }) => {
                const activityIds = row.getValue("activityIds") as string[]
                return activityIds
                    .map(id => activities.find(a => a.$id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || 'None'
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const destination = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onEdit(destination.$id!)}
                            >
                                Edit Destination
                            </DropdownMenuItem>

                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onDelete(destination.$id!)}
                                    >
                                        Delete Destination
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]