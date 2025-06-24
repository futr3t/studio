
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, ListChecks, Thermometer as ThermometerIcon, Sparkles, Truck, Factory, LayoutDashboard } from "lucide-react";
import { MainNav } from "@/components/layout/main-nav";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, BarChart as RechartsBarChart } from "recharts"
import type { ChartConfig } from "@/components/ui/chart";
import { useData } from "@/context/DataContext";
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const chartConfig = {
  compliant: {
    label: "Compliant",
    color: "hsl(var(--accent))",
  },
  nonCompliant: {
    label: "Non-Compliant",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig


export default function DashboardPage() {
  const { 
    productionLogs, 
    temperatureLogs, 
    deliveryLogs, 
    cleaningChecklistItems, 
    getRecentActivities 
  } = useData();

  const recentActivities = useMemo(() => getRecentActivities(5), [getRecentActivities]);

  const complianceData = useMemo(() => {
    const allLogs = [
      ...productionLogs.map(l => ({ ...l, type: 'Production', time: l.logTime })),
      ...temperatureLogs.map(l => ({ ...l, type: 'Temperature', time: l.logTime })),
      ...deliveryLogs.map(l => ({ ...l, type: 'Delivery', time: l.deliveryTime })),
    ];
    
    const compliantCount = allLogs.filter(l => l.isCompliant).length;
    const totalCount = allLogs.length;
    const complianceRate = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 100;

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthlyData: { month: string, compliant: number, nonCompliant: number }[] = months.map(m => ({ month: m, compliant: 0, nonCompliant: 0 }));

    allLogs.forEach(log => {
      const monthIndex = parseISO(log.time).getMonth(); // Use the common 'time' field
      if (log.isCompliant) {
        monthlyData[monthIndex].compliant++;
      } else {
        monthlyData[monthIndex].nonCompliant++;
      }
    });
    
    const currentMonth = new Date().getMonth();
    const displayMonths = monthlyData.slice(Math.max(0, currentMonth - 5), currentMonth + 1);


    return {
      rate: complianceRate,
      chartData: displayMonths.length > 1 ? displayMonths : monthlyData.slice(0,6) 
    };
  }, [productionLogs, temperatureLogs, deliveryLogs]);

  const pendingCleaningTasks = useMemo(() => {
    return cleaningChecklistItems.filter(item => !item.completed).length;
  }, [cleaningChecklistItems]);

  const activeAlertsCount = useMemo(() => {
    return [
      ...productionLogs.filter(l => !l.isCompliant),
      ...temperatureLogs.filter(l => !l.isCompliant),
      ...deliveryLogs.filter(l => !l.isCompliant)
    ].length;
  }, [productionLogs, temperatureLogs, deliveryLogs]);


  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-4 md:p-8 space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-xl">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Dashboard</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-enhanced metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{complianceData.rate}%</div>
              <p className="text-xs text-muted-foreground mt-1">System-wide compliance rate</p>
            </CardContent>
          </Card>

          <Link href="/cleaning" className="block rounded-xl">
            <Card className="h-full card-enhanced card-interactive metric-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Cleaning Tasks</CardTitle>
                <div className="p-2 bg-blue-100 rounded-full">
                  <ListChecks className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{pendingCleaningTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Due based on schedule
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports" className="block rounded-xl">
            <Card className="h-full card-enhanced card-interactive metric-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{activeAlertsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Non-compliant logs
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="card-enhanced">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Compliance Trend</CardTitle>
              <CardDescription>Monthly compliance vs. non-compliance logs</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full min-w-0">
                <RechartsBarChart accessibilityLayer data={complianceData.chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="compliant" fill="var(--color-compliant)" radius={4} />
                  <Bar dataKey="nonCompliant" fill="var(--color-nonCompliant)" radius={4} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="card-enhanced">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest logs and system events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
              {recentActivities.map((activity) => {
                const ItemIcon = activity.itemIcon; 
                const StatusIcon = activity.statusIcon; 
                return (
                  <div key={activity.id} className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200",
                    activity.isNonCompliant 
                      ? "bg-red-50/50 border-red-100 hover:bg-red-50" 
                      : "bg-white/50 border-gray-100 hover:bg-white/80"
                  )}>
                    <div className={cn("p-2 rounded-full", 
                      activity.logType === 'temperature' ? "bg-blue-100" :
                      activity.logType === 'production' ? "bg-orange-100" : 
                      activity.logType === 'cleaning' ? "bg-purple-100" :
                      activity.logType === 'delivery' ? "bg-indigo-100" : "bg-gray-100"
                    )}>
                      <ItemIcon className={cn("h-4 w-4", 
                        activity.logType === 'temperature' ? "text-blue-600" :
                        activity.logType === 'production' ? "text-orange-600" : 
                        activity.logType === 'cleaning' ? "text-purple-600" :
                        activity.logType === 'delivery' ? "text-indigo-600" : "text-gray-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(activity.timestamp), "PPpp", { locale: enUS })}
                        {activity.user && ` by ${activity.user}`}
                      </p>
                    </div>
                    <div className={cn("p-1.5 rounded-full", activity.isNonCompliant ? "bg-red-100" : "bg-emerald-100")}>
                      <StatusIcon className={cn("h-3 w-3", activity.isNonCompliant ? "text-red-600" : "text-emerald-600")} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
