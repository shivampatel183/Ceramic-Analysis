import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function SmallDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="px-3 py-1 text-sm rounded-lg">Open</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-800">
            Add New Entry
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-600 space-y-2">
          <p>Enter details for your new production entry below:</p>

          <input
            type="text"
            placeholder="Ceramic Name"
            className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-400"
          />

          <Button className="w-full mt-3 text-sm py-2">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
