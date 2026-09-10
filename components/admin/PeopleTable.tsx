"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Person, Branch } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { deletePerson } from "@/server/actions/person.actions";
import { PersonFormModal } from "@/components/admin/PersonFormModal";
import { useToast } from "@/components/ui/use-toast";

interface PeopleTableProps {
  people: (Person & { father: { fullName: string } | null; branch: { name: string } | null; children: { id: string }[] })[];
  branches: Branch[];
}

export function PeopleTable({ people, branches }: PeopleTableProps) {
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete(id: string) {
    try { await deletePerson(id); toast({ title: "تم الحذف", description: "تم حذف الشخص" }); router.refresh(); }
    catch (error: any) { toast({ title: "خطأ", description: error.message || "لا يمكن الحذف", variant: "destructive" }); }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gold-500/30 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-deep-green text-white">
            <TableRow>
              <TableHead className="text-white">الاسم الكامل</TableHead>
              <TableHead className="text-white">الحالة</TableHead>
              <TableHead className="text-white">الفرع</TableHead>
              <TableHead className="text-white">الأب</TableHead>
              <TableHead className="text-white">عدد الأبناء</TableHead>
              <TableHead className="text-white">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-medium">{person.fullName}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-semibold ${person.status === 'ALIVE' ? 'bg-green-100 text-green-800' : person.status === 'DECEASED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{person.status === 'ALIVE' ? 'حي' : person.status === 'DECEASED' ? 'متوفى' : person.status === 'DISCONNECTED' ? 'منقطع' : 'غير معروف'}</span></TableCell>
                <TableCell>{person.branch?.name || "بدون فرع"}</TableCell>
                <TableCell>{person.father?.fullName || "جذر الشجرة"}</TableCell>
                <TableCell>{person.children.length}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingPerson(person as any); setIsModalOpen(true); }}><Pencil className="w-4 h-4 text-blue-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(person.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button className="bg-gold-500 hover:bg-gold-600 text-deep-green" onClick={() => { setEditingPerson(null); setIsModalOpen(true); }}>+ إضافة شخص</Button>
      <PersonFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} person={editingPerson} branches={branches} people={people} />
    </>
  );
}