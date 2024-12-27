"use client";

import { useActionState } from "react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Heading } from "@/components/heading";
import { generateUserCredentialsAction } from "./actions/generate-user-credentials.action";

const GenerateUserCredentials: React.FC = () => {
  const [state, formAction] = useActionState(generateUserCredentialsAction, {
    passwordHash: "",
    salt: "",
  });

  return (
    <section className="space-y-4">
      <Heading level={1}>Generate user credentials</Heading>

      <form className="space-y-2" action={formAction}>
        <Label label="Password">
          <Input
            type="password"
            required
            name="password"
            autoComplete="password"
          />
        </Label>

        <Button variant="outline">Generate</Button>
      </form>

      <div className="space-y-2">
        <Heading level={3}>Generated credentials</Heading>

        <Label label="Password hash">
          <Input value={state.passwordHash} readOnly className="bg-zinc-100" />
        </Label>

        <Label label="Salt">
          <Input value={state.salt} readOnly className="bg-zinc-100" />
        </Label>
      </div>
    </section>
  );
};

export default GenerateUserCredentials;
