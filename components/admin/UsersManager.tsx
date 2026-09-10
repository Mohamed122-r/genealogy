"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createUser, deleteUser } from "@/server/actions/user.actions";
import { Role } from "@prisma/client";

interface UserType {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
}

export function UsersManager({ initialUsers }: { initialUsers: UserType[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EDITOR");
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser({ name, email, password, role });
      toast({ title: "نجاح", description: "تم إضافة المستخدم" });
      router.refresh();
      setName(""); setEmail(""); setPassword(""); setRole("EDITOR");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser(id);
      toast({ title: "نجاح", description: "تم حذف المستخدم" });
      router.refresh();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8">
      <Card className="bg-white border-gold-500/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-deep-green flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            إضافة مستخدم جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select onValueChange={(val) => setRole(val as Role)} value={role}>
                <SelectTrigger>
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">مدير النظام</SelectItem>
                  <SelectItem value="ADMIN">مدير</SelectItem>
                  <SelectItem value="EDITOR">محرر</SelectItem>
                  <SelectItem value="VIEWER">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="bg-gold-500 hover:bg-gold-600 text-deep-green md:col-span-4">
              إضافة المستخدم
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {initialUsers.map((user) => (
          <Card key={user.id} className="bg-white border-gold-500/30 shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-deep-green">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full bg-deep-green text-white text-xs font-semibold">
                  {user.role === 'SUPER_ADMIN' ? 'مدير النظام' : 
                   user.role === 'ADMIN' ? 'مدير' : 
                   user.role === 'EDITOR' ? 'محرر' : 'مشاهد'}
                </span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
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