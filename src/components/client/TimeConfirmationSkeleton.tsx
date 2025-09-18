import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TimeConfirmationSkeleton() {
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mx-auto h-20 w-32" />
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
