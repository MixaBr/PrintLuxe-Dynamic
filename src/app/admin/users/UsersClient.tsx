
'use client';

import { useState, useTransition, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { updateUserRole, deleteUser, type UserWithRoleAndProfile, updateUserStatus } from "./actions";

interface UsersClientProps {
  users: UserWithRoleAndProfile[];
  currentUserId: string | undefined;
}

// Новый компонент для безопасного рендеринга дат на клиенте
const ClientSideDate = ({ dateString }: { dateString: string | undefined }) => {
  const [formattedDate, setFormattedDate] = useState('—');

  useEffect(() => {
    if (dateString) {
      try {
        setFormattedDate(format(new Date(dateString), "dd.MM.yyyy HH:mm"));
      } catch (e) {
        setFormattedDate('Неверная дата');
      }
    }
  }, [dateString]);

  return <>{formattedDate}</>;
};


export function UsersClient({ users, currentUserId }: UsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [userToDelete, setUserToDelete] = useState<UserWithRoleAndProfile | null>(null);

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        toast({ variant: "destructive", title: "Ошибка", description: result.error });
      } else {
        toast({ title: "Успех", description: `Роль пользователя обновлена на "${newRole}".` });
        router.refresh();
      }
    });
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateUserStatus(userId, newStatus);
      if (result.error) {
        toast({ variant: "destructive", title: "Ошибка", description: result.error });
      } else {
        toast({ title: "Успех", description: `Статус пользователя обновлен на "${newStatus}".` });
        router.refresh();
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const result = await deleteUser(userToDelete.id);
      if (result.error) {
        toast({ variant: "destructive", title: "Ошибка", description: result.error });
      } else {
        toast({ title: "Успех", description: `Пользователь ${userToDelete.email} был удален.` });
      }
      setUserToDelete(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="hidden md:table-cell">Дата регистрации</TableHead>
              <TableHead className="hidden lg:table-cell">Последний вход</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={isPending && (userToDelete?.id === user.id) ? 'opacity-50' : ''}>
                <TableCell>
                  <div className="font-medium">{user.first_name || 'Имя не'} {user.last_name || 'указано'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                   <Select
                        defaultValue={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={user.id === currentUserId || isPending}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="buyer">Buyer</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
                 <TableCell>
                    <Select
                        defaultValue={user.status || 'active'}
                        onValueChange={(newStatus) => handleStatusChange(user.id, newStatus)}
                        disabled={user.id === currentUserId || isPending}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                            <SelectItem value="pending_verification">Pending Verification</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ClientSideDate dateString={user.created_at} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <ClientSideDate dateString={user.last_sign_in_at} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={user.id === currentUserId || isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Действия</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setTimeout(() => setUserToDelete(user), 150)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие полностью удалит пользователя <strong className="font-mono">{userToDelete?.email}</strong> и все его данные (профиль, заказы, адреса). Это действие невозможно отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Да, удалить пользователя
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
