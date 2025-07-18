
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit2, Trash2, ListFilter, Building, Thermometer, SparklesIcon, Save, Users, Loader2 } from "lucide-react";
import type { Supplier, Appliance, CleaningTask, CleaningFrequency, User, TrainingRecord, SystemParameters } from "@/lib/types";
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
import { enUS } from 'date-fns/locale';
import { useData } from '@/context/DataContext';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { useAuth } from '@/context/AuthContext';
import { safeLength, safeMap, safeFilter, ensureArray, safeExtractUsername } from '@/lib/array-utils';

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
  type: z.string().min(1, "Type is required"), // e.g., Fridge, Freezer, Oven, Hot Hold
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
  username: z.string().min(2, "Username must be at least 2 characters"),
  role: z.enum(['admin', 'staff']),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type UserFormData = z.infer<typeof userSchema>;

// Schema for system parameters form
const systemParametersSchema = z.object({
  fridgeMinTemp: z.coerce.number(),
  fridgeMaxTemp: z.coerce.number(),
  freezerMinTemp: z.coerce.number(),
  freezerMaxTemp: z.coerce.number(),
  hotHoldMinTemp: z.coerce.number(),
  hotHoldMaxTemp: z.coerce.number(),
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
});
type SystemParametersFormData = z.infer<typeof systemParametersSchema>;


export default function SettingsPage() {
  const { 
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    appliances, addAppliance, updateAppliance, deleteAppliance,
    cleaningTasks, addCleaningTaskDefinition, updateCleaningTaskDefinition, deleteCleaningTaskDefinition,
    users, addUser, updateUser, deleteUser,
    systemParameters, updateSystemParameters: updateSystemParametersInContext,
  } = useData();
  
  const { user: currentAuthUser, createUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<"supplier" | "appliance" | "cleaningTask" | "user" | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supplierForm = useForm<SupplierFormData>({ resolver: zodResolver(supplierSchema) });
  const applianceForm = useForm<ApplianceFormData>({ resolver: zodResolver(applianceSchema) });
  const cleaningTaskForm = useForm<CleaningTaskFormData>({ resolver: zodResolver(cleaningTaskSchema) });
  const userForm = useForm<UserFormData>({ resolver: zodResolver(userSchema) });

  const systemParamsForm = useForm<SystemParametersFormData>({
    resolver: zodResolver(systemParametersSchema),
  });

  useEffect(() => {
    if (currentAuthUser) {
      const userRole = currentAuthUser.user_metadata?.role;
      if (userRole !== 'admin') {
        toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
        router.push('/');
      } else {
        systemParamsForm.reset({
          fridgeMinTemp: systemParameters.temperatureRanges.fridge.min,
          fridgeMaxTemp: systemParameters.temperatureRanges.fridge.max,
          freezerMinTemp: systemParameters.temperatureRanges.freezer.min,
          freezerMaxTemp: systemParameters.temperatureRanges.freezer.max,
          hotHoldMinTemp: systemParameters.temperatureRanges.hotHold.min,
          hotHoldMaxTemp: systemParameters.temperatureRanges.hotHold.max,
          emailAlerts: systemParameters.notifications.emailAlerts,
          smsAlerts: systemParameters.notifications.smsAlerts,
        });
        setIsLoading(false);
      }
    }
    // If currentAuthUser is null, it's still loading in AuthContext, so wait.
  }, [currentAuthUser, router, systemParameters, systemParamsForm, toast]);



  const openDialog = (formType: "supplier" | "appliance" | "cleaningTask" | "user", itemToEdit: any | null = null) => {
    setCurrentForm(formType);
    setEditingItem(itemToEdit);
    if (formType === "supplier") supplierForm.reset(itemToEdit || {name: "", contactPerson: "", phone: "", email: ""});
    if (formType === "appliance") applianceForm.reset(itemToEdit || {name: "", location: "", type: "", minTemp: undefined, maxTemp: undefined});
    if (formType === "cleaningTask") cleaningTaskForm.reset(itemToEdit || {name: "", area: "", frequency: "daily", description: ""});
    if (formType === "user") userForm.reset(itemToEdit ? {...itemToEdit, password: ""} : {name: "", username: "", role: "staff", password: ""});
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

  const handleUserSubmit: SubmitHandler<UserFormData> = async (data) => {
    if (editingItem) {
      // For editing existing users, use the old system
      updateUser({ ...editingItem, ...data });
      setDialogOpen(false);
    } else {
      // For creating new users, use Supabase auth
      const result = await createUser(data.username, data.password, {
        name: data.name,
        role: data.role,
      });
      
      if (!result.error) {
        // Also add to local data context for immediate UI update
        addUser({ 
          name: data.name, 
          email: `${data.username}@chefcheck.local`, // Convert username to email format for display
          role: data.role,
          trainingRecords: []
        });
        setDialogOpen(false);
      }
    }
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
  
  const handleSaveParameters: SubmitHandler<SystemParametersFormData> = (data) => {
    const newSystemParams: SystemParameters = {
      temperatureRanges: {
        fridge: { min: data.fridgeMinTemp, max: data.fridgeMaxTemp },
        freezer: { min: data.freezerMinTemp, max: data.freezerMaxTemp },
        hotHold: { min: data.hotHoldMinTemp, max: data.hotHoldMaxTemp },
      },
      notifications: {
        emailAlerts: data.emailAlerts,
        smsAlerts: data.smsAlerts,
      },
    };
    updateSystemParametersInContext(newSystemParams);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  const userRole = currentAuthUser?.user_metadata?.role;
  if (userRole !== 'admin') {
     // This case should ideally be handled by the redirect, but as a fallback:
    return (
       <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <p>Access Denied. Redirecting...</p>
        </main>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="flex flex-col min-h-screen">
        <MainNav />
      <main className="flex-1 p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="suppliers" className="flex-col md:flex-row h-auto py-2">
              <Building className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
              <span className="text-xs md:text-sm">Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="appliances" className="flex-col md:flex-row h-auto py-2">
              <Thermometer className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
              <span className="text-xs md:text-sm">Appliances</span>
            </TabsTrigger>
            <TabsTrigger value="cleaning_tasks" className="flex-col md:flex-row h-auto py-2">
              <SparklesIcon className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
              <span className="text-xs md:text-sm">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-col md:flex-row h-auto py-2">
              <Users className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
              <span className="text-xs md:text-sm">Users</span>
            </TabsTrigger>
            <TabsTrigger value="parameters" className="flex-col md:flex-row h-auto py-2">
              <ListFilter className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
              <span className="text-xs md:text-sm">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Suppliers</CardTitle><CardDescription>Add, edit, or remove suppliers.</CardDescription></div><Button onClick={() => openDialog("supplier")}><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact Person</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {safeMap(suppliers, s => (
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
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Appliances</CardTitle><CardDescription>Manage appliances for temperature monitoring.</CardDescription></div><Button onClick={() => openDialog("appliance")}><PlusCircle className="mr-2 h-4 w-4" /> Add Appliance</Button></div></CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Min Temp (°C)</TableHead><TableHead>Max Temp (°C)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {safeMap(appliances, a => (
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
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Manage Cleaning Task Definitions</CardTitle><CardDescription>Create and manage cleaning task templates.</CardDescription></div><Button onClick={() => openDialog("cleaningTask")}><PlusCircle className="mr-2 h-4 w-4" /> Add Task Definition</Button></div></CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Area</TableHead><TableHead>Frequency</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {safeMap(cleaningTasks, t => ( 
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
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Training Records</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {safeMap(users, user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell><TableCell>{safeExtractUsername(user.email) || user.email || 'N/A'}</TableCell>
                        <TableCell><Badge variant={user.role === 'admin' ? "default" : "secondary"}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge></TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild><Button variant="link" className="p-0 h-auto">{user.trainingRecords?.length || 0} record(s)</Button></PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Training Records</h4><p className="text-sm text-muted-foreground">Details of training completed by {user.name}.</p></div>
                                {user.trainingRecords && user.trainingRecords.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {safeMap(user.trainingRecords, (record, idx) => (
                                      <li key={idx}>
                                        <strong>{record.name}</strong>
                                        <br />Completed: {record.dateCompleted && isValid(parse(record.dateCompleted, 'yyyy-MM-dd', new Date())) ? format(parse(record.dateCompleted, 'yyyy-MM-dd', new Date()), 'PP', { locale: enUS }) : 'N/A'}
                                        {record.expiryDate && isValid(parse(record.expiryDate, 'yyyy-MM-dd', new Date())) && (<><br />Expires: {format(parse(record.expiryDate, 'yyyy-MM-dd', new Date()), 'PP', { locale: enUS })}</>)}
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
              <form onSubmit={systemParamsForm.handleSubmit(handleSaveParameters)}>
                <CardHeader><CardTitle>System Parameters</CardTitle><CardDescription>Configure general application settings and thresholds.</CardDescription></CardHeader>
                <CardContent className="space-y-8">
                  <section><h3 className="text-lg font-semibold mb-3">Default Temperature Ranges (°C)</h3>
                    <div className="space-y-4">
                      <Card className="p-4"><CardTitle className="text-base mb-2">Fridge</CardTitle>
                        <div className="grid grid-cols-2 gap-4">
                          <Controller name="fridgeMinTemp" control={systemParamsForm.control} render={({ field }) => (<div><Label htmlFor="fridgeMin">Min Temperature</Label><Input id="fridgeMin" type="number" {...field} /></div>)} />
                          <Controller name="fridgeMaxTemp" control={systemParamsForm.control} render={({ field }) => (<div><Label htmlFor="fridgeMax">Max Temperature</Label><Input id="fridgeMax" type="number" {...field} /></div>)} />
                        </div>
                      </Card>
                      <Card className="p-4"><CardTitle className="text-base mb-2">Freezer</CardTitle>
                        <div className="grid grid-cols-2 gap-4">
                          <Controller name="freezerMinTemp" control={systemParamsForm.control} render={({ field }) => (<div><Label htmlFor="freezerMin">Min Temperature</Label><Input id="freezerMin" type="number" {...field} /></div>)} />
                          <Controller name="freezerMaxTemp" control={systemParamsForm.control} render={({ field }) => (<div><Label htmlFor="freezerMax">Max Temperature</Label><Input id="freezerMax" type="number" {...field} /></div>)} />
                        </div>
                      </Card>
                      <Card className="p-4"><CardTitle className="text-base mb-2">Hot Holding</CardTitle>
                        <div className="grid grid-cols-2 gap-4">
                          <Controller name="hotHoldMinTemp" control={systemParamsForm.control} render={({ field }) => (<div><Label htmlFor="hotHoldMin">Min Temperature</Label><Input id="hotHoldMin" type="number" {...field} /></div>)} />
                          <Controller name="hotHoldMaxTemp" control={systemParamsForm.control} render={({ field }) => (<div><Label htmlFor="hotHoldMax">Max Temperature</Label><Input id="hotHoldMax" type="number" {...field} /></div>)} />
                        </div>
                      </Card>
                    </div>
                  </section>
                  <Separator />
                  <section><h3 className="text-lg font-semibold mb-3">Alert Notification Settings</h3>
                    <div className="space-y-4">
                      <Controller name="emailAlerts" control={systemParamsForm.control} render={({ field }) => (
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div><Label htmlFor="emailAlertsSwitch" className="font-medium">Email Notifications</Label><p className="text-sm text-muted-foreground">Receive alerts via email for critical issues.</p></div><Switch id="emailAlertsSwitch" checked={field.value} onCheckedChange={field.onChange} /></div>
                      )} />
                       <Controller name="smsAlerts" control={systemParamsForm.control} render={({ field }) => (
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div><Label htmlFor="smsAlertsSwitch" className="font-medium">SMS Notifications</Label><p className="text-sm text-muted-foreground">Receive alerts via SMS (if configured).</p></div><Switch id="smsAlertsSwitch" checked={field.value} onCheckedChange={field.onChange} /></div>
                      )} />
                    </div>
                  </section>
                </CardContent>
                <CardFooter className="border-t pt-6"><Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Parameters</Button></CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingItem ? "Edit" : "Add New"} {(currentForm || '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</DialogTitle></DialogHeader>
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
                <Controller name="type" control={applianceForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="a_type">Type</Label><Input id="a_type" {...field} placeholder="e.g. Fridge, Freezer, Oven, Hot Hold" /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <div className="grid grid-cols-2 gap-4">
                  <Controller name="minTemp" control={applianceForm.control} render={({ field }) => (<div><Label htmlFor="a_minTemp">Min Temp (°C)</Label><Input id="a_minTemp" type="number" {...field} /></div>)} />
                  <Controller name="maxTemp" control={applianceForm.control} render={({ field }) => (<div><Label htmlFor="a_maxTemp">Max Temp (°C)</Label><Input id="a_maxTemp" type="number" {...field} /></div>)} />
                </div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
            )}
            {currentForm === "cleaningTask" && ( 
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
                <Controller name="username" control={userForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="u_username">Username</Label><Input id="u_username" type="text" {...field} placeholder="e.g. john, mary, chef1" />{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="role" control={userForm.control} render={({ field, fieldState }) => (
                  <div><Label htmlFor="u_role">Role</Label>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger id="u_role"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>)} />
                {!editingItem && (
                  <Controller name="password" control={userForm.control} render={({ field, fieldState }) => (
                    <div><Label htmlFor="u_password">Password</Label>
                      <Input id="u_password" type="password" {...field} placeholder="Enter temporary password" />
                      {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">User can change this after first login</p>
                    </div>)} />
                )}
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">{editingItem ? "Update User" : "Create User"}</Button></DialogFooter>
              </form>
            )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
    </AuthWrapper>
  );
}
