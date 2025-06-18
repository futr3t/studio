"use client";

import React, { useState } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit2, Trash2, ListFilter, Building, Thermometer, SparklesIcon } from "lucide-react";
import { Supplier, Appliance, CleaningTask, CleaningFrequency } from "@/lib/types";
import { mockSuppliers, mockAppliances, mockCleaningTasks } from "@/lib/data";
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

const cleaningTaskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  area: z.string().min(1, "Area is required"),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'as_needed']),
  description: z.string().optional(),
});
type CleaningTaskFormData = z.infer<typeof cleaningTaskSchema>;

export default function SettingsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [appliances, setAppliances] = useState<Appliance[]>(mockAppliances);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>(mockCleaningTasks);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<"supplier" | "appliance" | "cleaningTask" | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const supplierForm = useForm<SupplierFormData>({ resolver: zodResolver(supplierSchema) });
  const applianceForm = useForm<ApplianceFormData>({ resolver: zodResolver(applianceSchema) });
  const cleaningTaskForm = useForm<CleaningTaskFormData>({ resolver: zodResolver(cleaningTaskSchema) });

  const openDialog = (formType: "supplier" | "appliance" | "cleaningTask", itemToEdit: any | null = null) => {
    setCurrentForm(formType);
    setEditingItem(itemToEdit);
    if (formType === "supplier") supplierForm.reset(itemToEdit || {name: "", contactPerson: "", phone: "", email: ""});
    if (formType === "appliance") applianceForm.reset(itemToEdit || {name: "", location: "", type: "", minTemp: undefined, maxTemp: undefined});
    if (formType === "cleaningTask") cleaningTaskForm.reset(itemToEdit || {name: "", area: "", frequency: "daily", description: ""});
    setDialogOpen(true);
  };

  const handleSupplierSubmit: SubmitHandler<SupplierFormData> = (data) => {
    if (editingItem) {
      setSuppliers(suppliers.map(s => s.id === editingItem.id ? { ...s, ...data } : s));
    } else {
      setSuppliers([...suppliers, { id: `sup${suppliers.length + 1}`, ...data }]);
    }
    setDialogOpen(false);
  };
  
  const handleApplianceSubmit: SubmitHandler<ApplianceFormData> = (data) => {
    if (editingItem) {
      setAppliances(appliances.map(a => a.id === editingItem.id ? { ...a, ...data } : a));
    } else {
      setAppliances([...appliances, { id: `app${appliances.length + 1}`, ...data }]);
    }
    setDialogOpen(false);
  };

  const handleCleaningTaskSubmit: SubmitHandler<CleaningTaskFormData> = (data) => {
    if (editingItem) {
      setCleaningTasks(cleaningTasks.map(t => t.id === editingItem.id ? { ...t, ...data } : t));
    } else {
      setCleaningTasks([...cleaningTasks, { id: `ct${cleaningTasks.length + 1}`, ...data }]);
    }
    setDialogOpen(false);
  };

  const deleteItem = (type: "supplier" | "appliance" | "cleaningTask", id: string) => {
    if (type === "supplier") setSuppliers(suppliers.filter(s => s.id !== id));
    if (type === "appliance") setAppliances(appliances.filter(a => a.id !== id));
    if (type === "cleaningTask") setCleaningTasks(cleaningTasks.filter(t => t.id !== id));
  };
  
  const getFrequencyLabel = (freq: CleaningFrequency) => {
    const labels: Record<CleaningFrequency, string> = {
      daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', as_needed: 'As Needed'
    };
    return labels[freq];
  }


  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="suppliers"><Building className="mr-2 h-4 w-4 inline-block" />Suppliers</TabsTrigger>
            <TabsTrigger value="appliances"><Thermometer className="mr-2 h-4 w-4 inline-block" />Appliances</TabsTrigger>
            <TabsTrigger value="cleaning_tasks"><SparklesIcon className="mr-2 h-4 w-4 inline-block" />Cleaning Tasks</TabsTrigger>
            <TabsTrigger value="parameters"><ListFilter className="mr-2 h-4 w-4 inline-block" />Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manage Suppliers</CardTitle>
                    <CardDescription>Add, edit, or remove suppliers.</CardDescription>
                  </div>
                  <Button onClick={() => openDialog("supplier")}><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button>
                </div>
              </CardHeader>
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
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => deleteItem("supplier", s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appliances">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                  <CardTitle>Manage Appliances</CardTitle>
                  <CardDescription>Add, edit, or remove appliances used for temperature logging.</CardDescription>
                  </div>
                  <Button onClick={() => openDialog("appliance")}><PlusCircle className="mr-2 h-4 w-4" /> Add Appliance</Button>
                </div>
              </CardHeader>
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
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => deleteItem("appliance", a.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cleaning_tasks">
             <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manage Cleaning Tasks</CardTitle>
                    <CardDescription>Define tasks for the cleaning checklist.</CardDescription>
                  </div>
                  <Button onClick={() => openDialog("cleaningTask")}><PlusCircle className="mr-2 h-4 w-4" /> Add Cleaning Task</Button>
                </div>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Area</TableHead><TableHead>Frequency</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cleaningTasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>{t.name}</TableCell><TableCell>{t.area}</TableCell>
                        <TableCell><Badge variant="secondary">{getFrequencyLabel(t.frequency)}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate">{t.description || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("cleaningTask", t)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => deleteItem("cleaningTask", t.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="parameters">
            <Card>
              <CardHeader><CardTitle>System Parameters</CardTitle><CardDescription>Configure general application settings and thresholds (Placeholder).</CardDescription></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Parameter configuration section will be implemented here. This could include things like default temperature ranges, alert notification settings, user roles, etc.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add New"} {currentForm?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
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
            {currentForm === "cleaningTask" && (
              <form onSubmit={cleaningTaskForm.handleSubmit(handleCleaningTaskSubmit)} className="space-y-4">
                <Controller name="name" control={cleaningTaskForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="ct_name">Task Name</Label><Input id="ct_name" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller name="area" control={cleaningTaskForm.control} render={({ field, fieldState }) => (<div><Label htmlFor="ct_area">Area</Label><Input id="ct_area" {...field} /> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />
                <Controller
                  name="frequency"
                  control={cleaningTaskForm.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Label htmlFor="ct_frequency">Frequency</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="ct_frequency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem><SelectItem value="as_needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller name="description" control={cleaningTaskForm.control} render={({ field }) => (<div><Label htmlFor="ct_desc">Description</Label><Textarea id="ct_desc" {...field} /></div>)} />
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
              </form>
            )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
