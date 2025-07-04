import { InternalSenate } from '@/components/InternalSenate';
import { SavedSenateSessions } from '@/components/SavedSenateSessions';
import { Separator } from '@/components/ui/separator';

export default function InternalSenatePage() {
    return (
        <div className="space-y-6">
            <InternalSenate />
            <Separator className="my-8" />
            <SavedSenateSessions />
        </div>
    );
}
