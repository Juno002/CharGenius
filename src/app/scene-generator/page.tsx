import { SceneGenerator } from "@/components/SceneGenerator";
import { SavedScenes } from "@/components/SavedScenes";
import { Separator } from "@/components/ui/separator";

export default function SceneGeneratorPage() {
    return (
        <div className="space-y-6">
            <SceneGenerator />
            <Separator className="my-8" />
            <SavedScenes />
        </div>
    );
}
