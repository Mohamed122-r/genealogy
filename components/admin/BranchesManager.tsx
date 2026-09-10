"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, GitBranch } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createBranch, updateBranch, deleteBranch } from "@/server/actions/branch.actions";

interface Branch {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: { people: number };
}

export function BranchesManager({ initialBranches }: { initialBranches: Branch[] }) {
  const [branches, setBranches] = useState(initialBranches);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0F3D2E");
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBranch(editingId, { name, description, color });
        toast({ title: "نجاح", description: "تم تعديل الفرع" });
      } else {
        await createBranch({ name, description, color });
        toast({ title: "نجاح", description: "تم إضافة الفرع" });
      }
      router.refresh();
      setEditingId(null);
      setName("");
      setDescription("");
      setColor("#0F3D2E");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  }

  function handleEdit(branch: Branch) {
    setEditingId(branch.id);
    setName(branch.name);
    setDescription(branch.description || "");
    setColor(branch.color);
  }

  async function handleDelete(id: string) {
    try {
      await deleteBranch(id);
      toast({ title: "نجاح", description: "تم حذف الفرع" });
      router.refresh();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* نموذج الإضافة/التعديل */}
      <Card className="bg-white border-gold-500/30 shadow-lg h-fit">
        <CardHeader>
          <CardTitle className="text-deep-green flex items-center gap-2">
            <GitBranch className="w-6 h-6" />
            {editingId ? "تعديل فرع" : "إضافة فرع جديد"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الفرع</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">اللون المميز</Label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  id="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-deep-green">
              {editingId ? "حفظ التعديلات" : "إضافة الفرع"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" className="w-full" onClick={() => { setEditingId(null); setName(""); setDescription(""); setColor("#0F3D2E"); }}>
                إلغاء التعديل
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* قائمة الفروع */}
      <div className="lg:col-span-2 space-y-4">
        {branches.map((branch) => (
          <Card key={branch.id} className="bg-white border-gold-500/30 shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: branch.color }} />
                <div>
                  <h3 className="text-xl font-bold text-deep-green">{branch.name}</h3>
                  <p className="text-sm text-gray-500">{branch.description || "بدون وصف"}</p>
                  <p className="text-xs text-gold-600 mt-1">{branch._count.people} شخص مرتبط</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                  <Pencil className="w-4 h-4 text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}