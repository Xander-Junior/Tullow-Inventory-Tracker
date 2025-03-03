import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, Issuance, Audit } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function StatsCards() {
  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: issuances } = useQuery<Issuance[]>({
    queryKey: ["/api/issuances"],
  });

  const { data: audits } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
  });

  // Calculate item frequency (most issued items)
  const itemFrequency = items?.map(item => {
    const itemIssuances = issuances?.filter(i => i.itemId === item.id) || [];
    return {
      name: item.name,
      count: itemIssuances.length
    };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // Calculate average borrow duration for temporary items
  const averageBorrowDuration = items?.map(item => {
    const itemIssuances = issuances?.filter(i => 
      i.itemId === item.id && 
      i.status === "Temporary" && 
      i.returnedDate
    ) || [];

    if (itemIssuances.length === 0) return null;

    const totalDays = itemIssuances.reduce((acc, curr) => {
      const start = new Date(curr.issueDate);
      const end = new Date(curr.returnedDate!);
      return acc + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    return {
      name: item.name,
      days: Math.round(totalDays / itemIssuances.length)
    };
  }).filter(Boolean);

  // Find overdue items
  const overdueItems = issuances?.filter(issuance => 
    issuance.status === "Temporary" &&
    issuance.returnDate &&
    !issuance.returnedDate &&
    new Date(issuance.returnDate) < new Date()
  );

  // Calculate discrepancy rate from audits
  const discrepancyAudits = audits?.filter(audit => 
    audit.action === "UPDATE" && 
    audit.details.includes("Inconsistency")
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Item Frequency Card */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Most Issued Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={itemFrequency}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Borrow Duration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Average Borrow Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[180px]">
            <div className="space-y-2">
              {averageBorrowDuration?.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.days} days avg.
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Discrepancy Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Discrepancy Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {discrepancyAudits?.length || 0}
          </div>
          <p className="text-sm text-muted-foreground">
            inventory count mismatches in the last 30 days
          </p>
        </CardContent>
      </Card>

      {/* Overdue Items Card */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Overdue Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {overdueItems?.map(issuance => {
                const item = items?.find(i => i.itemId === issuance.itemId);
                const daysOverdue = Math.floor(
                  (new Date().getTime() - new Date(issuance.returnDate!).getTime()) /
                  (1000 * 60 * 60 * 24)
                );

                return (
                  <div key={issuance.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(issuance.returnDate!).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-destructive font-medium">
                      {daysOverdue} days overdue
                    </div>
                  </div>
                );
              })}
              {(!overdueItems || overdueItems.length === 0) && (
                <p className="text-sm text-muted-foreground">No overdue items</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
