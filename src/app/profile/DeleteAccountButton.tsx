'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "./actions";
import { cn } from "@/lib/utils";
import { RecaptchaWidget } from '@/components/ui/RecaptchaWidget'; // Import the new component

export function DeleteAccountButton() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <AlertDialog onOpenChange={(open) => {
        if (!open) {
            // Reset verification state when dialog closes
            setIsVerified(false);
        }
    }}>
        <AlertDialogTrigger asChild>
            <Button
                variant="ghost"
                className={cn(
                    "bg-white/50 text-black hover:bg-white hover:text-black flex-1 min-w-[150px] transition-colors duration-200",
                    "text-destructive hover:bg-destructive/10 hover:text-destructive"
                )}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Удалить аккаунт</span>
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-xl">
            <form action={deleteAccount}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие невозможно отменить. Ваш аккаунт будет помечен для удаления, а доступ к нему будет заблокирован. 
                        Если вы уверены в своих действиях, пожалуйста, пройдите проверку, чтобы продолжить.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="my-4 flex justify-center">
                    {/* Use the new, simplified component */}
                    <RecaptchaWidget onVerified={setIsVerified} />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <Button type="submit" variant="destructive" disabled={!isVerified}>
                        Удалить
                    </Button>
                </AlertDialogFooter>
            </form>
        </AlertDialogContent>
    </AlertDialog>
  );
}
