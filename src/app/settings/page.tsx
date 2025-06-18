
"use client";

import React, { useState } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit2, Trash2, ListFilter, Building, Thermometer, SparklesIcon, Save, Users } from "lucide-react";
import { Supplier, Appliance, CleaningTask, CleaningFrequency, User, TrainingRecord } from "@/lib/types";
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format, parse, isValid } from 'date-fns';
import { useData } from '@/context/DataContext';

// Schemas for forms
const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});
type SupplierFormData = z.infer<typeof supplierSchema>;

const applianceSchema = z.object({
  name: z.string().min(1, "Appliance name is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
  minTemp: z.coerce.number().optional(),
  maxTemp: z.coerce.number().optional(),
});
type ApplianceFormData = z.infer<typeof applianceSchema>;

const cleaningTaskSchema = z.object({ // For task definitions
  name: z.string().min(1, "Task name is required"),
  area: z.string().min(1, "Area is required"),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'as_needed']),
  description: z.string().optional(),
});
type CleaningTaskFormData = z.infer<typeof cleaningTaskSchema>;

const userSchema = z.object({
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['admin', 'staff']),
  trainingRecords: z.string().optional(), // Raw string from textarea
});
type UserFormData = z.infer<typeof userSchema>;


export default function SettingsPage() {
  const { 
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    appliances, addAppliance, updateAppliance, deleteAppliance,
    cleaningTasks, addCleaningTaskDefinition, updateCleaningTaskDefinition, deleteCleaningTaskDefinition,
    users, addUser, updateUser, deleteUser
  } = useData();
  
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<"supplier" | "appliance" | "cleaningTask" | "user" | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const supplierForm = useForm<SupplierFormData>({ resolver: zodResolver(supplierSchema) });
  const applianceForm = useForm<ApplianceFormData>({ resolver: zodResolver(applianceSchema) });
  const cleaningTaskForm = useForm<CleaningTaskFormData>({ resolver: zodResolver(cleaningTaskSchema) });
  const userForm = useForm<UserFormData>({ resolver: zodResolver(userSchema) });
  
  // Parameters state (local to this component for now, could be moved to context if needed globally)
  const [fridgeMinTemp, setFridgeMinTemp] = useState<string>("0");
  const [fridgeMaxTemp, setFridgeMaxTemp] = useState<string>("5");
  const [freezerMinTemp, setFreezerMinTemp] = useState<string>("-25");
  const [freezerMaxTemp, setFreezerMaxTemp] = useState<string>("-18");
  const [hotHoldMinTemp, setHotHoldMinTemp] = useState<string>("63");
  const [hotHoldMaxTemp, setHotHoldMaxTemp] = useState<string>("75");
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [smsAlerts, setSmsAlerts] = useState<boolean>(false);

  const parseTrainingRecords = (recordsString?: string): TrainingRecord[] => {
    if (!recordsString) return [];
    return recordsString.split('\n').map(line => line.trim()).filter(line => line).map(line => {
      const parts = line.split(';').map(part => part.trim());
      const name = parts[0] || "Unnamed Record";
      const dateCompleted = parts[1] || "";
      const expiryDate = parts[2] || undefined;
      const certificateUrl = parts[3] || undefined;
      return { name, dateCompleted, expiryDate, certificateUrl };
    }).filter(record => record.name && record.dateCompleted);
  };

  const formatTrainingRecordsForTextarea = (records?: TrainingRecord[]): string => {
    if (!records) return "";
    return records.map(r => `${r.name};${r.dateCompleted};${r.expiryDate || ''};${r.certificateUrl || ''}`).join('\n');
  };

  const openDialog = (formType: "supplier" | "appliance" | "cleaningTask" | "user", itemToEdit: any | null = null) => {
    setCurrentForm(formType);
    setEditingItem(itemToEdit);
    if (formType === "supplier") supplierForm.reset(itemToEdit || {name: "", contactPerson: "", phone: "", email: ""});
    if (formType === "appliance") applianceForm.reset(itemToEdit || {name: "", location: "", type: "", minTemp: undefined, maxTemp: undefined});
    if (formType === "cleaningTask") cleaningTaskForm.reset(itemToEdit || {name: "", area: "", frequency: "daily", description: ""});
    if (formType === "user") userForm.reset(itemToEdit ? {...itemToEdit, trainingRecords: formatTrainingRecordsForTextarea(itemToEdit.trainingRecords)} : {name: "", email: "", role: "staff", trainingRecords: ""});
    setDialogOpen(true);
  };

  const handleSupplierSubmit: SubmitHandler<SupplierFormData> = (data) => {
    if (editingItem) {
      updateSupplier({ ...editingItem, ...data });
    } else {
      addSupplier(data);
    }
    setDialogOpen(false);
  };
  
  const handleApplianceSubmit: SubmitHandler<ApplianceFormData> = (data) => {
    if (editingItem) {
      updateAppliance({ ...editingItem, ...data });
    } else {
      addAppliance(data);
    }
    setDialogOpen(false);
  };

  const handleCleaningTaskSubmit: SubmitHandler<CleaningTaskFormData> = (data) => {
    if (editingItem) {
      updateCleaningTaskDefinition({ ...editingItem, ...data });
    } else {
      addCleaningTaskDefinition(data);
    }
    setDialogOpen(false);
  };

  const handleUserSubmit: SubmitHandler<UserFormData> = (data) => {
    const parsedRecords = parseTrainingRecords(data.trainingRecords);
    const userData = { ...data, trainingRecords: parsedRecords };

    if (editingItem) {
      updateUser({ ...editingItem, ...userData });
    } else {
      addUser(userData);
    }
    setDialogOpen(false);
  };

  const handleDeleteItem = (type: "supplier" | "appliance" | "cleaningTask" | "user", id: string) => {
    if (type === "supplier") deleteSupplier(id);
    if (type === "appliance") deleteAppliance(id);
    if (type === "cleaningTask") deleteCleaningTaskDefinition(id);
    if (type === "user") deleteUser(id);
  };
  
  const getFrequencyLabel = (freq: CleaningFrequency) => {
    const labels: Record<CleaningFrequency, string> = {
      daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', as_needed: 'As Needed'
    };
    return labels[freq];
  }
  
  const handleSaveParameters = () => {
    // In a real app, these would be saved to a backend or context
    console.log("Parameters saved (locally for now):", {
      fridgeMinTemp, fridgeMaxTemp,
      freezerMinTemp, freezerMaxTemp,
      hotHoldMinTemp, hotHoldMaxTemp,
      emailAlerts, smsAlerts
    });
    toast({
      title: "Parameters Saved",
      description: "System parameters have been updated (locally).",
      className: "bg-accent text-accent-foreground"
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="suppliers"><Building className="mr-2 h-4 w-4 inline-block" />Suppliers</TabsTrigger>
            <TabsTrigger value="appliances"><Thermometer className="mr-2 h-4 w-4 inline-block" />Appliances</TabsTrigger>
            <TabsTrigger value="cleaning_tasks"><SparklesIcon className="mr-2 h-4 w-4 inline-block" />Cleaning Tasks</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4 inline-block" />Users</TabsTrigger>
            <TabsTrigger value="parameters"><ListFilter className="mr-2 h-4 w-4 inline-block" />Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Suppliers</CardTitle><CardDescription>Add, edit, or remove suppliers.</CardDescription></div><Button onClick={() => openDialog("supplier")}><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact Person</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {suppliers.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell><TableCell>{s.contactPerson || 'N/A'}</TableCell>
                        <TableCell>{s.phone || 'N/A'}</TableCell><TableCell>{s.email || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("supplier", s)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteItem("supplier", s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                     {suppliers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No suppliers configured.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appliances">
            <Card>
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Appliances</CardTitle><CardDescription>Add, edit, or remove appliances used for temperature logging.</CardDescription></div><Button onClick={() => openDialog("appliance")}><PlusCircle className="mr-2 h-4 w-4" /> Add Appliance</Button></div></CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Min Temp (°C)</TableHead><TableHead>Max Temp (°C)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {appliances.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>{a.name}</TableCell><TableCell>{a.location}</TableCell><TableCell>{a.type}</TableCell>
                        <TableCell>{a.minTemp ?? 'N/A'}</TableCell><TableCell>{a.maxTemp ?? 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("appliance", a)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteItem("appliance", a.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {appliances.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">No appliances configured.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cleaning_tasks">
             <Card>
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Cleaning Task Definitions</CardTitle><CardDescription>Define tasks for the cleaning checklist. These are templates.</CardDescription></div><Button onClick={() => openDialog("cleaningTask")}><PlusCircle className="mr-2 h-4 w-4" /> Add Task Definition</Button></div></CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Area</TableHead><TableHead>Frequency</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cleaningTasks.map(t => ( // these are CleaningTask definitions
                      <TableRow key={t.id}>
                        <TableCell>{t.name}</TableCell><TableCell>{t.area}</TableCell>
                        <TableCell><Badge variant="secondary">{getFrequencyLabel(t.frequency)}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate">{t.description || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("cleaningTask", t)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteItem("cleaningTask", t.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {cleaningTasks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No cleaning task definitions configured.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Users</CardTitle><CardDescription>Add, edit, or remove users and manage their roles.</CardDescription></div><Button onClick={() => openDialog("user")}><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Training Records</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell>
                        <TableCell><Badge variant={user.role === 'admin' ? "default" : "secondary"}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge></TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild><Button variant="link" className="p-0 h-auto">{user.trainingRecords?.length || 0} record(s)</Button></PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Training Records</h4><p className="text-sm text-muted-foreground">Details of training completed by {user.name}.</p></div>
                                {user.trainingRecords && user.trainingRecords.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {user.trainingRecords.map((record, idx) => (
                                      <li key={idx}>
                                        <strong>{record.name}</strong>
                                        <br />Completed: {record.dateCompleted ? format(parse(record.dateCompleted, 'yyyy-MM-dd', new Date()), 'PP') : 'N/A'}
                                        {record.expiryDate && (<><br />Expires: {format(parse(record.expiryDate, 'yyyy-MM-dd', new Date()), 'PP')}</>)}
                                        {record.certificateUrl && (<><br /><a href={record.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Certificate</a></>)}
                                      </li>))}
                                  </ul>
                                ) : (<p className="text-sm text-muted-foreground">No training records found.</p>)}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("user", user)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteItem("user", user.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No users configured.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="parameters">
            <Card>
              <CardHeader><CardTitle>System Parameters</CardTitle><CardDescription>Configure general application settings and thresholds.</CardDescription></CardHeader>
              <CardContent className="space-y-8">
                <section><h3 className="text-lg font-semibold mb-3">Default Temperature Ranges (°C)</h3>
                  <div className="space-y-4">
                    <Card className="p-4"><CardTitle className="text-base mb-2">Fridge</CardTitle><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="fridgeMin">Min Temperature</Label><Input id="fridgeMin" type="number" value={fridgeMinTemp} onChange={(e) => setFridgeMinTemp(e.target.value)} /></div><div><Label htmlFor="fridgeMax">Max Temperature</Label><Input id="fridgeMax" type="number" value={fridgeMaxTemp} onChange={(e) => setFridgeMaxTemp(e.target.value)} /></div></div></Card>
                    <Card className="p-4"><CardTitle className="text-base mb-2">Freezer</CardTitle><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="freezerMin">Min Temperature</Label><Input id="freezerMin" type="number" value={freezerMinTemp} onChange={(e) => setFreezerMinTemp(e.target.value)} /></div><div><Label htmlFor="freezerMax">Max Temperature</Label><Input id="freezerMax" type="number" value={freezerMaxTemp} onChange={(e) => setFreezerMaxTemp(e.target.value)} /></div></div></Card>
                    <Card className="p-4"><CardTitle className="text-base mb-2">Hot Holding</CardTitle><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="hotHoldMin">Min Temperature</Label><Input id="hotHoldMin" type="number" value={hotHoldMinTemp} onChange={(e) => setHotHoldMinTemp(e.target.value)} /></div><div><Label htmlFor="hotHoldMax">Max Temperature</Label><Input id="hotHoldMax" type="number" value={hotHoldMaxTemp} onChange={(e) => setHotHoldMaxTemp(e.target.value)} /></div></div></Card>
                  </div>
                </section>
                <Separator />
                <section><h3 className="text-lg font-semibold mb-3">Alert Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg"><div><Label htmlFor="emailAlerts" className="font-medium">Email Notifications</Label><p className="text-sm text-muted-foreground">Receive alerts via email for critical issues.</p></div><Switch id="emailAlerts" checked={emailAlerts} onCheckedChange={setEmailAlerts} /></div>
                    <div className="flex items-center justify-between p-4 border rounded-lg"><div><Label htmlFor="smsAlerts" className="font-medium">SMS Notifications</Label><p className="text-sm text-muted-foreground">Receive alerts via SMS (if configured).</p></div><Switch id="smsAlerts" checked={smsAlerts} onCheckedChange={setSmsAlerts} /></div>
                  </div>
                </section>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={handleSaveParameters}><Save className="mr-2 h-4 w-4" /> Save Parameters</Button></CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingItem ? "Edit" : "Add New"} {currentForm?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</DialogTitle></DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
            {currentForm === "supplier" && (
              <form onSubmit={supplierForm.handleSubmit(handleSupplierSubmit)} className="space-y-4">
                <Controller name="name" control={supplierForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="s_name">Name</Label><Input id="s_name" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="contactPerson" control={supplierForm.control} render={({ field }) => (<div><Label htmlFor="s_contact">Contact Person</Label><Input id="s_contact" {...field} /></div>)} />
                <Controller name="phone" control={supplierForm.control} render={({ field }) => (<div><Label htmlFor="s_phone">Phone</Label><Input id="s_phone" {...field} /></div>)} />
                <Controller name="email" control={supplierForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="s_email">Email</Label><Input id="s_email" type="email" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
            )}
            {currentForm === "appliance" && (
              <form onSubmit={applianceForm.handleSubmit(handleApplianceSubmit)} className="space-y-4">
                <Controller name="name" control={applianceForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="a_name">Name</Label><Input id="a_name" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="location" control={applianceForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="a_location">Location</Label><Input id="a_location" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="type" control={applianceForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="a_type">Type</Label><Input id="a_type" {...field} placeholder="e.g. Fridge, Oven" /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <div className="grid grid-cols-2 gap-4">
                  <Controller name="minTemp" control={applianceForm.control} render={({ field }) => (<div><Label htmlFor="a_minTemp">Min Temp (°C)</Label><Input id="a_minTemp" type="number" {...field} /></div>)} />
                  <Controller name="maxTemp" control={applianceForm.control} render={({ field }) => (<div><Label htmlFor="a_maxTemp">Max Temp (°C)</Label><Input id="a_maxTemp" type="number" {...field} /></div>)} />
                </div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
            )}
            {currentForm === "cleaningTask" && ( // This form is for CleaningTask Definitions
              <form onSubmit={cleaningTaskForm.handleSubmit(handleCleaningTaskSubmit)} className="space-y-4">
                <Controller name="name" control={cleaningTaskForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="ct_name">Task Name</Label><Input id="ct_name" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="area" control={cleaningTaskForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="ct_area">Area</Label><Input id="ct_area" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="frequency" control={cleaningTaskForm.control} render={({ field, fieldState }) => (
                    <div><Label htmlFor="ct_frequency">Frequency</Label>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <SelectTrigger id="ct_frequency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem><SelectItem value="as_needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>)} />
                <Controller name="description" control={cleaningTaskForm.control} render={({ field }) => (<div><Label htmlFor="ct_desc">Description</Label><Textarea id="ct_desc" {...field} /></div>)} />
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save Task Definition</Button></DialogFooter>
              </form>
            )}
            {currentForm === "user" && (
              <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                <Controller name="name" control={userForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="u_name">Name</Label><Input id="u_name" {...field} />{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="email" control={userForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="u_email">Email</Label><Input id="u_email" type="email" {...field} />{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="role" control={userForm.control} render={({ field, fieldState }) => (
                  <div><Label htmlFor="u_role">Role</Label>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger id="u_role"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>)} />
                <Controller name="trainingRecords" control={userForm.control} render={({ field }) => (
                  <div><Label htmlFor="u_training">Training Records</Label>
                    <Textarea id="u_training" {...field} rows={4} placeholder="Enter one record per line: Name;DateCompleted (YYYY-MM-DD);ExpiryDate (YYYY-MM-DD);CertificateURL" />
                    <p className="text-xs text-muted-foreground mt-1">Format: Name;YYYY-MM-DD;YYYY-MM-DD (optional);URL (optional)</p>
                  </div>)} />
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save User</Button></DialogFooter>
              </form>
            )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
