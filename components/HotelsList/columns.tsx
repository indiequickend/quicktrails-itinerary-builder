"use client"

import { Hotel } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.


export const columns: ColumnDef<Hotel>[] = [
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
        accessorKey: "type",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        enableColumnFilter: true
    },
    {
        accessorKey: "starRating",
        header: "Star Rating",
        cell: ({ row }) => {
            const rating = row.getValue('starRating')
            return rating ?? 'N/A'
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const hotel = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => console.log(hotel.$id)}
                        >
                            {`Edit ${hotel.type}`}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            )
        },
    },
]
