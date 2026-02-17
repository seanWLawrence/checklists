import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";

export const SinceFilterForm: React.FC<{
  action: (formData: FormData) => void | Promise<void>;
  defaultSince: string;
  className?: string;
}> = ({ action, defaultSince, className }) => {
  return (
    <form className={className} action={action}>
      <Label
        label={
          <span className="flex flex-col space-y-1">
            <span>Since</span>
            <span>(YYYY-MM-DDtoYYYY-MM-DD)</span>
          </span>
        }
      >
        <Input
          name="since"
          defaultValue={defaultSince}
          pattern="\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}"
          className="min-w-56"
        />
      </Label>

      <SubmitButton variant="primary">Filter</SubmitButton>
    </form>
  );
};
