import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

type SwitchChoiceCardProps = {
  id: string;
  title: string;
  description?: string | null;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SwitchChoiceCard({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: SwitchChoiceCardProps) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>{title}</FieldTitle>
            {description && <FieldDescription>{description}</FieldDescription>}
          </FieldContent>
          <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
        </Field>
      </FieldLabel>
    </FieldGroup>
  );
}
export default SwitchChoiceCard;
