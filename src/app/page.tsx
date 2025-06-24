
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, ListChecks, Thermometer as ThermometerIcon, Sparkles, Truck, Factory } from "lucide-react";
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
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceData.rate}%</div>
            </CardContent>
          </Card>

          <Link href="/cleaning" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full hover:cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Cleaning Tasks</CardTitle>
                <ListChecks className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCleaningTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Due based on schedule
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full hover:cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAlertsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Non-compliant logs
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trend</CardTitle>
              <CardDescription>Monthly compliance vs. non-compliance logs</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
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
                  <div key={activity.id} className={cn("flex items-center space-x-3 p-3 rounded-md", activity.isNonCompliant ? "bg-destructive/10" : "bg-card-foreground/5")}>
                    <ItemIcon className={cn("h-5 w-5", 
                      activity.logType === 'temperature' ? "text-blue-500" :
                      activity.logType === 'production' ? "text-orange-500" : 
                      activity.logType === 'cleaning' ? "text-purple-500" :
                      activity.logType === 'delivery' ? "text-indigo-500" : "text-gray-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(activity.timestamp), "PPpp", { locale: enUS })}
                        {activity.user && ` by ${activity.user}`}
                      </p>
                    </div>
                    <StatusIcon className={cn("h-5 w-5 ml-auto", activity.isNonCompliant ? "text-red-500" : "text-green-500")} />
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
