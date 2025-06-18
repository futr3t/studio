"use client";

import React, { useState } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Edit2, Trash2, AlertCircle } from "lucide-react";
import { Appliance, TemperatureLog } from "@/lib/types";
import { mockAppliances, mockTemperatureLogs } from "@/lib/data";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const temperatureLogSchema = z.object({
  temperature: z.coerce.number({ invalid_type_error: "Temperature is required" }),
  correctiveAction: z.string().optional(),
  loggedBy: z.string().optional(),
});

type TemperatureLogFormData = z.infer<typeof temperatureLogSchema>;

export default function TemperaturesPage() {
  const [logs, setLogs] = useState<TemperatureLog[]>(mockTemperatureLogs);
  const [appliances] = useState<Appliance[]>(mockAppliances);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);
  const [editingLog, setEditingLog] = useState<TemperatureLog | null>(null); // Not used for new logs via grid, but could be for editing existing logs

  const { control, handleSubmit, reset, watch, setValue } = useForm<TemperatureLogFormData>({
    resolver: zodResolver(temperatureLogSchema),
    defaultValues: { temperature: undefined, correctiveAction: "", loggedBy: "" },
  });

  const currentTemperature = watch("temperature");
  const isCompliant = React.useMemo(() => {
    if (selectedAppliance && typeof currentTemperature === 'number') {
      const { minTemp, maxTemp } = selectedAppliance;
      if (typeof minTemp === 'number' && currentTemperature < minTemp) return false;
      if (typeof maxTemp === 'number' && currentTemperature > maxTemp) return false;
    }
    return true;
  }, [currentTemperature, selectedAppliance]);

  const openLogDialog = (appliance: Appliance) => {
    setSelectedAppliance(appliance);
    setEditingLog(null); // Ensure it's a new log
    reset({ temperature: undefined, correctiveAction: "", loggedBy: "" });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (log: TemperatureLog) => {
    const appliance = appliances.find(a => a.id === log.applianceId);
    if (!appliance) return; // Should not happen with mock data
    
    setSelectedAppliance(appliance);
    setEditingLog(log);
    reset({
      temperature: log.temperature,
      correctiveAction: log.correctiveAction || "",
      loggedBy: log.loggedBy || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<TemperatureLogFormData> = (data) => {
    if (!selectedAppliance) return;

    if (editingLog) {
       setLogs(logs.map(l => l.id === editingLog.id ? { 
           ...editingLog, 
           ...data, 
           temperature: Number(data.temperature),
           isCompliant,
           logTime: new Date().toISOString() 
        } : l));
    } else {
        const newLog: TemperatureLog = {
        id: `temp${logs.length + 1}`,
        applianceId: selectedAppliance.id,
        temperature: Number(data.temperature),
        logTime: new Date().toISOString(),
        isCompliant,
        correctiveAction: data.correctiveAction,
        loggedBy: data.loggedBy,
        };
        setLogs([newLog, ...logs]);
    }
    setIsDialogOpen(false);
    setSelectedAppliance(null);
    setEditingLog(null);
  };

  const deleteLog = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  const getApplianceName = (applianceId: string) => appliances.find(a => a.id === applianceId)?.name || 'Unknown Appliance';

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Temperature Logging</h1>

        <Card>
          <CardHeader>
            <CardTitle>Log Temperatures by Appliance</CardTitle>
            <CardDescription>Click on an appliance to log its current temperature.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {appliances.map((appliance) => (
              <Button
                key={appliance.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center text-center p-2 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => openLogDialog(appliance)}
              >
                <Thermometer className="h-6 w-6 mb-1 text-primary" />
                <span className="text-sm font-medium">{appliance.name}</span>
                <span className="text-xs text-muted-foreground">{appliance.location}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
                setSelectedAppliance(null);
                setEditingLog(null);
            }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLog ? "Edit" : "Log"} Temperature for {selectedAppliance?.name}
              </DialogTitle>
              <DialogDescription>
                Enter the current temperature and any corrective actions if necessary.
                {selectedAppliance && (typeof selectedAppliance.minTemp === 'number' || typeof selectedAppliance.maxTemp === 'number') && (
                  <span className="block text-xs mt-1">
                    Expected range: {selectedAppliance.minTemp ?? "any"}°C to {selectedAppliance.maxTemp ?? "any"}°C.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <Controller
                name="temperature"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input id="temperature" type="number" step="0.1" {...field} placeholder="e.g., 4.5" />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              {!isCompliant && typeof currentTemperature === 'number' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>Temperature is outside the expected range for {selectedAppliance?.name}. Please specify corrective action.</span>
                </div>
              )}
              <Controller
                name="correctiveAction"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="correctiveAction">Corrective Action (if applicable)</Label>
                    <Textarea id="correctiveAction" {...field} placeholder="e.g., Adjusted thermostat, notified manager" />
                  </div>
                )}
              />
              <Controller
                name="loggedBy"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="loggedBy">Logged By</Label>
                    <Input id="loggedBy" {...field} placeholder="e.g., John Doe" />
                  </div>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingLog ? "Save Changes" : "Log Temperature"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Recent Temperature Logs</CardTitle>
            <CardDescription>History of recorded temperatures.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appliance</TableHead>
                  <TableHead>Temperature (°C)</TableHead>
                  <TableHead>Log Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Corrective Action</TableHead>
                  <TableHead>Logged By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No temperature logs yet.</TableCell>
                  </TableRow>
                )}
                {logs.map((log) => (
                  <TableRow key={log.id} className={!log.isCompliant ? "bg-destructive/10" : ""}>
                    <TableCell className="font-medium">{getApplianceName(log.applianceId)}</TableCell>
                    <TableCell>{log.temperature.toFixed(1)}</TableCell>
                    <TableCell>{format(new Date(log.logTime), "PPpp")}</TableCell>
                    <TableCell>
                      <Badge variant={log.isCompliant ? "default" : "destructive"} className={log.isCompliant ? "bg-accent text-accent-foreground hover:bg-accent/80" : ""}>
                        {log.isCompliant ? "Compliant" : "Non-Compliant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.correctiveAction || "N/A"}</TableCell>
                    <TableCell>{log.loggedBy || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(log)}>
                        <Edit2 className="h-4 w-4" />
                         <span className="sr-only">Edit Log</span>
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-destructive hover:text-destructive/80">
                         <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete Log</span>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
