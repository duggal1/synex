import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-[100px]"
        />
        <Input 
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
