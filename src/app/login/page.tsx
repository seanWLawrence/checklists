import { redirect } from "next/navigation";

import { SubmitButton } from "@/components/submit-button";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { loginAction } from "./actions/login.action";
import { getUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";

const Login: React.FC = async () => {
  const userMaybe = await getUser({});

  if (userMaybe.isJust()) {
    redirect("/checklists");
  }

  return (
    <form className="space-y-2" action={loginAction}>
      <Heading level={1}>Log in</Heading>

      <Label label="Username">
        <Input type="text" required name="username" autoComplete="username" />
      </Label>

      <Label label="Password">
        <Input
          type="password"
          required
          name="password"
          autoComplete="password"
        />
      </Label>

      <SubmitButton variant="primary">Log in</SubmitButton>
    </form>
  );
};

export default Login;
