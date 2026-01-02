import { redirect } from "next/navigation";

import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { loginAction } from "./actions/login.action";
import { getUser } from "@/lib/auth/get-user";

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

      <Button variant="primary">Log in</Button>
    </form>
  );
};

export default Login;
