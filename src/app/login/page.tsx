import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { redirect } from "next/navigation";
import { loginAction } from "./actions";

const Login: React.FC = async () => {
  await validateUserLoggedIn({}).ifLeft(() => {
    redirect("/checklists");
  });

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
