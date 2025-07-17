// client/src/components/inventory-table.tsx
// InventoryTable component for viewing and managing inventory items.
// Supports searching, filtering, editing, and adding items.

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Item } from "@shared/schema";
import UpdateCountDialog from "./update-count-dialog";
import ManageItemDialog from "./manage-item-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Pencil, Plus } from "lucide-react";

/**
 * InventoryTable component.
 * Displays a searchable and filterable table of inventory items.
 * Allows editing, updating count, and adding new items.
 */
export default function InventoryTable() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  // Fetch all items from the API
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Filter items by search query (name or category)
  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to get initials for avatar fallback
  function getInitials(name: string) {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Search input and add item button */}
      <div className="flex items-center mb-4 gap-2">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => setShowAddItem(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Inventory table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems?.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.image?.url} />
                    <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                  </Avatar>
                  <span>{item.name}</span>
                </div>
              </TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.count}</TableCell>
              <TableCell>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "-"}</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => setEditingItem(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setSelectedItem(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs for editing and adding items */}
      {editingItem && (
        <ManageItemDialog
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      {selectedItem && (
        <UpdateCountDialog
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {showAddItem && (
        <ManageItemDialog
          item={null}
          isOpen={showAddItem}
          onClose={() => setShowAddItem(false)}
        />
      )}
    </div>
  );
}