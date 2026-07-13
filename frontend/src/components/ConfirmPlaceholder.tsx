import { ShieldAlert } from "lucide-react";

interface ConfirmPlaceholderProps {
  label: string;
}

export function ConfirmPlaceholder({ label }: ConfirmPlaceholderProps) {
  return (
    <button className="ghost-action ghost-action--risk" type="button" title={`${label}需要确认`}>
      <ShieldAlert size={13} />
      {label}
    </button>
  );
}
