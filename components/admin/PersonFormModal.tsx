"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/components/ui/use-toast";
import { createPerson, updatePerson } from "@/server/actions/person.actions";
import { personSchema, PersonFormData } from "@/lib/validations/person";
import { Person, Branch, PersonStatus, Gender } from "@prisma/client";
import { Loader2 } from "lucide-react";

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  person?: Person | null;
  branches: Branch[];
  people: Person[];
}

export function PersonFormModal({ isOpen, onClose, person, branches, people }: PersonFormModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تجهيز خيارات الأب (الاستبعاد الذاتي)
  const fatherOptions = people
    .filter(p => p.id !== person?.id && p.gender === "MALE")
    .map(p => ({
      value: p.id,
      label: p.fullName,
      description: `الأب: ${p.fatherId ? people.find(f => f.id === p.fatherId)?.fullName : "غير معروف"} | الحالة: ${p.status}`
    }));

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: Gender.MALE,
      status: PersonStatus.ALIVE,
      fatherId: null,
      branchId: null,
      birthDate: "",
      deathDate: "",
      notes: "",
    },
  });

  // تعبئة البيانات عند التعديل
  useEffect(() => {
    if (person) {
      form.reset({
        firstName: person.firstName,
        lastName: person.lastName,
        gender: person.gender,
        status: person.status,
        fatherId: person.fatherId,
        branchId: person.branchId,
        birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : "",
        deathDate: person.deathDate ? new Date(person.deathDate).toISOString().split('T')[0] : "",
        notes: person.notes || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        gender: Gender.MALE,
        status: PersonStatus.ALIVE,
        fatherId: null,
        branchId: null,
        birthDate: "",
        deathDate: "",
        notes: "",
      });
    }
  }, [person, form]);

  async function onSubmit(data: PersonFormData) {
    setIsSubmitting(true);
    try {
      if (person) {
        await updatePerson(person.id, data);
        toast({ title: "نجاح", description: "تم تعديل بيانات الشخص بنجاح" });
      } else {
        await createPerson(data);
        toast({ title: "نجاح", description: "تم إضافة الشخص بنجاح" });
      }
      router.refresh();
      onClose();
    } catch (error: any) {
      toast({ 
        title: "خطأ", 
        description: error.message || "حدث خطأ أثناء الحفظ", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-heritage-bg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heritage text-deep-green">
            {person ? "تعديل بيانات الشخص" : "إضافة شخص جديد"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأول</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: محمد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم العائلة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: القحطاني" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجنس</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">ذكر</SelectItem>
                        <SelectItem value="FEMALE">أنثى</SelectItem>
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
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALIVE">حي</SelectItem>
                        <SelectItem value="DECEASED">متوفى</SelectItem>
                        <SelectItem value="DISCONNECTED">منقطع</SelectItem>
                        <SelectItem value="UNKNOWN">غير معروف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fatherId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>الأب</FormLabel>
                    <FormControl>
                      <Combobox 
                        options={fatherOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="ابحث عن الأب..."
                        emptyMessage="لا يوجد آباء مطابقين"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفرع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفرع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الميلاد</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deathDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الوفاة</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Input placeholder="ملاحظات إضافية..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gold-500 hover:bg-gold-600 text-deep-green">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "حفظ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}