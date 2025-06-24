
"use client";

import React, { useState, useMemo } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Edit2, Trash2, AlertCircle } from "lucide-react";
import type { Appliance, TemperatureLog, TemperatureRange } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useData } from '@/context/DataContext';
import { useToast } from "@/hooks/use-toast";

const NO_USER_VALUE = "__NONE__";

const temperatureLogSchema = z.object({
  temperature: z.coerce.number({ required_error: "Temperature is required", invalid_type_error: "Temperature must be a number" }),
  correctiveAction: z.string().optional(),
  loggedBy: z.string().optional(), // Stores User ID or NO_USER_VALUE
});

type TemperatureLogFormData = z.infer<typeof temperatureLogSchema>;

export default function TemperaturesPage() {
  const { 
    temperatureLogs, 
    appliances, 
    users, 
    findUserById, 
    addTemperatureLog, 
    updateTemperatureLog, 
    deleteTemperatureLog: deleteLogFromContext,
    getApplianceEffectiveTempRange
  } = useData();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);
  const [editingLog, setEditingLog] = useState<TemperatureLog | null>(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm<TemperatureLogFormData>({
    resolver: zodResolver(temperatureLogSchema),
    defaultValues: { temperature: undefined, correctiveAction: "", loggedBy: "" }, 
  });

  const currentTemperature = watch("temperature");
  
  const effectiveTempRangeForSelectedAppliance = useMemo(() => {
    if (!selectedAppliance) return null;
    return getApplianceEffectiveTempRange(selectedAppliance);
  }, [selectedAppliance, getApplianceEffectiveTempRange]);

  const isCurrentLogCompliant = useMemo(() => {
    if (!selectedAppliance || typeof currentTemperature !== 'number') return true; // Compliant if no temp or appliance
    const range = effectiveTempRangeForSelectedAppliance;
    if (range) {
      if (currentTemperature < range.min) return false;
      if (currentTemperature > range.max) return false;
    }
    return true; // Compliant if no specific range defined or if within range
  }, [currentTemperature, selectedAppliance, effectiveTempRangeForSelectedAppliance]);


  const openLogDialog = (appliance: Appliance) => {
    setSelectedAppliance(appliance);
    setEditingLog(null);
    reset({ temperature: undefined, correctiveAction: "", loggedBy: NO_USER_VALUE });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (log: TemperatureLog) => {
    const appliance = appliances.find(a => a.id === log.applianceId);
    if (!appliance) {
        toast({title: "Error", description: "Appliance not found for this log.", variant: "destructive"});
        return;
    }
    setSelectedAppliance(appliance);
    setEditingLog(log);
    reset({
      temperature: log.temperature,
      correctiveAction: log.correctiveAction || "",
      loggedBy: log.loggedBy || NO_USER_VALUE,
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<TemperatureLogFormData> = (data) => {
    if (!selectedAppliance) {
        toast({title: "Error", description: "No appliance selected.", variant: "destructive"});
        return;
    }
    
    const submittedData = {
        ...data,
        loggedBy: data.loggedBy === NO_USER_VALUE ? undefined : data.loggedBy,
    };

    if (editingLog) {
       updateTemperatureLog({ 
           ...editingLog, 
           ...submittedData, 
           temperature: Number(submittedData.temperature),
        }, selectedAppliance); // Pass selectedAppliance to determine compliance
       toast({ title: "Log Updated", className: "bg-accent text-accent-foreground" });
    } else {
        addTemperatureLog({ 
            applianceId: selectedAppliance.id,
            temperature: Number(submittedData.temperature),
            correctiveAction: submittedData.correctiveAction,
            loggedBy: submittedData.loggedBy,
        }, selectedAppliance); // Pass selectedAppliance
       toast({ title: "Log Added", className: "bg-accent text-accent-foreground" });
    }
    setIsDialogOpen(false);
    setSelectedAppliance(null);
    setEditingLog(null);
  };

  const handleDelete = (id: string) => {
    deleteLogFromContext(id);
    toast({ title: "Log Deleted", variant: "destructive" });
  };

  const getApplianceName = (applianceId: string) => appliances.find(a => a.id === applianceId)?.name || 'Unknown Appliance';
  
  const getUserNameForDisplay = (userId?: string) => {
    if (!userId || userId === NO_USER_VALUE) return 'N/A';
    const user = findUserById(userId);
    return user ? user.name : 'Unknown User';
  }
  
  const formatExpectedRange = (range: TemperatureRange | null): string => {
    if (!range) return 'N/A';
    return `${range.min}°C to ${range.max}°C`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Temperature Logging</h1>

        <Card>
          <CardHeader>
            <CardTitle>Log Temperatures by Appliance</CardTitle>
            <CardDescription>Select an appliance to record its current temperature reading.</CardDescription>
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
                <span className="text-xs text-muted-foreground">{appliance.location} ({appliance.type})</span>
              </Button>
            ))}
             {appliances.length === 0 && <p className="col-span-full text-center text-muted-foreground">No appliances configured. Please add appliances in Settings.</p>}
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
                {selectedAppliance && (
                  <span className="block text-xs mt-1">
                    Expected range: {formatExpectedRange(effectiveTempRangeForSelectedAppliance)}.
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
                    <Label htmlFor="temperatureLog">Temperature (°C)</Label>
                    <Input id="temperatureLog" type="number" step="0.1" {...field} placeholder="e.g., 4.5" />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              {!isCurrentLogCompliant && typeof currentTemperature === 'number' && (
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
                    <Label htmlFor="correctiveActionTemp">Corrective Action (if applicable)</Label>
                    <Textarea id="correctiveActionTemp" {...field} placeholder="e.g., Adjusted thermostat, notified manager" disabled={isCurrentLogCompliant && !editingLog?.correctiveAction} />
                  </div>
                )}
              />
              <Controller
                name="loggedBy"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="loggedByTemp">Logged By</Label>
                    <Select onValueChange={field.onChange} value={field.value || NO_USER_VALUE}>
                      <SelectTrigger id="loggedByTemp">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_USER_VALUE}>N/A (No Logger)</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {temperatureLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No temperature logs yet.</TableCell>
                  </TableRow>
                )}
                {temperatureLogs.map((log) => (
                  <TableRow key={log.id} className={!log.isCompliant ? "bg-destructive/10" : ""}>
                    <TableCell className="font-medium">{getApplianceName(log.applianceId)}</TableCell>
                    <TableCell>{log.temperature.toFixed(1)}</TableCell>
                    <TableCell>{format(parseISO(log.logTime), "PPpp", { locale: enUS })}</TableCell>
                    <TableCell>
                      <Badge variant={log.isCompliant ? "default" : "destructive"} className={log.isCompliant ? "bg-accent text-accent-foreground hover:bg-accent/80" : ""}>
                        {log.isCompliant ? "Compliant" : "Non-Compliant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.correctiveAction || "N/A"}</TableCell>
                    <TableCell>{getUserNameForDisplay(log.loggedBy)}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(log)}>
                        <Edit2 className="h-4 w-4" />
                         <span className="sr-only">Edit Log</span>
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)} className="text-destructive hover:text-destructive/80">
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
    
