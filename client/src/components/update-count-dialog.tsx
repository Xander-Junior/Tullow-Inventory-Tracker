import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Item, Issuance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const updateCountSchema = z.object({
  count: z.number().min(0, "Count must be 0 or greater"),
  reason: z.string().optional(),
});

type UpdateCountData = z.infer<typeof updateCountSchema>;

interface UpdateCountDialogProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateCountDialog({ item, isOpen, onClose }: UpdateCountDialogProps) {
  const { toast } = useToast();
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);
  const [expectedCount, setExpectedCount] = useState(item.count);

  const form = useForm<UpdateCountData>({
    resolver: zodResolver(updateCountSchema),
    defaultValues: {
      count: item.count,
    },
  });

  // Get recent issuances for this item
  const { data: issuances } = useQuery<Issuance[]>({
    queryKey: ["/api/issuances"],
    enabled: isOpen,
  });

  const itemIssuances = issuances?.filter(i => i.itemId === item.id) || [];
  const recentIssuances = itemIssuances
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCountData) => {
      const res = await apiRequest("PATCH", `/api/items/${item.id}/count`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({ title: "Item count updated successfully" });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update count",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: UpdateCountData) => {
    const newCount = data.count;
    
    // Check for discrepancy
    if (!showDiscrepancy && newCount !== expectedCount) {
      setShowDiscrepancy(true);
      return;
    }

    // If reason is required for discrepancy but not provided
    if (showDiscrepancy && !data.reason) {
      form.setError("reason", {
        type: "manual",
        message: "Please provide a reason for the count discrepancy",
      });
      return;
    }

    updateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Count: {item.name}</DialogTitle>
          <DialogDescription>
            Enter the new count after physical verification.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showDiscrepancy && (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Count Discrepancy Detected</AlertTitle>
                  <AlertDescription>
                    System expected {expectedCount} {item.name}(s), but entered count is {form.getValues().count}.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Discrepancy</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Unlogged issuance, Miscount corrected" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Activity</h4>
                  <ScrollArea className="h-[100px]">
                    {recentIssuances.map((issuance) => (
                      <div key={issuance.id} className="text-sm">
                        {new Date(issuance.issueDate).toLocaleDateString()}: {issuance.status} - {issuance.quantity} items
                        {issuance.returnedDate && ` (Returned: ${new Date(issuance.returnedDate).toLocaleDateString()})`}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </>
            )}

            <DialogFooter>
              {showDiscrepancy ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setShowDiscrepancy(false)}>
                    Verify Count
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Hard Update
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={updateMutation.isPending}>
                  Update Count
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
