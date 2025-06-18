"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CheckCircle2, AlertTriangle, ListChecks, ClipboardList, Thermometer, Sparkles } from "lucide-react";
import { MainNav } from "@/components/layout/main-nav";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart } from "recharts"
import type { ChartConfig } from "@/components/ui/chart";

const chartData = [
  { month: "January", compliant: 186, nonCompliant: 30 },
  { month: "February", compliant: 305, nonCompliant: 20 },
  { month: "March", compliant: 237, nonCompliant: 15 },
  { month: "April", compliant: 273, nonCompliant: 40 },
  { month: "May", compliant: 209, nonCompliant: 25 },
  { month: "June", compliant: 214, nonCompliant: 10 },
]

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
  // Placeholder data
  const complianceRate = 88;
  const pendingTasks = 3;
  const recentAlerts = 1;

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {complianceRate > 90 ? "+2% from last month" : "-1% from last month"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Cleaning Tasks</CardTitle>
              <ListChecks className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                Due this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trend</CardTitle>
              <CardDescription>Monthly compliance vs. non-compliance logs</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RechartsBarChart accessibilityLayer data={chartData}>
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
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-card-foreground/5 rounded-md">
                <Thermometer className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Temperature Logged: Fridge A (-18°C)</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago by John Doe</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
              </div>
              <div className="flex items-center space-x-3 p-3 bg-card-foreground/5 rounded-md">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Production Log: Beef Stew (Batch #102)</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago by Jane Smith</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500 ml-auto" />
              </div>
              <div className="flex items-center space-x-3 p-3 bg-card-foreground/5 rounded-md">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Cleaning Task Completed: Sanitize Surfaces</p>
                  <p className="text-xs text-muted-foreground">1 hour ago by Mike Johnson</p>
                </div>
                 <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
