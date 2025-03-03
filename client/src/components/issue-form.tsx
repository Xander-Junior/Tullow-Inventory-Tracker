import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertIssuanceSchema, Item, User, Issuance } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function IssueForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [selectedIssuance, setSelectedIssuance] = useState<Issuance | null>(null);

  const form = useForm({
    resolver: zodResolver(insertIssuanceSchema),
    defaultValues: {
      issueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      status: "Permanent",
      recipientDepartment: "",
      quantity: 1,
    },
  });

  const watchStatus = form.watch("status");

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: issuances } = useQuery<Issuance[]>({
    queryKey: ["/api/issuances"],
  });

  // Filter out already returned items
  const activeIssuances = issuances?.filter(i => !i.returnedDate) || [];

  const issueMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/issuances", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/issuances"] });
      toast({ title: "Item issued successfully" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to issue item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (issuanceId: number) => {
      const res = await apiRequest("POST", `/api/issuances/${issuanceId}/return`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/issuances"] });
      toast({ title: "Item returned successfully" });
      setShowReturnConfirm(false);
      setSelectedIssuance(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to return item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getItemName = (itemId: number) => {
    return items?.find(item => item.id === itemId)?.name || "Unknown Item";
  };

  const getUserName = (userId: number) => {
    return users?.find(user => user.id === userId)?.username || "Unknown User";
  };

  return (
    <Tabs defaultValue="issue" className="space-y-6">
      <TabsList>
        <TabsTrigger value="issue">Issue Equipment</TabsTrigger>
        <TabsTrigger value="return">Return Equipment</TabsTrigger>
      </TabsList>

      <TabsContent value="issue">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => issueMutation.mutate(data))} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.count} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorizedById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorized By</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select authorizer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Permanent">Permanent</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchStatus === "Temporary" && (
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Return Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="recipientDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={issueMutation.isPending}>
              Issue Item
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="return">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Issuances</h3>
          {activeIssuances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active issuances to return</p>
          ) : (
            <div className="space-y-4">
              {activeIssuances.map(issuance => (
                <div
                  key={issuance.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{getItemName(issuance.itemId)}</h4>
                    <p className="text-sm text-muted-foreground">
                      Issued to: {issuance.recipientDepartment} ({format(new Date(issuance.issueDate), "PPP")})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {issuance.quantity}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedIssuance(issuance);
                      setShowReturnConfirm(true);
                    }}
                  >
                    Return
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <AlertDialog open={showReturnConfirm} onOpenChange={setShowReturnConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to return {selectedIssuance && getItemName(selectedIssuance.itemId)}?
              This will update the inventory count and mark the issuance as returned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedIssuance && returnMutation.mutate(selectedIssuance.id)}
              disabled={returnMutation.isPending}
            >
              Return Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}