"use server";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { getUser, login } from "@/lib/auth.model";
import { redirect } from "next/navigation";

const Login: React.FC = async () => {
  const user = await getUser();

  if (user.isJust()) {
    redirect("/checklists");
  }

  return (
    <form className="space-y-2" action={login}>
      <Heading level={1}>Log in</Heading>

      <Label label="Username">
        <Input type="text" required name="username" />
      </Label>

      <Label label="Password">
        <Input type="password" required name="password" />
      </Label>

      <Button variant="primary">Log in</Button>
    </form>
  );
};

export default Login;
