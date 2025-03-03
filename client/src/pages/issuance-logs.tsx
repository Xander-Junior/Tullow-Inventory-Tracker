import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Issuance, Item, User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, ChartBar, Eye, Undo, Redo } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function IssuanceLogs() {
  const [selectedIssuance, setSelectedIssuance] = useState<Issuance | null>(null);
  const [showUndoAlert, setShowUndoAlert] = useState(false);
  const [showRedoAlert, setShowRedoAlert] = useState(false);
  const [, setLocation] = useLocation();

  const { data: issuances } = useQuery<Issuance[]>({
    queryKey: ["/api/issuances"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getItemName = (itemId: number) => {
    return items?.find(item => item.id === itemId)?.name || "Unknown Item";
  };

  const getUserName = (userId: number) => {
    return users?.find(user => user.id === userId)?.username || "Unknown User";
  };

  function handleUndo() {
    setShowUndoAlert(true);
  }

  function handleRedo() {
    setShowRedoAlert(true);
  }

  function goToAnalytics() {
    setLocation('/?tab=analytics');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={goToAnalytics}>
            <ChartBar className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
        <div className="space-x-2">
          <Button onClick={handleUndo} variant="outline" size="sm">
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button onClick={handleRedo} variant="outline" size="sm">
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">Issuance Logs</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issued By</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issuances?.map((issuance) => (
            <TableRow key={issuance.id}>
              <TableCell>
                {format(new Date(issuance.issueDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{getItemName(issuance.itemId)}</TableCell>
              <TableCell>{issuance.quantity}</TableCell>
              <TableCell>{issuance.status}</TableCell>
              <TableCell>{getUserName(issuance.issuerId)}</TableCell>
              <TableCell>{issuance.recipientDepartment}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIssuance(issuance)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedIssuance && (
        <Dialog open={true} onOpenChange={() => setSelectedIssuance(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Issuance Details</DialogTitle>
              <DialogDescription>
                View complete details of this issuance record
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Item</h4>
                <p className="text-sm text-muted-foreground">
                  {getItemName(selectedIssuance.itemId)}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Quantity</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssuance.quantity}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Status</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssuance.status}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Issue Date</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedIssuance.issueDate), "PPP")}
                </p>
              </div>
              {selectedIssuance.returnDate && (
                <div>
                  <h4 className="font-medium">Expected Return Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedIssuance.returnDate), "PPP")}
                  </p>
                </div>
              )}
              {selectedIssuance.returnedDate && (
                <div>
                  <h4 className="font-medium">Returned Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedIssuance.returnedDate), "PPP")}
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-medium">Issued By</h4>
                <p className="text-sm text-muted-foreground">
                  {getUserName(selectedIssuance.issuerId)}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Authorized By</h4>
                <p className="text-sm text-muted-foreground">
                  {getUserName(selectedIssuance.authorizedById)}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Recipient Department</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssuance.recipientDepartment}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showUndoAlert} onOpenChange={setShowUndoAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Undo Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to undo your last action? This will revert the following change:
              [Last Action Description]
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRedoAlert} onOpenChange={setShowRedoAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redo Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to redo your last undone action? This will apply the following change:
              [Next Action Description]
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}